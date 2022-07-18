function onload() {
  var settings = {};
  settings["lat"]=35.0;
  settings["lon"]=-101.72;
  settings["mlat"]=34.95;
  settings["mlon"]=-101.75;
  settings["rlat"]=35.2333;
  settings["rlon"]=-101.709;
  settings["phi"]=0.483395;
  settings["base"] = "./polygonTest/KAMA_sub.json";


  //set up mapbox map
  mapboxgl.accessToken=
    "pk.eyJ1IjoicXVhZHdlYXRoZXIiLCJhIjoiY2pzZTI0cXFjMDEyMTQzbnQ2MXYxMzd2YSJ9.kHgQu2YL36SZUgpXMlfaFg";

  var map=window.map=new mapboxgl.Map({
    container:'map',
    attributionControl:false,
    zoom:3,
    maxZoom:14,
    minZoom:3,
  //overlaying custom made mapboxGL map
//    style: 'mapbox://styles/quadweather/cjsgo4h6905rg1fmcimx6j9dr'
    style: 'mapbox://styles/quadweather/ckftuk99o0lar1at0siprao95',
    antialias:true,
    zoom:9,
    center:[settings.mlon, settings.mlat],
    pitch:70.,
    bearing:315
  });
  map.addControl(new mapboxgl.AttributionControl(),'top-right');
  map.addControl(new mapboxgl.NavigationControl(),'top-left');

  function createTexture(gl) {
    var colors = {"refc0":['rgba(59,59,59,1)', //0
          'rgba(59,59,59,1)', //10
          'rgba(0,151,189,1)', //20
          'rgba(21,166,2,1)',   //30
          'rgba(250,208,0,1)',  //40
          'rgba(240,124,18,1)', //50
          'rgba(214,18,0,1)', //60
          'rgba(201,92,255,1)', //70
        ]}
    var values = {"refc0":[0,10,17.5,25,35,50,60,70]}
    var colors=colors["refc0"];
    var levs=values["refc0"];
    var colortcanvas=document.getElementById("texturecolorbar");
    colortcanvas.width=1200;
    colortcanvas.height=1;
    var ctxt = colortcanvas.getContext('2d');
    ctxt.clearRect(0,0,colortcanvas.width,colortcanvas.height); 
    var grdt=ctxt.createLinearGradient(0,0,1200,0);
    var cmax=70;
    var cmin=0;
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

  map.on("load", function() {
    //map.addLayer(layer3d);
    myWorker.postMessage([settings["base"],settings["phi"],settings["rlat"],settings["rlon"]]);
  })

  //compile shaders
  var vertexSource = document.getElementById('vertexShader').textContent;
  var fragmentSource = document.getElementById('fragmentShader').textContent;
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
    pageState.positions = data;
    pageState.indices = indices;
    pageState.colors = colors;
    map.addLayer(layer,'land-structure-line');
  }
  function doneResizing() {
    document.body.height=window.innerHeight;
    window.scrollTo(0,0);
    map.resize();
  }
  var resizeId;
  window.addEventListener('resize',function() {
    clearTimeout(resizeId);
    resizeId=setTimeout(doneResizing,300);
  });
}

window.onload = onload();
