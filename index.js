//const fetch = require('node-fetch');
const { Level2Radar } = require('./nexrad-level-2-data/src');
const { plot } = require('./nexrad-level-2-plot/src');
const { map } = require('./nexrad-level-2-plot/src/draw/palettes/hexlookup');

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
document.getElementById('fileInput').addEventListener('input', function() {
    // Create the event
    var event = new CustomEvent("loadFile", { "detail": document.getElementById('fileInput').files[0] });
    // Dispatch/Trigger/Fire the event
    document.dispatchEvent(event);
})

document.addEventListener('loadFile', function(event) {
    document.getElementById('spinnerParent').style.display = 'block';
    removeTestFileControl();
    //console.log(URL.createObjectURL(document.getElementById("fileInput").files[0]));
    setTimeout(function() {
        var uploadedFile = event.detail;
        const reader = new FileReader();

        reader.addEventListener("load", function () {
            console.log('file uploaded, parsing now');
            var l2rad = new Level2Radar(toBuffer(this.result))
            console.log(l2rad)

            var elevs = l2rad.listElevations();
            var elevAngles = l2rad.listElevations('angle', l2rad);
            console.log(elevAngles)
            for (var key in elevAngles) {
                // I believe waveform_type == 2 means that ref data is not in that sweep
                // 1, 3, and 4 are safe
                if (elevAngles[key][1] != 2) {
                    document.getElementById('elevInput').add(new Option(elevAngles[key][0], elevs[key]));
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

            var theFileVCP = l2rad.vcp.record.pattern_number;
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
            $('#elevInput').on('change', function() {
                if ($('#reflPlotThing').hasClass('icon-selected')) {
                    removeMapLayer('baseReflectivity');
                    $("#settingsDialog").dialog('close');
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