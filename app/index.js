var parser = document.createElement('a');
parser.href = window.location.href;
console.log(parser.hash);

var allParserArgs = parser.hash.split('&');
console.log(allParserArgs)

var isDevelopmentMode = false;
for (key in allParserArgs) {
    if (allParserArgs[key].includes('#station=')) {
        console.log('we got a station URL parameter!');
        $('#stationInp').val(allParserArgs[key].slice(9, 13));
    }
    if (allParserArgs[key].includes('#development')) {
        console.log('we got a development mode URL parameter!');
        isDevelopmentMode = true;
    }
}

function listTilts(tiltsArr) {
    //<li><a class="dropdown-item" href="#" value="tilt1">Tilt 1</a></li>
    $('#tiltMenu').empty();
    for (key in tiltsArr) {
        var anchorElem = document.createElement('a');
        anchorElem.className = 'dropdown-item';
        anchorElem.href = '#';
        anchorElem.setAttribute('value', `tilt${tiltsArr[key]}`);
        anchorElem.innerHTML = `Tilt ${tiltsArr[key]}`

        var lineElem = document.createElement('li');
        lineElem.appendChild(anchorElem)
        //console.log(lineElem)
        document.getElementById('tiltMenu').appendChild(lineElem);
        if (key == 0) {
            document.getElementById('tiltDropdownBtn').innerHTML = `Tilt ${tiltsArr[key]}`;
        }
    }
}
listTilts([1, 2, 3, 4]);

function logToModal(textContent) {
    console.log(textContent);
    function openMessageModal() {
        $("#messageDialog").dialog({
            modal: true,
            // https://stackoverflow.com/a/30624445/18758797
            open: function () {
                $(this).parent().css({
                    position: 'absolute',
                    top: 10,
                    maxHeight: '70vh',
                    overflow: 'scroll'
                });
            },
        });
    }
    if (!($("#messageDialog").dialog('instance') == undefined)) {
        // message box is already initialized
        if (!$('#messageDialog').closest('.ui-dialog').is(':visible')) {
            // message box is initialized but hidden - open it
            openMessageModal();
        }
    } else if ($("#messageDialog").dialog('instance') == undefined) {
        // message box is not initialized, open it
        openMessageModal();
    }
    $('#messageBox').append(`<div>${textContent}</div>`);
    $("#messageBox").animate({ scrollTop: $("#messageBox")[0].scrollHeight }, 0);
}

function xmlToJson(xml) {
    if (typeof xml == "string") {
        parser = new DOMParser();
        xml = parser.parseFromString(xml, "text/xml");
    }
    // Create the return object
    var obj = {};
    // console.log(xml.nodeType, xml.nodeName );
    if (xml.nodeType == 1) { // element
        // do attributes
        if (xml.attributes.length > 0) {
            obj["@attributes"] = {};
            for (var j = 0; j < xml.attributes.length; j++) {
                var attribute = xml.attributes.item(j);
                obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
            }
        }
    }
    else if (xml.nodeType == 3 ||
        xml.nodeType == 4) { // text and cdata section
        obj = xml.nodeValue
    }
    // do children
    if (xml.hasChildNodes()) {
        for (var i = 0; i < xml.childNodes.length; i++) {
            var item = xml.childNodes.item(i);
            var nodeName = item.nodeName;
            if (typeof (obj[nodeName]) == "undefined") {
                obj[nodeName] = xmlToJson(item);
            } else {
                if (typeof (obj[nodeName].length) == "undefined") {
                    var old = obj[nodeName];
                    obj[nodeName] = [];
                    obj[nodeName].push(old);
                }
                if (typeof (obj[nodeName]) === 'object') {
                    obj[nodeName].push(xmlToJson(item));
                }
            }
        }
    }
    return obj;
}
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    var k = 1024;
    var dm = decimals < 0 ? 0 : decimals;
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    var i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

