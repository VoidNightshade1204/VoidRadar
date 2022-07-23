//const fetch = require('node-fetch');
const { Level2Radar } = require('./nexrad-level-2-data/src');
const { plot } = require('./nexrad-level-2-plot/src');
const { map } = require('./nexrad-level-2-plot/src/draw/palettes/hexlookup');
var work = require('webworkify');

function round(value, precision) {
    var multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
}
document.getElementById('fileInput').addEventListener('input', function() {
    // Create the event
    var event = new CustomEvent("loadFile", { "detail": document.getElementById('fileInput').files[0] });
    // Dispatch/Trigger/Fire the event
    document.dispatchEvent(event);
})

document.addEventListener('loadFile', function(event) {
    //document.getElementById('spinnerParent').style.display = 'block';
    removeTestFileControl();
    //console.log(URL.createObjectURL(document.getElementById("fileInput").files[0]));
    setTimeout(function() {
        var uploadedFile = event.detail;
        const reader = new FileReader();

        reader.addEventListener("load", function () {
            console.log('file uploaded, parsing now');

            var w = work(require('./worker.js'));
            w.addEventListener('message', function (ev) {
                if (ev.data.hasOwnProperty('fileStation')) {
                    document.getElementById('fileStation').innerHTML = ev.data.fileStation;
                    document.getElementById('radStation').innerHTML = ev.data.fileStation;
                } else if (ev.data.hasOwnProperty('parsedData')) {
                    var url = ev.data.parsedData[0];
                    var statLat = ev.data.parsedData[1];
                    var statLng = ev.data.parsedData[2];
                    var radProd = ev.data.parsedData[3];
                    var lowFilter = ev.data.parsedData[4]; // true or false (true)
                    drawRadarShape(url, statLat, statLng, radProd, lowFilter);
                } else if (ev.data.hasOwnProperty('fileVersion')) {
                    document.getElementById('fileVersion').innerHTML = ev.data.fileVersion;
                } else if (ev.data.hasOwnProperty('elevationList')) {
                    var elevs = ev.data.elevationList[0]
                    var elevAngles = ev.data.elevationList[1]
                    var theFileVCP = ev.data.elevationList[2]
                    var finalRadarDateTime = ev.data.elevationList[3]
                    var theFileVersion = document.getElementById('fileVersion').innerHTML;
                    for (var key in elevAngles) {
                        // I believe waveform_type == 2 means that ref data is not in that sweep
                        // 1, 3, and 4 are safe
                        if (theFileVersion == "06") {
                            if (elevAngles[key][1] != 2) {
                                document.getElementById('elevInput').add(new Option(round(elevAngles[key][0], 1), elevs[key]));
                            }
                        } else {
                            if (elevAngles[key][1] == 1) {
                                document.getElementById('elevInput').add(new Option(round(elevAngles[key][0], 1), elevs[key]));
                            }
                        }
                    }
                    showPlotBtn();
                    document.getElementById('fileInput').style.display = 'none';
                    document.getElementById('radarInfoDiv').style.display = 'inline';
                    document.getElementById('radFileName').innerHTML = uploadedFile.name;
                    document.getElementById('radVCP').innerHTML = theFileVCP;
                    document.getElementById('radDate').innerHTML = finalRadarDateTime;
                } else if (ev.data.hasOwnProperty('objectTest')) {
                    function reattachMethods(serialized,originalclass) {
                        serialized.__proto__ = originalclass.prototype;
                        return serialized;
                    }
                    var l2rad = reattachMethods(ev.data.objectTest, Level2Radar);
                    $('.reflPlotButton').on('click', function() {
                        if ($('#reflPlotThing').hasClass('icon-selected')) {
                            console.log('plot reflectivity data button clicked');
                            const level2Plot = plot(l2rad, 'REF', {
                                elevations: parseInt($('#elevInput').val()),
                                inWebWorker: false,
                                lowFilterRef: $('#shouldLowFilter').prop('checked'),
                            });
                        }
                    })
                    $('.reflPlotButton').trigger('click');
                    $('#productInput').on('change', function() {
                        removeMapLayer('baseReflectivity');
                        if ($('#productInput').val() == 'REF') {
                            document.getElementById('extraStuff').style.display = 'inline';
                            const level2Plot = plot(l2rad, 'REF', {
                                elevations: parseInt($('#elevInput').val()),
                                inWebWorker: false,
                                lowFilterRef: $('#shouldLowFilter').prop('checked'),
                            });
                        } else if ($('#productInput').val() == 'VEL') {
                            document.getElementById('extraStuff').style.display = 'none';
                            const level2Plot = plot(l2rad, 'VEL', {
                                elevations: 2,
                                inWebWorker: false
                            });
                        }
                    })
                    $('#elevInput').on('change', function() {
                        if ($('#reflPlotThing').hasClass('icon-selected')) {
                            removeMapLayer('baseReflectivity');
                            $("#settingsDialog").dialog('close');
                            const level2Plot = plot(l2rad, 'REF', {
                                elevations: parseInt($('#elevInput').val()),
                                inWebWorker: false,
                                lowFilterRef: $('#shouldLowFilter').prop('checked'),
                            });
                        }
                    })
                    $('#shouldLowFilter').on('change', function() {
                        if ($('#reflPlotThing').hasClass('icon-selected')) {
                            removeMapLayer('baseReflectivity');
                            $("#settingsDialog").dialog('close');
                            const level2Plot = plot(l2rad, 'REF', {
                                elevations: parseInt($('#elevInput').val()),
                                inWebWorker: false,
                                lowFilterRef: $('#shouldLowFilter').prop('checked'),
                            });
                        }
                    })
                } else if (ev.data.hasOwnProperty('doneStringifyParse')) {
                    document.getElementById('settingsLoading').style.display = 'none';
                    document.getElementById('fullSettingsContents').style.display = 'inline';
                }
            });

            w.postMessage({
                'initial': this.result
            });
        }, false);
        reader.readAsArrayBuffer(uploadedFile);
    }, 300)
})

/*
document.getElementById('fileThatWorks').addEventListener('click', function() {
    $.ajax({
        url: './data/' + document.getElementById('fileThatWorks').innerHTML,
        method: 'GET',
        xhrFields: { responseType: 'arraybuffer'}
    }).then(function(responseData) {
        //console.clear();
        console.log('loaded ' + document.getElementById('fileThatWorks').innerHTML + ' file from click, reading now')
        var l2rad = new Level2Radar(toBuffer(responseData))
        console.log(l2rad)
    })
})*/

//console.clear();

// https://php-cors-proxy.herokuapp.com/?https://noaa-nexrad-level2.s3.amazonaws.com/2017/08/25/KCRP/KCRP20170825_235733_V06
// https://php-cors-proxy.herokuapp.com/?https://noaa-nexrad-level2.s3.amazonaws.com/2017/08/25/KCRP/KCRP20170825_235733_V06
// https://php-cors-proxy.herokuapp.com/?https://noaa-nexrad-level2.s3.amazonaws.com/2009/06/03/KBLX/KBLX20090603_004417_V03.gz
/*fetch('https://php-cors-proxy.herokuapp.com/?https://noaa-nexrad-level2.s3.amazonaws.com/2017/08/25/KCRP/KCRP20170825_235733_V06')
    .then(res => res.arrayBuffer())
    .then(rawData => {
        var l2rad = new Level2Radar(toBuffer(rawData))
        console.log(l2rad)
    })
    .catch(err => console.error(err));*/