function drawRadarShape(jsonObj, lati, lngi) {
  var settings = {};
  settings["rlat"] = lati;
  settings["rlon"] = lngi;
  // phi is elevation
  settings["phi"] = 0.483395;
  settings["base"] = jsonObj;


  function createTexture(gl) {
    /*
    color: 0 0 0 0
    color: 10 67 97 162 106 208 228
    color: 18 111 214 232 53 213 91
    color: 22 17 213 24 9 94 9
    color: 35 29 104 9 234 210 4 
    color: 40 255 226 0 255 128 0
    color: 50 255 0 0 113 0 0
    color: 60 255 255 255 255 146 255
    color: 65 255 117 255 225 11 227
    color: 70 178 0 255 99 0 214
    color: 75 5 236 240 1 32 32
    color: 85 1 32 32
    color: 95 1 32 32
    */
    // https://github.com/Unidata/MetPy/blob/main/src/metpy/plots/colortable_files/NWSReflectivityExpanded.tbl
    var colors = {"refc0":[
      "#646464",
      '#ccffff',
      '#cc99cc',
      '#996699',
      '#663366',
      '#999966',
      '#646464',
      '#04e9e7',
      '#019ff4',
      '#0300f4',
      '#02fd02',
      '#01c501',
      '#008e00',
      '#fdf802',
      '#e5bc00',
      '#fd9500',
      '#fd0000',
      '#d40000',
      '#bc0000',
      '#f800fd',
      '#9854c6',
      '#fdfdfd'
    ]}
    var values = {"refc0":[
      -30, -25, -20, -15, -10, -5, 0,
      5, 10, 15, 20, 25, 30, 35, 40,
      45, 50, 55, 60, 65, 70, 75
    ]}
    var colors=colors["refc0"];
    var levs=values["refc0"];
    var colortcanvas=document.getElementById("texturecolorbar");
    colortcanvas.width=1200;
    colortcanvas.height=1;
    var ctxt = colortcanvas.getContext('2d');
    ctxt.clearRect(0,0,colortcanvas.width,colortcanvas.height); 
    var grdt=ctxt.createLinearGradient(0,0,1200,0);
    var cmax=values.refc0[values.refc0.length-1];
    var cmin=values.refc0[0];
    var clen=colors.length;

    for (var i=0;i<clen;++i) {
      grdt.addColorStop((levs[i]-cmin)/(cmax-cmin),colors[i]);
    }
    ctxt.fillStyle=grdt;
    ctxt.fillRect(0,0,1200,1);
    imagedata=ctxt.getImageData(0,0,1200,1);
    imagetexture=gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D,imagetexture);
    pageState.imagetexture = imagetexture;
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,imagedata)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  }

  function dataStore() {
     return {
       positions:null,
       indices:null,
       colors:null
     }
  }

  var pageState = dataStore();

  var myWorker = new Worker('./polygonTest/generateVerticesRadarDemo.js');
  myWorker.onmessage=function(oEvent) {
    var data = new Float32Array(oEvent.data.data);
    var indices = new Int32Array(oEvent.data.indices);
    var colors = new Float32Array(oEvent.data.colors);
    var returnedGeojson = oEvent.data.geojson;
    pageState.positions = data;
    pageState.indices = indices;
    pageState.colors = colors;
    map.addLayer(layer);
  }

  myWorker.postMessage([settings["base"],settings["phi"],settings["rlat"],settings["rlon"]]);

  //compile shaders
  var vertexSource = `
    //x: azimuth
    //y: range
    //z: value
    attribute vec2 aPosition;
    attribute float aColor;
    uniform mat4 u_matrix;
    varying float color;

    void main() {
        color = aColor;
        gl_Position = u_matrix * vec4(aPosition.x,aPosition.y,0.0,1.0);
    }`;
  var fragmentSource = `
    precision mediump float;
    varying float color;
    uniform sampler2D u_texture;
    void main() {
        //gl_FragColor = vec4(0.0,color/60.0,0.0,1.0);
        float calcolor = (color)/(70.0);
        gl_FragColor = texture2D(u_texture,vec2(min(max(calcolor,0.0),1.0),0.0));
        //gl_FragColor = vec4(1.0,0.0,0.0,1.0);
    }`
  var masterGl;
  var layer = {
    id:"baseReflectivity",
    type:"custom",
    minzoom:0,
    maxzoom:18,

    onAdd: function(map,gl) {
      masterGl = gl;
      createTexture(gl);

      var ext = gl.getExtension('OES_element_index_uint');
      var vertexShader=gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vertexShader, vertexSource);
      gl.compileShader(vertexShader);
      var compilationLog = gl.getShaderInfoLog(vertexShader);
      console.log('Shader compiler log: ' + compilationLog);
      var fragmentShader=gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fragmentShader, fragmentSource);
      gl.compileShader(fragmentShader);
      var compilationLog = gl.getShaderInfoLog(fragmentShader);
      console.log('Shader compiler log: ' + compilationLog);
      this.program = gl.createProgram();
      gl.attachShader(this.program, vertexShader);
      gl.attachShader(this.program, fragmentShader);
      gl.linkProgram(this.program);
      this.matrixLocation = gl.getUniformLocation(this.program, "u_matrix");
      this.positionLocation = gl.getAttribLocation(this.program, "aPosition");
      this.colorLocation = gl.getAttribLocation(this.program, "aColor");
      this.textureLocation=gl.getUniformLocation(this.program,"u_texture");

      //data buffers
      this.positionBuffer = gl.createBuffer();
      this.indexBuffer = gl.createBuffer();
      this.colorBuffer = gl.createBuffer();
    },//end onAdd
    render: function(gl,matrix) {
      //console.log("render base");
      var ext = gl.getExtension('OES_element_index_uint');
      //use program
      gl.useProgram(this.program);
      //how to remove vertices from position buffer
      var size=2;
      var type=gl.FLOAT;
      var normalize=false;
      var stride=0;
      var offset=0;
      //calculate matrices
      gl.uniformMatrix4fv(this.matrixLocation,false,matrix);
      gl.uniform1i(this.textureLocation,0);
      gl.bindBuffer(gl.ARRAY_BUFFER,this.positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER,pageState.positions,gl.STATIC_DRAW);
      gl.enableVertexAttribArray(this.positionLocation);
      gl.vertexAttribPointer(this.positionLocation,size,type,normalize,stride,offset);
      
      gl.bindBuffer(gl.ARRAY_BUFFER,this.colorBuffer);
      gl.bufferData(gl.ARRAY_BUFFER,pageState.colors,gl.STATIC_DRAW);
      gl.enableVertexAttribArray(this.colorLocation);
      gl.vertexAttribPointer(this.colorLocation,1,type,normalize,stride,offset);

      gl.bindTexture(gl.TEXTURE_2D,pageState.imagetexture);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,imagedata)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

      var primitiveType = gl.TRIANGLES;
      var count = pageState.indices.length;
      gl.drawArrays(primitiveType, offset, pageState.positions.length/2);

    }//end render
  }
}