mapboxgl.accessToken = 'pk.eyJ1Ijoic3RlZXBhdHRpY3N0YWlycyIsImEiOiJjbDNvaGFod2EwbXluM2pwZTJiMDYzYjh5In0.J_HeH00ry0tbLmGmTy4z5w';
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v10',
    zoom: 3,
    center: [-98.5606744, 36.8281576],
    //projection: 'equirectangular',
});
var phpProxy = 'https://php-cors-proxy.herokuapp.com/?';
map.on('load', function () {
    /*map.addLayer({
        'id': `wms-test-layer`,
        'type': 'raster',
        'source': {
            'type': 'raster',
            // use the tiles option to specify a WMS tile source URL
            // https://docs.mapbox.com/mapbox-gl-js/style-spec/sources/
            'tiles': [
                `${phpProxy}https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/ridge::JAX-N0B-0/{z}/{x}/{y}.png`
                //'https://img.nj.gov/imagerywms/Natural2015?bbox={bbox-epsg-3857}&format=image/png&service=WMS&version=1.1.1&request=GetMap&srs=EPSG:3857&transparent=true&width=256&height=256&layers=Natural2015'
                //'https://opengeo.ncep.noaa.gov/geoserver/klwx/klwx_bref_raw/ows?&service=WMS&request=GetMap&layers=&styles=&format=image/png&transparent=true&version=1.1.1&SERVICE=WMS&LAYERS=klwx_bref_raw&width=256&height=256&srs=EPSG:3857&bbox={bbox-epsg-3857}'
                //https://opengeo.ncep.noaa.gov/geoserver/klwx/klwx_bref_raw/ows?&service=WMS&request=GetMap&layers=&styles=&format=image/png&transparent=true&version=1.1.1&SERVICE=WMS&LAYERS=klwx_bref_raw&width=256&height=256&srs=EPSG:3857&bbox=-20037508.342789244,0,-10018754.171394622,10018754.17139462
            ],
            'tileSize': 256
        },
    });*/
})

function loadFileObject(path, name, level, product) {
    var radLevel;
    var wholeOrPart = 'whole';
    if (level == 2) {
        radLevel = 'level2';
    } if (level == 22) {
        radLevel = 'level2';
        wholeOrPart = 'part';
    } else if (level == 3) {
        radLevel = 'level3';
    }
    var xhr = new XMLHttpRequest();
    xhr.open("GET", path);
    xhr.responseType = "blob";
    xhr.addEventListener('load', function () {
        var blob = xhr.response;
        blob.lastModifiedDate = new Date();
        blob.name = name;
        // Create the event
        var event = new CustomEvent("loadFile", {
            "detail": [
                blob,
                radLevel,
                wholeOrPart,
                product
            ]
        });
        // Dispatch/Trigger/Fire the event
        document.dispatchEvent(event);
    });
    xhr.onprogress = (event) => {
        // event.loaded returns how many bytes are downloaded
        // event.total returns the total number of bytes
        // event.total is only available if server sends `Content-Length` header
        //console.log(`%c Downloaded ${formatBytes(event.loaded)} of ${formatBytes(event.total)}`, 'color: #bada55');
        //var complete = (event.loaded / event.total * 50 | 0);
        console.log(formatBytes(event.loaded))
    }
    xhr.send();
}

// https://github.com/mapbox/mapbox-gl-js/issues/3039#issuecomment-401964567
function registerControlPosition(map, positionName) {
    if (map._controlPositions[positionName]) {
        return;
    }
    var positionContainer = document.createElement('div');
    positionContainer.className = `mapboxgl-ctrl-${positionName}`;
    map._controlContainer.appendChild(positionContainer);
    map._controlPositions[positionName] = positionContainer;
}
registerControlPosition(map, 'top-center');
registerControlPosition(map, 'bottom-center');
registerControlPosition(map, 'center');

class infoControl {
    onAdd(map) {
        this._map = map;
        this._container = document.createElement('div');
        this._container.innerHTML = `
                    <div id='infoContainer' style='
                    display: none;
                    text-align: center;
                    width: auto;
                    height: auto;
                    padding: 5px 10px;
                    /* line-height: 25px; */
                    background-color: white;
                    border: 1px solid black;
                    border-radius: 5px;
                    '>
                        <input id="fileInput" type="file"/>
                        <div id='radarInfoDiv' style='display: none'>
                            <div id='radFileNameParent'><b><a id='radFileName'></a></b></div>
                            <div id='radDateParent'><b>Date: </b><a id='radDate'></a></div>
                            <b>Station: </b><a id='radStation'></a>
                            <b>VCP: </b><a id='radVCP'></a>
                        </div>
                    </div>`
        this._container.addEventListener('click', function () {
            console.log('sus')
        })
        return this._container;
    }

    onRemove() {
        this._container.parentNode.removeChild(this._container);
        this._map = undefined;
    }
}
var theInfoControl = new infoControl
map.addControl(theInfoControl, 'top-center');

class infoControlBottom {
    onAdd(map) {
        this._map = map;
        this._container = document.createElement('div');
        this._container.innerHTML = `
                    <div id='infoContainerBottom' style='
                    text-align: center;
                    width: auto;
                    height: auto;
                    padding: 5px 10px;
                    /* line-height: 25px; */
                    background-color: white;
                    border: 1px solid black;
                    border-radius: 5px;
                    '>
                        <canvas id="texturecolorbar" class="texturecolorbar" data-bs-toggle="tooltip" data-bs-placement="bottom" data-bs-title="Default tooltip" data-bs-animation="false"></canvas>
                    </div>`
        return this._container;
    }

