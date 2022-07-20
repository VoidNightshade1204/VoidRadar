//const fetch = require('node-fetch');
const { Level2Radar } = require('./nexrad-level-2-data/src');
const { plot } = require('./nexrad-level-2-plot/src');

function toBuffer(ab) {
    const buf = Buffer.alloc(ab.byteLength);
    const view = new Uint8Array(ab);
    for (let i = 0; i < buf.length; ++i) {
        buf[i] = view[i];
    }
    return buf;
}

document.getElementById('fileInput').addEventListener('input', function() {
    document.getElementById('spinnerParent').style.display = 'block';
    //console.log(URL.createObjectURL(document.getElementById("fileInput").files[0]));
    setTimeout(function() {
        var uploadedFile = document.getElementById('fileInput').files[0];
        const reader = new FileReader();

        reader.addEventListener("load", function () {
            console.log('file uploaded, parsing now');
            var l2rad = new Level2Radar(toBuffer(this.result))
            console.log(l2rad)
            //var blob = new Blob([JSON.stringify(l2rad)], {type: "text/plain"});
            //var url = window.URL.createObjectURL(blob);
            //document.getElementById('decodedRadarDataURL').innerHTML = url;
            showPlotBtn();
            //document.getElementById('plotRef').style.display = 'inline';
            //document.getElementById('plotVel').style.display = 'inline';

            document.getElementById('radarInfoDiv').style.display = 'inline';

            var theFileStation = l2rad.header.ICAO;
            document.getElementById('radStation').innerHTML = theFileStation;
            document.getElementById('radStationParent').style.display = 'inline';

            var theFileVCP = l2rad.vcp.record.pattern_number;
            document.getElementById('radVCP').innerHTML = theFileVCP;
            document.getElementById('radVCPParent').style.display = 'inline';

            $('.reflPlotButton').on('click', function() {
                console.log('plot reflectivity data button clicked');
                const level2Plot = plot(l2rad, 'REF', {
                    elevations: 1,
                    background: 'rgba(0, 0, 0, 0)',
                    //size: 500,
                    //cropTo: 500,
                    dpi: $('#userDPI').val(),
                });
            })
            document.getElementById('plotRef').addEventListener('click', function() {
                document.getElementById('spinnerParent').style.display = 'block';
                console.log('plot reflectivity data button clicked');
                const level2Plot = plot(l2rad, 'REF', {
                    elevations: 1,
                    background: 'rgba(0, 0, 0, 0)',
                    //size: 500,
                    //cropTo: 500,
                    dpi: $('#userDPI').val(),
                });
                console.log('dpi set to ' + $('#userDPI').val())
            })
            document.getElementById('plotVel').addEventListener('click', function() {
                document.getElementById('spinnerParent').style.display = 'block';
                console.log('plot velocity data button clicked');
                const level2Plot = plot(l2rad, 'VEL', {
                    elevations: 2,
                    background: 'rgba(0, 0, 0, 0)',
                    //size: 500,
                    //cropTo: 500,
                    dpi: $('#userDPI').val(),
                });
                console.log('dpi set to ' + $('#userDPI').val())
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