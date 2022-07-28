//const fetch = require('node-fetch');
const { Level2Radar } = require('./nexrad-level-2-data/src');
const Level3Radar = require('./nexrad-level-3-data/src');
const { plot } = require('./nexrad-level-2-plot/src');
const { map } = require('./nexrad-level-2-plot/src/draw/palettes/hexlookup');

const fs = require('fs');
const { plotAndData, writePngToFile } = require('./nexrad-level-3-plot/src');

function toBuffer(ab) {
    const buf = Buffer.alloc(ab.byteLength);
    const view = new Uint8Array(ab);
    for (let i = 0; i < buf.length; ++i) {
        buf[i] = view[i];
    }
    return buf;
}

function printFancyTime(dateObj, tz) {
    return dateObj.toLocaleDateString(undefined, {timeZone: tz}) + " " + dateObj.toLocaleTimeString(undefined, {timeZone: tz}) + ` ${tz}`;
}
Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}
function msToTime(s) {
    // Pad to 2 or 3 digits, default is 2
    function pad(n, z) {
        z = z || 2;
        return ('00' + n).slice(-z);
    }
    var ms = s % 1000;
    s = (s - ms) / 1000;
    var secs = s % 60;
    s = (s - secs) / 60;
    var mins = s % 60;
    var hrs = (s - mins) / 60;
    return {
        'hours': pad(hrs),
        'minutes': pad(mins),
        'seconds': pad(secs),
        'milliseconds': pad(ms, 3),
    }
    //return pad(hrs) + ':' + pad(mins) + ':' + pad(secs) + '.' + pad(ms, 3);
}
function round(value, precision) {
    var multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
}
document.getElementById('fileInput').addEventListener('input', function() {
    // Create the event
    var event = new CustomEvent("loadFile", { "detail": [
        document.getElementById('fileInput').files[0],
        'level2'
    ] });
    // Dispatch/Trigger/Fire the event
    document.dispatchEvent(event);
})

setTimeout(function() {
    //const file = fs.readFileSync('./data/level3/LWX_HHC_2022_04_18_15_21_24');
    //const level3Plot = plotAndData(file);
}, 1000)