    onRemove() {
        this._container.parentNode.removeChild(this._container);
        this._map = undefined;
    }
}
var theInfoControlBottom = new infoControlBottom
map.addControl(theInfoControlBottom, 'top-center');

document.getElementById("texturecolorbar").width = 0;
document.getElementById("texturecolorbar").height = 0;

// enable bootstrap tooltips
const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

function showPlotBtn() {
    class reflPlotControl {
        onAdd(map) {
            this._map = map;
            this._container = document.createElement('div');
            this._container.innerHTML = `
                        <div class="mapboxgl-control-container" style="margin-top: 100%;">
                            <div class="mapboxgl-ctrl mapboxgl-ctrl-group">
                                <button class="mapboxgl-ctrl-fullscreen" type="button" aria-label="Globe Toggle">
                                    <span class="fa fa-hurricane icon-black" id="reflPlotThing" aria-hidden="true" title="Globe Toggle"></span>
                                </button>
                            </div>
                        </div>`
            $(this._container).addClass('reflPlotButton');
            this._container.addEventListener('click', function () {
                if (!$('#reflPlotThing').hasClass('icon-selected')) {
                    $('#reflPlotThing').addClass('icon-selected');
                    $('#reflPlotThing').removeClass('icon-black');
                } else if ($('#reflPlotThing').hasClass('icon-selected')) {
                    $('#reflPlotThing').removeClass('icon-selected');
                    $('#reflPlotThing').addClass('icon-black');
                    removeMapLayer('baseReflectivity');
                }
            })
            return this._container;
        }

        onRemove() {
            this._container.parentNode.removeChild(this._container);
            this._map = undefined;
        }
    }
    var theReflPlotControl = new reflPlotControl;
    map.addControl(theReflPlotControl, 'top-left');
}
//showPlotBtn();

class settingsControl {
    onAdd(map) {
        this._map = map;
        this._container = document.createElement('div');
        this._container.innerHTML = `
                    <div class="mapboxgl-control-container" style="margin-top: 100%;">
                        <div class="mapboxgl-ctrl mapboxgl-ctrl-group">
                            <button class="mapboxgl-ctrl-fullscreen" type="button" aria-label="Globe Toggle">
                                <span class="fa fa-gear icon-black" id="settingsThing" aria-hidden="true" title="Globe Toggle"></span>
                            </button>
                        </div>
                    </div>`
        this._container.addEventListener('click', function () {
            if (!$('#settingsThing').hasClass('icon-selected')) {
                $('#settingsThing').addClass('icon-selected');
                $('#settingsThing').removeClass('icon-black');
                $("#settingsDialog").dialog({
                    modal: true,
                    // https://stackoverflow.com/a/30624445/18758797
                    open: function () {
                        $(this).parent().css({
                            position: 'absolute',
                            top: 10,
                            maxHeight: '70vh',
                            overflow: 'scroll'
                        });
                        $('.ui-widget-overlay').bind('click', function () {
                            $("#settingsDialog").dialog('close');
                        });
                    },
                    close: function () {
                        $('#settingsThing').removeClass('icon-selected');
                        $('#settingsThing').addClass('icon-black');
                    }
                });
            } else if ($('#settingsThing').hasClass('icon-selected')) {
                $('#settingsThing').removeClass('icon-selected');
                $('#settingsThing').addClass('icon-black');
            }
        })
        return this._container;
    }

    onRemove() {
        this._container.parentNode.removeChild(this._container);
        this._map = undefined;
    }
}
var theSettingsControl = new settingsControl;
//map.addControl(theSettingsControl, 'top-right');

class testFileControl {
    onAdd(map) {
        this._map = map;
        this._container = document.createElement('div');
        this._container.innerHTML = `
                    <div class="mapboxgl-control-container" style="margin-top: 100%;">
                        <div class="mapboxgl-ctrl mapboxgl-ctrl-group">
                            <button class="mapboxgl-ctrl-fullscreen" type="button" aria-label="Globe Toggle">
                                <span class="fa fa-flask-vial icon-black" id="testFileThing" aria-hidden="true" title="Globe Toggle"></span>
                            </button>
                        </div>
                    </div>`
        this._container.addEventListener('click', function () {
            if (!$('#testFileThing').hasClass('icon-selected')) {
                $('#testFileThing').addClass('icon-selected');
                $('#testFileThing').removeClass('icon-black');
                // KLIX20050829_061516.gz
                // KTLX20130520_200356_V06.gz
                var fileToLoad = 'KTLX20130520_200356_V06.gz';
                loadFileObject('data/' + fileToLoad, fileToLoad, 2);
            } else if ($('#testFileThing').hasClass('icon-selected')) {
                $('#testFileThing').removeClass('icon-selected');
                $('#testFileThing').addClass('icon-black');
            }
        })
        return this._container;
    }

