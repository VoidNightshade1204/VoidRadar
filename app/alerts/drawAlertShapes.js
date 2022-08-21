const fetchPolygonData = require('./fetchData');
const ut = require('../radar/utils');
const createControl = require('../radar/map/controls/createControl');
const mapClick = require ('./mapClick');
const simplify = require('simplify-geojson')
var map = require('../radar/map/map');

var newAlertsURL = `${ut.phpProxy}https://preview.weather.gov/edd/resource/edd/hazards/getShortFusedHazards.php?all=true`;
var swsAlertsURL = `${ut.phpProxy}https://preview.weather.gov/edd/resource/edd/hazards/getSps.php`;
// https://realearth.ssec.wisc.edu/products/?app=_ALL_
var allAlertsURL = `https://realearth.ssec.wisc.edu/api/shapes?products=NWS-Alerts-All`;
var noaaAlertsURL = `https://api.weather.gov/alerts/active`;
var newAlertsArr = [];
var y = 0;

createControl({
    'id': 'alertsThing',
    'position': 'top-left',
    'icon': 'fa-circle-exclamation',
    'css': 'margin-top: 100%;'
}, function() {
    if (!$('#alertsThing').hasClass('icon-selected')) {
        $('#alertsThing').addClass('icon-selected');
        $('#alertsThing').removeClass('icon-black');

        if (map.getLayer('newAlertsLayer')) {
            map.getCanvas().style.cursor = "crosshair";
            map.on('click', 'newAlertsLayer', mapClick)
            map.setLayoutProperty('newAlertsLayer', 'visibility', 'visible');
            map.setLayoutProperty('newAlertsLayerOutline', 'visibility', 'visible');
        } else {
            map.getCanvas().style.cursor = "crosshair";
            map.on('click', 'newAlertsLayer', mapClick)
            fetchPolygonData([noaaAlertsURL], function(data) {
                map.addLayer({
                    'id': `newAlertsLayer`,
                    'type': 'fill',
                    'source': {
                        type: 'geojson',
                        data: data,
                    },
                    paint: {
                        //#0080ff blue
                        //#ff7d7d red
                        'fill-color': '#ff7d7d',
                        'fill-opacity': 0.5
                    }
                });
                map.addLayer({
                    'id': `newAlertsLayerOutline`,
                    'type': 'line',
                    'source': `newAlertsLayer`,
                    'paint': {
                        //#014385 blue
                        //#850101 red
                        'line-color': '#850101',
                        'line-width': 3
                    }
                });
                // newAlertsArr.push(`newAlertsLayerOutline`);
                // newAlertsArr.push(`newAlertsLayer`);

                // // map.on('click', 'newAlertsLayer', (e) => {
                // //     for (key in e.features) {
                // //         ut.colorLog(e.features[key].properties.CAP_ID, 'green')
                // //     }
                // // });
            })
        }
    } else if ($('#alertsThing').hasClass('icon-selected')) {
        $('#alertsThing').removeClass('icon-selected');
        $('#alertsThing').addClass('icon-black');

        map.getCanvas().style.cursor = "default";
        map.off('click', 'newAlertsLayer', mapClick)

        map.setLayoutProperty('newAlertsLayer', 'visibility', 'none');
        map.setLayoutProperty('newAlertsLayerOutline', 'visibility', 'none');
    }
})