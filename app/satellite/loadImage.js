var map = require('../radar/map/map');
const ut = require('../radar/utils');
const proj4 = require('proj4');

function setImageFromXML(auxXMLStr, imageUrl) {
    var auxXMLJSON = ut.xmlToJson(auxXMLStr);
    // access the raw text
    var rawGeoTransformText = auxXMLJSON.PAMDataset.GeoTransform['#text'];
    // remove all spaces
    rawGeoTransformText = rawGeoTransformText.replace(/ /g, '');
    // split into an array by the commas
    var finalArr = rawGeoTransformText.split(',');
    // convert scientific notation (e.g. e+02) to actual numbers
    for (var i in finalArr) { finalArr[i] = parseFloat(finalArr[i]) }

    function getWidthHeight(url, cb) {   
        var img = new Image();
        img.onload = function() {
            cb(this.width, this.height);
        };
        img.src = url;
    }
    getWidthHeight(imageUrl, function(width, height) {
        // https://gis.stackexchange.com/questions/389342/getting-extents-of-raster-with-geotransform
        var minx = finalArr[0]
        var maxy = finalArr[3]
        var maxx = minx + finalArr[1] * width;
        var miny = maxy + finalArr[5] * height;

        var coord1 = miny;
        var coord2 = minx;
        var coord3 = maxy;
        var coord4 = maxx;

        var coordArr = [
            proj4('EPSG:3857', 'EPSG:4326', [coord2, coord3]),
            proj4('EPSG:3857', 'EPSG:4326', [coord4, coord3]),
            proj4('EPSG:3857', 'EPSG:4326', [coord4, coord1]),
            proj4('EPSG:3857', 'EPSG:4326', [coord2, coord1])
            /*
                2  3
                4  3
                4  1
                2  1
            */
        ]

        if (map.getLayer('satelliteLayer')) {
            map.removeLayer('satelliteLayer');
        }
        if (map.getSource('satelliteLayer')) {
            map.removeSource('satelliteLayer');
        }
        map.addLayer({
            id: 'satelliteLayer',
            'type': 'raster',
            'source': {
                'type': 'image',
                'url': imageUrl,
                'coordinates': coordArr
            },
            'paint': {
                'raster-fade-duration': 0,
                'raster-resampling': 'nearest'
            }
        });

        //map.addLayer({
        //    id: 'statesLayes',
        //    type: "raster",
        //    source: {
        //        type: "raster",
        //        tiles: [
        //            `https://mesonet.agron.iastate.edu/c/tile.py/1.0.0/usstates/{z}/{x}/{y}.png`
        //        ],
        //        tileSize: 256
        //    },
        //});
    })
}

function initSatImage() {
    //map.on('load', function() {
        var auxXMLFileUrl = '../app/satellite/processData/projectedImage.png.aux.xml';
        var jsonFileUrl = '../app/satellite/processData/initialImage.json';
        var imageFileUrl = '../app/satellite/processData/projectedImage.png';

        $.get(auxXMLFileUrl, function(data) {
            var auxXMLData = data;
            setImageFromXML(
                auxXMLData,
                imageFileUrl
            )
        })
    //})
}

module.exports = initSatImage;