    onRemove() {
        this._container.parentNode.removeChild(this._container);
        this._map = undefined;
    }
}
var theTestFileControl = new testFileControl;

class testFile3Control {
    onAdd(map) {
        this._map = map;
        this._container = document.createElement('div');
        this._container.innerHTML = `
                    <div class="mapboxgl-control-container" style="margin-top: 100%;">
                        <div class="mapboxgl-ctrl mapboxgl-ctrl-group">
                            <button class="mapboxgl-ctrl-fullscreen" type="button" aria-label="Globe Toggle">
                                <span class="fa fa-3 icon-black" id="testFile3Thing" aria-hidden="true" title="Globe Toggle"></span>
                            </button>
                        </div>
                    </div>`
        this._container.addEventListener('click', function () {
            if (!$('#testFile3Thing').hasClass('icon-selected')) {
                $('#testFile3Thing').addClass('icon-selected');
                $('#testFile3Thing').removeClass('icon-black');
                // LWX_N0H_2022_04_18_15_21_24
                // LWX_N0Q_2022_04_18_15_21_24
                // KOUN_SDUS54_N0STLX_201305200301
                // KCRP_SDUS54_N0UCRP_201708252357
                // KCRP_SDUS54_N0QCRP_201708252357
                // KOUN_SDUS54_DVLTLX_201305200301
                // KOUN_SDUS34_NSTTLX_201305200301

                // LOT_NMD_2021_06_21_04_22_17
                // LOT_NMD_2021_06_21_04_27_31
                // KILX_NTV
                // ILX_N0Q_2021_07_15_22_19_15

                var fileToLoad = 'KILX_NTV';
                loadFileObject('data/level3/' + fileToLoad, fileToLoad, 3);
            } else if ($('#testFile3Thing').hasClass('icon-selected')) {
                $('#testFile3Thing').removeClass('icon-selected');
                $('#testFile3Thing').addClass('icon-black');
            }
        })
        return this._container;
    }

    onRemove() {
        this._container.parentNode.removeChild(this._container);
        this._map = undefined;
    }
}
var theTestFile3Control = new testFile3Control;

if (isDevelopmentMode) {
    map.addControl(theTestFile3Control, 'top-right');
    map.addControl(theTestFileControl, 'top-right');
}

