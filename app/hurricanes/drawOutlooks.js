const ut = require('../radar/utils');
var map = require('../radar/map/map');

function drawOutlookToMap(geojson, type, name) {
    console.log(geojson)
    var hurricaneMapLayers = $('#dataDiv').data('hurricaneMapLayers');
    if (geojson.features[0].properties.name != " Tropical cyclone formation is not expected ") {
        if (type == 'cone') {
            var fillColor = geojson.features[0].properties.fill;
            var fillOpacity = geojson.features[0].properties['fill-opacity'];
            var borderColor = geojson.features[0].properties.stroke;
            var borderWidth = geojson.features[0].properties['stroke-width'];

            // close off the cone by adding the first coordinate set again to the end
            var coneCoordinates = geojson.features[0].geometry.coordinates[0];
            geojson.features[0].geometry.coordinates[0].push(coneCoordinates[0]);

            map.addLayer({
                'id': `outlookCone${name}`,
                'type': 'fill',
                'source': {
                    type: 'geojson',
                    data: geojson.features[0],
                },
                paint: {
                    //#0080ff blue
                    //#ff7d7d red
                    'fill-color': fillColor,
                    'fill-opacity': 0.3
                }
            });
            map.addLayer({
                'id': `outlookConeOutline${name}`,
                'type': 'line',
                'source': `outlookCone${name}`,
                'paint': {
                    //#014385 blue
                    //#850101 red
                    'line-color': borderColor,
                    'line-width': borderWidth
                }
            });
            hurricaneMapLayers.push(`outlookCone${name}`);
            hurricaneMapLayers.push(`outlookConeOutline${name}`);
        } else if (type == 'track') {
            // var fillColor = geojson.features[0].properties.fill;
            // var fillOpacity = geojson.features[0].properties['fill-opacity'];
            // var borderColor = geojson.features[0].properties.stroke;
            // var borderWidth = geojson.features[0].properties['stroke-width'];

            var black = 'rgb(0, 0, 0)';
            var highColor = 'rgb(214, 46, 31)'; // red
            var mediumColor = 'rgb(240, 151, 55)'; // orange
            var lowColor = 'rgb(255, 255, 84)'; // yellow

            if (geojson.features[1].properties.styleUrl == '#highx') {
                geojson.features[1].properties.color = highColor;
            } else if (geojson.features[1].properties.styleUrl == '#lowx') {
                geojson.features[1].properties.color = lowColor;
            } else {
                geojson.features[1].properties.color = highColor;
            }

            map.addSource(`outlookPointSource${name}`, {
                type: "geojson",
                data: geojson.features[1]
            });
            map.addLayer({
                "id": `outlookPoint${name}`,
                "type": "circle",
                "source": `outlookPointSource${name}`,
                "paint": {
                    "circle-radius": 9,
                    'circle-stroke-width': 2,
                    'circle-color': ['get', 'color'],
                    'circle-stroke-color': black,
                }
            });
            hurricaneMapLayers.push(`outlookPoint${name}`);
            // {
            //     "styleUrl": "#higx",
            //     "styleHash": "-409ac551",
            //     "Disturbance": "1",
            //     "2day_percentage": "70",
            //     "2day_category": "3",
            //     "5day_percentage": "90",
            //     "5day_category": "3",
            //     "Discussion": "\n1. Offshore of Southern Mexico: A trough of low pressure is located a couple hundred miles south of  the southern coast of Mexico. This system has become a little better  organized since yesterday, and environmental conditions appear  conducive for additional development. A tropical depression is  likely to form in the next couple of days while the system moves  generally west-northwestward, parallel to the southwestern coast of  Mexico. Interests along the southwestern coast of Mexico should  monitor the progress of this system. \n Formation chance through 48 hours...high...70 percent. \n Formation chance through 5 days...high...90 percent.                 "
            // }

            map.on('mouseenter', `outlookPoint${name}`, function (e) {
                map.getCanvas().style.cursor = 'pointer';
            })
            map.on('mouseleave', `outlookPoint${name}`, function (e) {
                map.getCanvas().style.cursor = '';
            })

            map.on('click', `outlookPoint${name}`, function (e) {
                var lng = e.features[0].geometry.coordinates[0];
                var lat = e.features[0].geometry.coordinates[1];
                var properties = e.features[0].properties;

                var popupContent =
                    `<div style="overflow-y: scroll; max-height: 150px;">
                        <div style="font-size: 20px; text-align: center">2-day: <b>${properties['2day_percentage']}%</b></div>
                        <div style="font-size: 20px; text-align: center">5-day: <b>${properties['5day_percentage']}%</b></div>
                        <br>
                        <div><b>Discussion:</b></div>
                        <div class="code">${properties.Discussion}</div>
                    </div>`

                new mapboxgl.Popup()
                    .setLngLat([lng, lat])
                    .setHTML(popupContent)
                    //.setHTML(e.features[0].properties.description)
                    .addTo(map);
            })
        }
        $('#dataDiv').data('hurricaneMapLayers', hurricaneMapLayers);
    }
}

module.exports = drawOutlookToMap;