document.addEventListener('loadFile', function(event) {
    //logToModal('starting')
    document.getElementById('spinnerParent').style.display = 'block';

    document.getElementById('elevStuff').style.display = 'block';
    document.getElementById('extraStuff').style.display = 'block';
    document.getElementById('productStuff').style.display = 'block';
    removeTestFileControl();
    //console.log(URL.createObjectURL(document.getElementById("fileInput").files[0]));
    setTimeout(function() {
        var uploadedFile = event.detail[0];
        var fileLevel = event.detail[1];
        const reader = new FileReader();

        reader.addEventListener("load", function () {
            console.log('file uploaded, parsing now');
            if (fileLevel == 'level2') {
                var l2rad = new Level2Radar(toBuffer(this.result))
                console.log(l2rad)
                var theFileVersion = l2rad.header.version;
                document.getElementById('fileVersion').innerHTML = theFileVersion;

                // older file versions only have reflectivity and velocity data - check for that here
                if (theFileVersion == "06") {
                    document.getElementById('productInput').add(new Option('Reflectivity', 'REF'));
                    document.getElementById('productInput').add(new Option('Velocity', 'VEL'));
                    document.getElementById('productInput').add(new Option('Correlation Coefficient', 'RHO'));
                    document.getElementById('productInput').add(new Option('Differential Phase Shift', 'PHI'));
                    document.getElementById('productInput').add(new Option('Differential Reflectivity', 'ZDR'));
                    document.getElementById('productInput').add(new Option('Spectrum Width', 'SW '));
                } else {
                    document.getElementById('productInput').add(new Option('Reflectivity', 'REF'));
                    document.getElementById('productInput').add(new Option('Velocity', 'VEL'));
                }

                function displayElevations(displayedProduct) {
                    $('#elevInput').empty();
                    var elevs = l2rad.listElevations();
                    var elevAngles = l2rad.listElevations('angle', l2rad);
                    const preferredWaveformUsage = {
                        1: ['REF', 'ZDR', 'PHI', 'RHO'],
                        2: ['VEL'],
                        3: ['REF', 'VEL', 'SW ', 'ZDR', 'PHI', 'RHO'],
                        4: ['REF', 'VEL', 'SW ', 'ZDR', 'PHI', 'RHO'],
                        5: ['REF', 'VEL', 'SW ', 'ZDR', 'PHI', 'RHO'],
                    };
                    for (var key in elevAngles) {
                        if (theFileVersion == "06") {
                            if (preferredWaveformUsage[elevAngles[key][1]].includes(displayedProduct)) {
                                document.getElementById('elevInput').add(new Option(round(elevAngles[key][0], 1), elevs[key]));
                            }
                        } else {
                            if (elevAngles[key][1].includes(displayedProduct)) {
                                document.getElementById('elevInput').add(new Option(round(elevAngles[key][0], 1), elevs[key]));
                            }
                        }
                    }
                }
                //var blob = new Blob([JSON.stringify(l2rad)], {type: "text/plain"});
                //var url = window.URL.createObjectURL(blob);
                //document.getElementById('decodedRadarDataURL').innerHTML = url;
                showPlotBtn();
                //document.getElementById('plotRef').style.display = 'inline';
                //document.getElementById('plotVel').style.display = 'inline';
                document.getElementById('fileInput').style.display = 'none';
                document.getElementById('radarInfoDiv').style.display = 'inline';

                document.getElementById('radFileName').innerHTML = uploadedFile.name;

                var theFileStation = l2rad.header.ICAO;
                document.getElementById('radStation').innerHTML = theFileStation;

                var theFileVCP;
                if (!(theFileVersion == "01")) {
                    theFileVCP = l2rad.vcp.record.pattern_number;
                } else {
                    theFileVCP = l2rad.data[1][0].record.vcp;
                }
                document.getElementById('radVCP').innerHTML = theFileVCP;

                var theFileDate = l2rad.header.modified_julian_date;
                var theFileTime = l2rad.header.milliseconds;
                var fileDateObj = new Date(0).addDays(theFileDate);
                var fileHours = msToTime(theFileTime).hours;
                var fileMinutes = msToTime(theFileTime).minutes;
                var fileSeconds = msToTime(theFileTime).seconds;
                fileDateObj.setUTCHours(fileHours);
                fileDateObj.setUTCMinutes(fileMinutes);
                fileDateObj.setUTCSeconds(fileSeconds);
                var finalRadarDateTime = printFancyTime(fileDateObj, "UTC");

                document.getElementById('radDate').innerHTML = finalRadarDateTime;

                $('.reflPlotButton').on('click', function() {
                    if ($('#reflPlotThing').hasClass('icon-selected')) {
                        console.log('plot reflectivity data button clicked');
                        const level2Plot = plot(l2rad, 'REF', {
                            elevations: parseInt($('#elevInput').val()),
                        });
                    }
                })
                $('.reflPlotButton').trigger('click');
                console.log('initial reflectivity plot');
                displayElevations('REF');
                const level2Plot = plot(l2rad, 'REF', {
                    elevations: parseInt($('#elevInput').val()),
                });
                $('#productInput').on('change', function() {
                    removeMapLayer('baseReflectivity');
                    if ($('#productInput').val() == 'REF') {
                        document.getElementById('extraStuff').style.display = 'block';
                        displayElevations('REF');
                        const level2Plot = plot(l2rad, 'REF', {
                            elevations: 1,
                        });
                    } else if ($('#productInput').val() == 'VEL') {
                        document.getElementById('extraStuff').style.display = 'none';
                        displayElevations('VEL');
                        const level2Plot = plot(l2rad, 'VEL', {
                            elevations: 2,
                        });
                    } else if ($('#productInput').val() == 'RHO') {
                        document.getElementById('extraStuff').style.display = 'none';
                        displayElevations('RHO');
                        const level2Plot = plot(l2rad, 'RHO', {
                            elevations: 1,
                        });
                    } else if ($('#productInput').val() == 'PHI') {
                        document.getElementById('extraStuff').style.display = 'none';
                        displayElevations('PHI');
                        const level2Plot = plot(l2rad, 'PHI', {
                            elevations: 1,
                        });
                    } else if ($('#productInput').val() == 'ZDR') {
                        document.getElementById('extraStuff').style.display = 'none';
                        displayElevations('ZDR');
                        const level2Plot = plot(l2rad, 'ZDR', {
                            elevations: 1,
                        });
                    } else if ($('#productInput').val() == 'SW ') {
                        document.getElementById('extraStuff').style.display = 'none';
                        displayElevations('SW ');
                        const level2Plot = plot(l2rad, 'SW ', {
                            elevations: parseInt($('#elevInput').val()),
                        });
                    }
                })
                $('#elevInput').on('change', function() {
                    if ($('#reflPlotThing').hasClass('icon-selected')) {
                        removeMapLayer('baseReflectivity');
                        //$("#settingsDialog").dialog('close');
                        const level2Plot = plot(l2rad, $('#productInput').val(), {
                            elevations: parseInt($('#elevInput').val()),
                        });
                    }
                })
                $('#shouldLowFilter').on('change', function() {
                    if ($('#reflPlotThing').hasClass('icon-selected')) {
                        removeMapLayer('baseReflectivity');
                        //$("#settingsDialog").dialog('close');
                        const level2Plot = plot(l2rad, 'REF', {
                            elevations: parseInt($('#elevInput').val()),
                        });
                    }
                })
                /*const level2Plot = plot(l2rad, 'REF', {
                    elevations: 1,
                    background: 'rgba(0, 0, 0, 0)',
                    //size: 500,
                    //cropTo: 500,
                    dpi: $('#userDPI').val(),
                });
                console.log('dpi set to ' + $('#userDPI').val())*/
            } else if (fileLevel == 'level3') {
                console.log('level 3 file')
                var l3rad = Level3Radar(toBuffer(this.result))
                console.log(l3rad)

                showPlotBtn();
                document.getElementById('fileInput').style.display = 'none';
                document.getElementById('radarInfoDiv').style.display = 'inline';

                document.getElementById('radFileName').innerHTML = uploadedFile.name;

                var theFileStation = l3rad.textHeader.id;
                if (theFileStation == 'KOUN') {
                    theFileStation = 'K' + l3rad.textHeader.id3;
                }
                document.getElementById('radStation').innerHTML = theFileStation;

                var theFileVCP = l3rad.productDescription.vcp;
                document.getElementById('radVCP').innerHTML = theFileVCP;

                var theFileDate = l3rad.messageHeader.julianDate;
                var theFileTime = l3rad.messageHeader.seconds * 1000;
                var fileDateObj = new Date(0).addDays(theFileDate);
                var fileHours = msToTime(theFileTime).hours;
                var fileMinutes = msToTime(theFileTime).minutes;
                var fileSeconds = msToTime(theFileTime).seconds;
                fileDateObj.setUTCHours(fileHours);
                fileDateObj.setUTCMinutes(fileMinutes);
                fileDateObj.setUTCSeconds(fileSeconds);
                var finalRadarDateTime = printFancyTime(fileDateObj, "UTC");

                document.getElementById('radDate').innerHTML = finalRadarDateTime;

                const level3Plot = plotAndData(l3rad);
                //document.getElementById('settingsDialog').innerHTML = 'No settings for Level 3 files yet.'
                document.getElementById('elevStuff').style.display = 'none';
                document.getElementById('extraStuff').style.display = 'none';
                document.getElementById('spinnerParent').style.display = 'none';
            }
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