function getLatestFile(sta, callbck) {
    document.getElementById('spinnerParent').style.display = 'block';
    var curTime = new Date();
    var year = curTime.getUTCFullYear();
    var month = curTime.getUTCMonth() + 1;
    month = "0" + month.toString();
    var day = curTime.getUTCDate();
    day = "0" + day.toString();
    var stationToGet = sta.toUpperCase().replace(/ /g, '')
    var fullURL = "https://noaa-nexrad-level2.s3.amazonaws.com/?list-type=2&delimiter=%2F&prefix=" + year + "%2F" + month + "%2F" + day + "%2F" + stationToGet + "%2F"
    //console.log(fullURL)
    $.get(phpProxy + fullURL, function (data) {
        var dataToWorkWith = JSON.stringify(xmlToJson(data)).replace(/#/g, 'HASH')
        dataToWorkWith = JSON.parse(dataToWorkWith)
        //console.log(dataToWorkWith)
        var filenameKey = dataToWorkWith.ListBucketResult.Contents
        var latestFileName = filenameKey[filenameKey.length - 1].Key.HASHtext.slice(16);
        if (latestFileName.includes('MDM')) {
            latestFileName = filenameKey[filenameKey.length - 2].Key.HASHtext.slice(16);
        }
        callbck(latestFileName, year, month, day, stationToGet);
    })
};

function getLatestL3File(sta, pro, cb) {
    document.getElementById('spinnerParent').style.display = 'block';
    var curTime = new Date();
    var year = curTime.getUTCFullYear();
    var month = curTime.getUTCMonth() + 1;
    month = "0" + month.toString();
    var day = curTime.getUTCDate();
    day = "0" + day.toString();
    var stationToGet = sta.toUpperCase().replace(/ /g, '')
    var urlBase = "https://unidata-nexrad-level3.s3.amazonaws.com/";
    var filenamePrefix = `${sta}_${pro}_${year}_${month}_${day}`;
    var urlPrefInfo = '?list-type=2&delimiter=/%2F&prefix=';
    var fullURL = `${urlBase}${urlPrefInfo}${filenamePrefix}`
    $.get(phpProxy + fullURL, function (data) {
        var dataToWorkWith = JSON.stringify(xmlToJson(data)).replace(/#/g, 'HASH')
        dataToWorkWith = JSON.parse(dataToWorkWith)
        console.log(dataToWorkWith)
        var contentsBase = dataToWorkWith.ListBucketResult.Contents;
        var filenameKey = contentsBase[contentsBase.length - 1].Key.HASHtext;

        var finishedURL = `${urlBase}${filenameKey}`;
        cb(finishedURL);
    })
}

function loadLatestFile(levell, pr, tilt, stat) {
    var numLevel = 2;
    if (levell == 'l22') {
        numLevel = 22;
    }
    if (levell == 'l2' || levell == 'l22') {
        removeMapLayer('baseReflectivity');
        getLatestFile($('#stationInp').val(), function (fileName, y, m, d, s) {
            var individualFileURL = `https://noaa-nexrad-level2.s3.amazonaws.com/${y}/${m}/${d}/${s}/${fileName}`
            console.log(phpProxy + individualFileURL)
            loadFileObject(phpProxy + individualFileURL, fileName, numLevel, pr);
        });
    } else if (levell == 'l3') {
        if ($('#productInput').val() != 'sti') {
            removeMapLayer('baseReflectivity');
        }
        var tiltProduct = tiltObject[tilt][pr];
        if (pr != 'ref' && pr != 'vel') {
            // https://tgftp.nws.noaa.gov/SL.us008001/DF.of/DC.radar/DS.165h0/SI.kgld/sn.last
            // DS.165h0 = product code 165, N0H (h0)
            var level3url = `${phpProxy}https://tgftp.nws.noaa.gov/SL.us008001/DF.of/DC.radar/DS.${tiltProduct}/SI.${stat}/sn.last`
            console.log(level3url)
            console.log(tiltProduct, stat)
            loadFileObject(level3url, 'sn.last', 3);
        } else if (pr == 'ref' || pr == 'vel') {
            getLatestL3File(stat.toUpperCase().slice(1), tiltProduct, function (cbVal) {
                var proxiedCbVal = `${phpProxy}${cbVal}`;
                console.log(cbVal);
                loadFileObject(proxiedCbVal, 'sn.last', 3);
            });
        }
    }
}

class curFileControl {
    onAdd(map) {
        this._map = map;
        this._container = document.createElement('div');
        this._container.innerHTML = `
                    <div class="mapboxgl-control-container" style="margin-top: 100%;">
                        <div class="mapboxgl-ctrl mapboxgl-ctrl-group">
                            <button class="mapboxgl-ctrl-fullscreen" type="button" aria-label="Globe Toggle">
                                <span class="fa fa-clock icon-black" id="curFileThing" aria-hidden="true" title="Globe Toggle"></span>
                            </button>
                        </div>
                    </div>`
        this._container.classList.add('currentFileControl');
        this._container.addEventListener('click', function () {
            if (!$('#curFileThing').hasClass('icon-selected')) {
                $('#curFileThing').addClass('icon-selected');
                $('#curFileThing').removeClass('icon-black');
                if ($('#levelInput').val() == 'l2') {
                    loadLatestFile('l2');
                } else if ($('#levelInput').val() == 'l3') {
                    loadLatestFile('l3');
                }
            } else if ($('#curFileThing').hasClass('icon-selected')) {
                $('#curFileThing').removeClass('icon-selected');
                $('#curFileThing').addClass('icon-black');
            }
        })
        return this._container;
    }

    onRemove() {
        this._container.parentNode.removeChild(this._container);
        this._map = undefined;
    }
}
var theCurFileControl = new curFileControl;
//map.addControl(theCurFileControl, 'top-right');

var tiltObject = {
    'tilt1': {
        'ref': 'N0B',
        'vel': 'N0G',
        'lowres-ref': 'p94r0',
        'lowres-vel': 'p99v0',
        'rho': '161c0',
        'zdr': '159x0',
        'sw ': 'p30sw',
        'hhc': '177hh',
        'hyc': '165h0',
        'srv': '56rm0',
        'vil': '134il',
        'sti': '58sti',
        'mcy': '141md',
    },
    'tilt2': {
        'ref': 'N1B',
        'vel': 'N1G',
        'lowres-ref': 'p94r1',
        'lowres-vel': 'p99v1',
        'rho': '161c1',
        'zdr': '159x1',
        'sw ': 'p30sw',
        'hhc': '177hh',
        'hyc': '165h1',
        'srv': '56rm1',
        'vil': '134il',
        'sti': '58sti',
    },
    'tilt3': {
        'ref': 'N2B',
        'vel': 'N2G',
        'lowres-ref': 'p94r2',
        'lowres-vel': 'p99v2',
        'rho': '161c2',
        'zdr': '159x2',
        'sw ': 'p30sw',
        'hhc': '177hh',
        'hyc': '165h2',
        'srv': '56rm2',
        'vil': '134il',
        'sti': '58sti',
    },
    'tilt4': {
        'ref': 'N3B',
        'vel': 'N3G',
        'lowres-ref': 'p94r3',
        'lowres-vel': 'p99v3',
        'rho': '161c3',
        'zdr': '159x3',
        'sw ': 'p30sw',
        'hhc': '177hh',
        'hyc': '165h3',
        'srv': '56rm3',
        'vil': '134il',
        'sti': '58sti',
    },
}
var numOfTiltsObj = {
    'ref': [1, 2, 3, 4],
    'vel': [1, 2],
    'lowres-ref': [1, 2, 3, 4],
    'lowres-vel': [1, 2, 3, 4],
    'rho': [1, 2, 3, 4],
    'zdr': [1, 2, 3, 4],
    'sw ': [1],
    'hhc': [1],
    'hyc': [1, 2, 3, 4],
    'srv': [1, 2, 3, 4],
    'vil': [1],
    'sti': [1],
}

var allL2Btns = [
    'l2-ref',
    'l2-vel',
    'l2-rho',
    'l2-phi',
    'l2-zdr',
    'l2-sw '
];
function tiltClickFunc() {
    document.getElementById('tiltDropdownBtn').innerHTML = this.innerHTML;
    $('#tiltDropdownBtn').attr('value', $(this).attr('value'))

    if (document.getElementById('curProd').innerHTML != '') {
        loadLatestFile(
            'l3',
            document.getElementById('curProd').innerHTML,
            $(this).attr('value'),
            $('#stationInp').val().toLowerCase()
        );
    }
}
$('.productBtnGroup button').on('click', function () {
    if (this.value == 'load') {
        getLatestFile($('#stationInp').val(), function (fileName, y, m, d, s) {
            var individualFileURL = `https://noaa-nexrad-level2.s3.amazonaws.com/${y}/${m}/${d}/${s}/${fileName}`
            console.log(phpProxy + individualFileURL)
            loadFileObject(phpProxy + individualFileURL, 'balls', 2, 'REF');
        });
    }

    //$('#productInput').val()
    var initInnerHTML = this.innerHTML;
    if (!initInnerHTML.includes('span')) {
        this.innerHTML = `<span class="spinner-border spinner-border-sm text-dark" role="status" aria-hidden="true"></span>&nbsp;&nbsp;` + initInnerHTML;
        var thisBtn = this;
        document.getElementById('testEventElem').addEventListener('DOMSubtreeModified', function () {
            thisBtn.innerHTML = initInnerHTML;
        }, { once: true })
    }
    $('.btn-outline-success').each(function () {
        $(this).removeClass('btn-outline-success');
        $(this).addClass('btn-outline-primary');
    });
    $(this).removeClass('btn-outline-primary');
    $(this).addClass('btn-outline-success');
    document.getElementById('curProd').innerHTML = this.value;

    if (this.value.includes('l2')) {
        console.log('level twoo')
    } else {
        listTilts(numOfTiltsObj[this.value]);
        $('#tiltDropdownBtn').attr('value', 'tilt' + numOfTiltsObj[this.value][0]);
        $('#tiltDropdown a').on('click', tiltClickFunc);
        if (!allL2Btns.includes(this.value)) {
            loadLatestFile(
                'l3',
                this.value,
                $('#tiltDropdownBtn').attr('value'),
                $('#stationInp').val().toLowerCase()
            );
        } else {
            loadLatestFile('l2', this.value);
        }
    }
});

var statMarkerArr = [];
function showStations() {
    $.getJSON('https://steepatticstairs.github.io/weather/json/radarStations.json', function (data) {
        var allKeys = Object.keys(data);
        for (key in allKeys) {
            var curIter = data[allKeys[key]];
            var curStat = allKeys[key];

            // check if it is an unsupported radar
            if (curStat.charAt(0) == 'K') {
                // create a HTML element for each feature
                var el = document.createElement('div');
                el.className = 'customMarker';
                el.innerHTML = curStat;

                // make a marker for each feature and add to the map
                var mark = new mapboxgl.Marker(el)
                    .setLngLat([curIter[2], curIter[1]])
                    .addTo(map);
                statMarkerArr.push(mark)
            }
        }
    }).then(function () {
        $('.customMarker').on('click', function () {
            //$('.productBtnGroup button').off()
            var btnsArr = [
                "l2-ref",
                "l2-vel",
                "l2-rho",
                "l2-phi",
                "l2-zdr",
                "l2-sw "
            ]
            for (key in btnsArr) {
                var curElemIter = document.getElementById(btnsArr[key]);
                curElemIter.disabled = true;
                $(curElemIter).addClass('btn-outline-secondary');
                $(curElemIter).removeClass('btn-outline-primary');
            }
            document.getElementById('loadl2').style.display = 'block';

            $('#stationInp').val(this.innerHTML)

            document.getElementById('curProd').innerHTML = 'ref';
            loadLatestFile(
                'l3',
                'ref',
                $('#tiltDropdownBtn').attr('value'),
                $('#stationInp').val().toLowerCase()
            );
        })
    })
}

class stationControl {
    onAdd(map) {
        this._map = map;
        this._container = document.createElement('div');
        this._container.innerHTML = `
                    <div class="mapboxgl-control-container" style="margin-top: 100%;">
                        <div class="mapboxgl-ctrl mapboxgl-ctrl-group">
                            <button class="mapboxgl-ctrl-fullscreen" type="button" aria-label="Globe Toggle">
                                <span class="fa fa-satellite-dish icon-black" id="stationThing" aria-hidden="true"></span>
                            </button>
                        </div>
                    </div>`
        this._container.addEventListener('click', function () {
            if (!$('#stationThing').hasClass('icon-selected')) {
                $('#stationThing').addClass('icon-selected');
                $('#stationThing').removeClass('icon-black');
                showStations();
            } else if ($('#stationThing').hasClass('icon-selected')) {
                $('#stationThing').removeClass('icon-selected');
                $('#stationThing').addClass('icon-black');
                for (key in statMarkerArr) {
                    statMarkerArr[key].remove();
                }
            }
        })
        return this._container;
    }

    onRemove() {
        this._container.parentNode.removeChild(this._container);
        this._map = undefined;
    }
}
var theStationControl = new stationControl;
map.addControl(theStationControl, 'top-left');

class showOptionsBoxControl {
    onAdd(map) {
        this._map = map;
        this._container = document.createElement('div');
        this._container.innerHTML = `
                    <div class="mapboxgl-control-container" style='position: absolute; bottom: 10vh'>
                        <div class="mapboxgl-ctrl mapboxgl-ctrl-group">
                            <button class="mapboxgl-ctrl-fullscreen" type="button" aria-label="Globe Toggle">
                                <span class="fa fa-circle-chevron-up icon-black" id="showOptionsBoxThing" aria-hidden="true"></span>
                            </button>
                        </div>
                    </div>`
        this._container.classList.add('optionsBoxControl');
        this._container.addEventListener('click', function () {
            if (!$('#showOptionsBoxThing').hasClass('icon-selected')) {
                $('#showOptionsBoxThing').addClass('icon-selected');

                $('#showOptionsBoxThing').removeClass('fa-circle-chevron-up');
                $('#showOptionsBoxThing').addClass('fa-circle-chevron-down');

                $('#showOptionsBoxThing').removeClass('icon-black');
                $('#optionsBox').show("slide", { direction: "down" }, 200);
            } else if ($('#showOptionsBoxThing').hasClass('icon-selected')) {
                $('#showOptionsBoxThing').removeClass('icon-selected');

                $('#showOptionsBoxThing').removeClass('fa-circle-chevron-down');
                $('#showOptionsBoxThing').addClass('fa-circle-chevron-up');

                $('#showOptionsBoxThing').addClass('icon-black');
                $('#optionsBox').hide("slide", { direction: "down" }, 200);
            }
        })
        return this._container;
    }

    onRemove() {
        this._container.parentNode.removeChild(this._container);
        this._map = undefined;
    }
}
var theShowOptionsBoxControl = new showOptionsBoxControl;
map.addControl(theShowOptionsBoxControl, 'bottom-left');

//$('#optionsBox').hide();
$('.optionsBoxControl').trigger('click');

$('#levelInput').on('change', function () {
    if ($('#levelInput').val() == 'l2') {
        document.getElementById('productStuff').style.display = 'none';
        document.getElementById('tiltStuff').style.display = 'none';
        $('#productInput').empty();
    } else if ($('#levelInput').val() == 'l3') {
        $('#productStuff').on('change', function () {
            if ($('#levelInput').val() == 'l3' && map.getLayer('baseReflectivity')) {
                loadLatestFile('l3');
            }
        })
        $('#tiltInput').on('change', function () {
            if ($('#levelInput').val() == 'l3' && map.getLayer('baseReflectivity')) {
                loadLatestFile('l3');
            }
        })
        document.getElementById('productStuff').style.display = 'block';
        document.getElementById('tiltStuff').style.display = 'block';

        document.getElementById('productInput').add(new Option('Base Reflectivity', 'ref', false, true));
        document.getElementById('productInput').add(new Option('Base Velocity', 'vel'));
        document.getElementById('productInput').add(new Option('Hydrometer Classification', 'hyc'));
        document.getElementById('productInput').add(new Option('Vertically Integrated Liquid', 'vil'));
        document.getElementById('productInput').add(new Option('Hybrid Hydrometer Classification', 'hhc'));
        document.getElementById('productInput').add(new Option('Storm Relative Velocity', 'srv'));
        //document.getElementById('productInput').add(new Option('Storm Tracking', 'sti'));
    }
})
$('#levelInput').val('l3');
$('#levelInput').trigger('change');

// radius of wsr-88d scan in km
var radius = 460;
$('#fileStation').on('DOMSubtreeModified', function () {
    var station = document.getElementById('fileStation').innerHTML;
    $.getJSON('https://steepatticstairs.github.io/weather/json/radarStations.json', function (data) {
        var stationLat = data[station][1];
        var stationLng = data[station][2];
        //map.flyTo({
        //    center: [stationLng, stationLat],
        //    zoom: 8,
        //    duration: 1000,
        //});
        var stationBbox = getBoundingBox(stationLat, stationLng, radius);

        var coord1 = stationBbox.minLat;
        var coord2 = stationBbox.minLng;
        var coord3 = stationBbox.maxLat;
        var coord4 = stationBbox.maxLng;
        //map.addLayer({
        //    id: 'canvas-layer',
        //    type: 'raster',
        //    source: {
        //        type: 'canvas',
        //        canvas: 'theCanvas',
        //        coordinates: [
        //            [coord2, coord3],
        //            [coord4, coord3],
        //            [coord4, coord1],
        //            [coord2, coord1]
        //        ],
        //    }
        //});
        //new mapboxgl.Marker()
        //    .setLngLat([stationLng, stationLat])
        //    .addTo(map);
    });
});
function testHello(text) {
    console.log(text)
}
function removeMapLayer(layername) {
    if (map.getLayer(layername)) {
        map.removeLayer(layername);
    }
    if (map.getSource(layername)) {
        map.removeSource(layername);
    }
}
function removeTestFileControl() {
    if (map.hasControl(theTestFileControl)) {
        map.removeControl(theTestFileControl);
    }
    if (map.hasControl(theTestFile3Control)) {
        map.removeControl(theTestFile3Control);
    }
    if (map.hasControl(theCurFileControl)) {
        map.removeControl(theCurFileControl);
    }
}

function setGeojsonLayer(gj, gjType, identity) {
    var styling;
    var type;
    if (gjType == 'circle') {
        type = gjType;
        styling = {
            'circle-radius': 4,
            'circle-stroke-width': 2,
            'circle-color': 'red',
            'circle-stroke-color': 'white',
        }
    } else if (gjType == 'lineCircle') {
        type = 'circle';
        styling = {
            'circle-radius': 4,
            'circle-stroke-width': 2,
            'circle-color': 'blue',
            'circle-stroke-color': 'white',
        }
    } else if (gjType == 'greenCircle') {
        type = 'circle';
        styling = {
            'circle-radius': 4,
            'circle-stroke-width': 2,
            'circle-color': 'green',
            'circle-stroke-color': 'white',
        }
    } else if (gjType == 'yellowCircle') {
        type = 'circle';
        styling = {
            'circle-radius': 4,
            'circle-stroke-width': 2,
            'circle-color': 'yellow',
            'circle-stroke-color': 'white',
        }
    } else if (gjType == 'lineCircleEdge') {
        type = 'circle';
        styling = {
            'circle-radius': 4,
            'circle-color': '#ffffff',
        }
    } else if (gjType == 'line') {
        type = gjType;
        styling = {
            'line-color': '#ffffff',
            'line-width': 1.5,
        }
    }
    map.addLayer({
        'id': identity,
        'type': type,
        'source': {
            'type': 'geojson',
            'data': gj,
        },
        'paint': styling,
    })
}
function moveMapLayer(lay) {
    if (map.getLayer(lay)) {
        map.moveLayer(lay)
    }
}