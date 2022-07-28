const { createCanvas } = require('canvas');
const { keys } = require('../../../nexrad-level-2-plot/src/draw/palettes/hexlookup');
const Palette = require('./palette');

const DEFAULT_OPTIONS = {
	// must be a square image
	size: 1800,
	background: 'black',
	lineWidth: 2,
};

const draw = (data, product, _options) => {
	// combine options with defaults
	const options = {
		...DEFAULT_OPTIONS,
		..._options,
	};

	// calculate scale
	if (options.size > DEFAULT_OPTIONS.size) throw new Error(`Upsampling is not supported. Provide a size <= ${DEFAULT_OPTIONS.size}`);
	if (options.size < 1) throw new Error('Provide a size > 0');
	const scale = DEFAULT_OPTIONS.size / options.size;

	var c = [];
	var json = {
		'radials': [],
		'values': [],
		'azimuths': [],
		'version': [],
	};
	// generate a palette
	//const palette = Palette.generate(product.palette);
	// calculate scaling paramater with respect to pallet's designed criteria
	//const paletteScale = (data?.productDescription?.plot?.maxDataValue ?? 255) / (product.palette.baseScale ?? data?.productDescription?.plot?.maxDataValue ?? 1);
	// use the raw values to avoid scaling and un-scaling
	data.radialPackets[0].radials.forEach((radial) => {
		arr = [];
		valArr = [];
		const startAngle = radial.startAngle * (Math.PI / 180);
		const endAngle = startAngle + radial.angleDelta * (Math.PI / 180);
		json.azimuths.push(radial.startAngle)
		// track max value for downsampling
		let maxDownsample = 0;
		let lastRemainder = 0;
		// for each bin
		radial.bins.forEach((bin, idx) => {
			// skip null values
			if (bin === null) return;
			// see if there's a sample to plot
			if (!bin) return;
			//ctx.beginPath();
			//ctx.strokeStyle = palette[Math.round(thisSample * paletteScale)];
			//ctx.arc(0, 0, (idx + data.radialPackets[0].firstBin) / scale, startAngle, endAngle);

			arr.push(idx + data.radialPackets[0].firstBin)
			valArr.push(bin)
			c.push(bin)

			//ctx.stroke();
		});
		json.radials.push(arr)
		json.values.push(valArr)
	});

	// if the first azimuth isn't zero (e.g. azimuths going 0-360) then we need to do some re-arrangement
	if (json.azimuths[0] != 0) {
		// store the value of first azimuth (in this case it will be the offset)
		var startAzimuth = json.azimuths[0];
		for (val in json.azimuths) {
			// add the starting value to each azimuth value, allowing for correct rotation
			json.azimuths[val] = json.azimuths[val] + startAzimuth
		}
	}
	// sort each azimuth value from lowest to highest
	json.azimuths.sort(function(a, b){return a - b});

	console.log(Math.min(...[...new Set(c)]), Math.max(...[...new Set(c)]))
	//console.log([...new Set(c)])
	json.version = 'l3';
	console.log(json)
	var blob = new Blob([JSON.stringify(json)], {type: "text/plain"});
    var url = window.URL.createObjectURL(blob);
	document.getElementById('level3json').innerHTML = url;
	/*const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    // the filename you want
    a.download = 'level3.json';
    document.body.appendChild(a);
    a.click();*/

	var currentStation = data.textHeader.id;
	if (currentStation == 'KOUN') {
		currentStation = 'K' + data.textHeader.id3;
	}
	document.getElementById('fileStation').innerHTML = currentStation;
	$.getJSON('https://steepatticstairs.github.io/weather/json/radarStations.json', function(data) {
		var statLat = data[currentStation][1];
		var statLng = data[currentStation][2];
		// ../../../data/json/KLWX20220623_014344_V06.json
		// product.abbreviation
		drawRadarShape(url, statLat, statLng, product, !$('#shouldLowFilter').prop("checked"));

		//new mapboxgl.Marker()
		//    .setLngLat([stationLng, stationLat])
		//    .addTo(map);
	});

	//return canvas;
};

module.exports = {
	draw,
	DEFAULT_OPTIONS,
};
