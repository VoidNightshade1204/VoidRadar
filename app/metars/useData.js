var map = require('../radar/map/map');
const ut = require('../radar/utils');
const getTempColor = require('../radar/misc/tempColors');

const parseMETAR = require('metar');

var geojsonTemplate = {
    "type": "FeatureCollection",
    "features": []
}
function resetTemplate() {
    geojsonTemplate = {
        "type": "FeatureCollection",
        "features": []
    }
}

function useData(data, action) {
    resetTemplate();
    for (var item in data.response.data.METAR) {
        var lat = parseFloat(data.response.data.METAR[item].latitude['#text']);
        var lon = parseFloat(data.response.data.METAR[item].longitude['#text']);
        var stationId = data.response.data.METAR[item].station_id['#text'];
        var rawMetarText = data.response.data.METAR[item].raw_text['#text'];

        geojsonTemplate.features.push({
            'properties': {
                'stationID': stationId,
                'rawMetarText': rawMetarText
            },
            "geometry": {
                "type": "Point",
                "coordinates":
                    [lon, lat]
            }
        });
    }

    if (action == 'update') {
        console.log(geojsonTemplate)
        map.getSource('metarSymbolLayer').setData(geojsonTemplate);
        toggleMETARStationMarkers('show');
    } else if (action == 'load') {
        // map.addLayer({
        //     id: 'metarStations',
        //     type: 'circle',
        //     source: {
        //         type: 'geojson',
        //         data: geojsonTemplate,
        //     },
        //     'paint': {
        //         'circle-radius': 4,
        //         'circle-stroke-width': 3,
        //         'circle-color': '#12b317',
        //         'circle-stroke-color': '#0b610e',
        //     }
        // });
        map.loadImage(
            'https://steepatticstairs.github.io/AtticRadar/resources/roundedRectangle.png',
            (error, image) => {
                if (error) throw error;
                map.addImage('custom-marker-metar', image, {
                    "sdf": "true"
                });
                map.addSource('metarSymbolLayer', {
                    'type': 'geojson',
                    'generateId': true,
                    'data': geojsonTemplate
                });

                // Add a symbol layer
                map.addLayer({
                    'id': 'metarSymbolLayer',
                    'type': 'symbol',
                    'source': 'metarSymbolLayer',
                    'layout': {
                        'icon-image': 'custom-marker-metar',
                        'icon-size': 0.07,
                        'text-field': ['get', 'stationID'],
                        'text-size': 13,
                        'text-font': [
                            //'Open Sans Semibold',
                            'Arial Unicode MS Bold'
                        ],
                        //'text-offset': [0, 1.25],
                        //'text-anchor': 'top'
                    },
                    'paint': {
                        //'text-color': 'white',
                        'text-color': 'black',
                        'icon-color': 'ForestGreen'
                    }
                });
                map.moveLayer('stationSymbolLayer');
            }
        );

        map.on('click', 'metarSymbolLayer', (e) => {
            const coordinates = e.features[0].geometry.coordinates.slice();
            const id = e.features[0].properties.stationID;
            const rawText = e.features[0].properties.rawMetarText;

            var parsedMetarData = parseMETAR(rawText);
            console.log(parsedMetarData)

            var metarTemp = parsedMetarData.temperature;
            var parsedMetarTemp = parseInt(ut.CtoF(metarTemp));
            var metarDewPoint = parsedMetarData.dewpoint;
            var metarAltimeter = parsedMetarData.altimeterInHg;
            var metarVisibility = parsedMetarData.visibility;
            var metarWindSpeed = parsedMetarData.wind.speed; // in knots
            var metarWindGustSpeed = parsedMetarData.wind.gust; // in knots
            var metarWindDirection = parsedMetarData.wind.direction;
            if (metarWindDirection == null) {
                metarWindDirection = 0;
            }
            var metarFancyTime = ut.printFancyTime(parsedMetarData.time);

            var tempColor = getTempColor(parsedMetarTemp);

            var metarHTMLBody = 
            `<div>
                <div style="text-align: center; font-size: 30px; color: ${tempColor[1]}; background-color: ${tempColor[0]}"><b>${parsedMetarTemp}</b> ℉</div>
                <br>
                <div><i><b>VALID: </b>${metarFancyTime}</i></div>
                <div><b>Dew Point: </b>${parseInt(ut.CtoF(metarDewPoint))} ℉</div>
                <div><b>Altimeter: </b>${metarAltimeter} inHG</div>
                <div><b>Visibility: </b>${metarVisibility} miles</div>
                <br>
                <div><b>Wind:</b></div>
                <div>${ut.knotsToMph(metarWindSpeed, 0)} mph</div>
                <div>${ut.knotsToMph(metarWindGustSpeed, 0)} mph gusts</div>
                <div>${metarWindDirection}° (${ut.degToCompass(metarWindDirection)})</div>
                <img src="../resources/compass.png" class="centerImg" style="max-width: 50%; max-height: 50%; transform: rotate(${metarWindDirection}deg)">
                <br>
                <div><b>Raw Text: </b><u>${rawText}</u></div>

                <!--<br>
                <pre>${JSON.stringify(parsedMetarData, undefined, 2)}</pre> -->
            </div>`

            ut.spawnModal({
                'title': `Station ${id}`,
                'headerColor': 'alert-success',
                'body': metarHTMLBody
            })

            // {
            //     "type": "METAR",
            //     "correction": false,
            //     "station": "KOQN",
            //     "time": "2022-09-17T21:35:47.993Z",
            //     "auto": true,
            //     "wind": {
            //         "speed": 4,
            //         "gust": null,
            //         "direction": 230,
            //         "variation": null,
            //         "unit": "KT"
            //     },
            //     "cavok": false,
            //     "visibility": 10,
            //     "visibilityVariation": null,
            //     "visibilityVariationDirection": null,
            //     "weather": null,
            //     "clouds": [
            //         {
            //             "abbreviation": "SCT",
            //             "meaning": "scattered",
            //             "altitude": 4700,
            //             "cumulonimbus": false
            //         }
            //     ],
            //     "temperature": 26,
            //     "dewpoint": 15,
            //     "altimeterInHg": 30.19
            // }
        });
        map.on('mouseenter', 'metarSymbolLayer', () => {
            map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'metarSymbolLayer', () => {
            map.getCanvas().style.cursor = '';
        });
    }
}

function toggleMETARStationMarkers(showHide) {
    if (showHide == 'hide') {
        map.setLayoutProperty('metarSymbolLayer', 'visibility', 'none');
        //mapFuncs.removeMapLayer('tideStationDots');
    } else if (showHide == 'show') {
        map.setLayoutProperty('metarSymbolLayer', 'visibility', 'visible');
    }
}

module.exports = {
    useData,
    toggleMETARStationMarkers
}