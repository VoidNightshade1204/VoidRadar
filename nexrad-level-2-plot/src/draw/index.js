const canvasObj = require('canvas');

const { createCanvas } = canvasObj;

const Palette = require('./palettes');
const palettizeImage = require('./palettize');

// data pre-processing
const filterProduct = require('./preprocess/filterproduct');
const downSample = require('./preprocess/downsample');
const indexProduct = require('./preprocess/indexproduct');
const rrle = require('./preprocess/rrle');

// names of data structures keyed to product name
const dataNames = {
	REF: 'reflect',
	VEL: 'velocity',
	'SW ': 'spectrum',	// intentional space to fill 3-character requirement
	ZDR: 'zdr',
	PHI: 'phi',
	RHO: 'rho',
};

// names of data retrieval routines keyed to product name
const dataFunctions = {
	REF: 'getHighresReflectivity',
	VEL: 'getHighresVelocity',
};

// generate all palettes
/* eslint-disable global-require */
const palettes = {
	REF: new Palette(require('./palettes/ref')),
	VEL: new Palette(require('./palettes/vel')),
};
/* eslint-enable global-require */

const preferredWaveformUsage = {
	1: ['REF', 'SW ', 'ZDR', 'PHI', 'RHO'],
	2: ['VEL'],
	3: ['REF', 'VEL', 'SW ', 'ZDR', 'PHI', 'RHO'],
	4: ['REF', 'VEL', 'SW ', 'ZDR', 'PHI', 'RHO'],
	5: ['REF', 'VEL', 'SW ', 'ZDR', 'PHI', 'RHO'],
};

// default options
const DEFAULT_OPTIONS = {
	// must be a square image
	size: 3600,
	cropTo: 3600,
	background: 'black',
	lineWidth: 2,
	usePreferredWaveforms: true,
	alpha: true,
	imageSmoothingEnabled: true,
	antialias: 'default',
	dpi: 96,
};

function setDPI(canvas, dpi) {
    // Set up CSS size.
    canvas.style.width = canvas.style.width || canvas.width + 'px';
    canvas.style.height = canvas.style.height || canvas.height + 'px';

    // Resize canvas and scale future draws.
    var scaleFactor = dpi / 96;
    canvas.width = Math.ceil(canvas.width * scaleFactor);
    canvas.height = Math.ceil(canvas.height * scaleFactor);
    var ctx = canvas.getContext('2d');
    ctx.scale(scaleFactor, scaleFactor);
}

const draw = (data, _options) => {
	// combine options with defaults
	const options = {
		...DEFAULT_OPTIONS,
		..._options,
	};

	// check preferred waveforms
	const elevationInfo = data?.vcp?.record?.elevations?.[options?.elevation];
	// elevation info is not available in chunks mode, so preferred waveforms cannot be processed
	if (elevationInfo) {
		const preferredProducts = preferredWaveformUsage[elevationInfo.waveform_type];
		if (options.usePreferredWaveforms && !preferredProducts.includes(options.product)) return false;
	}

	// calculate scale
	if (options.size > DEFAULT_OPTIONS.size) throw new Error(`Upsampling is not supported. Provide a size <= ${DEFAULT_OPTIONS.size}`);
	if (options.size < 1) throw new Error('Provide options.size > 0');
	const scale = DEFAULT_OPTIONS.size / options.size;

	// wsr88d uses a gate size of 0.25km, tdwr uses a gate size of 0.15km, although it is reported as 0.3km for processing reasons
	// this calculation scales the plot accordingly to the nominal 0.25km so all generated plots are at the same scale
	const rawGateSize = data?.data?.[options.elevation]?.[0]?.record?.reflect?.gate_size ?? 0.25;
	const realGateSize = rawGateSize !== 0.3 ? rawGateSize : rawGateSize / 2;
	const gateSizeScaling = 0.25 / realGateSize;

	// calculate crop, adjust if necessary
	const cropTo = Math.min(options.size, options.cropTo);
	if (options.cropTo < 1) throw new Error('Provide options.cropTo > 0');

	// create the canvas and context
	const canvas = document.getElementById('theCanvas');
	const ctx = canvas.getContext('2d', { alpha: options.alpha });
	ctx.canvas.width = cropTo;
	ctx.canvas.height = cropTo;
	ctx.antialias = options.antialias;
	ctx.imageSmoothingEnabled = options.imageSmoothingEnabled;

	setDPI(canvas, options.dpi);

	// fill background with black
	ctx.fillStyle = options.background;
	ctx.fillRect(0, 0, cropTo, cropTo);

	// canvas settings
	ctx.imageSmoothingEnabled = true;
	ctx.lineWidth = options.lineWidth / gateSizeScaling;
	ctx.translate(cropTo / 2, cropTo / 2);
	ctx.rotate(-Math.PI / 2);

	// get the palette
	const palette = palettes[options.product];
	// test for valid palette
	if (!palette) throw new Error(`No product found for product type: ${options.product}`);

	// set the elevation
	data.setElevation(options.elevation);
	// get the header data
	const headers = data.getHeader();

	// calculate resolution in radians, default to 1°
	let resolution = Math.PI / 180;
	if (data?.vcp?.record?.elevations?.[options.elevation]?.super_res_control?.super_res?.halfDegreeAzimuth) resolution /= 2;
	// calculate half resolution step for additional calculations below
	const halfResolution = resolution / 2;

	// match product name to data
	const dataName = dataNames[options.product];
	const dataFunction = dataFunctions[options.product];

	// check for valid product
	if (dataName === undefined) throw new Error(`No data object name found for product: ${options.product}`);
	if (dataFunction === undefined) throw new Error(`No data function found for product: ${options.product}`);

	// check for data for this product
	if (headers[0][dataName] === undefined) return false;

	// pre-processing
	const filteredProduct = filterProduct(headers, dataName);
	const downSampledProduct = downSample(filteredProduct, scale, resolution, options, palette);
	const indexedProduct = indexProduct(downSampledProduct, palette);
	const rrlEncoded = rrle(indexedProduct, resolution);

	var featuresArr = [];
	function pushPoint(lng1, lat1, lng2, lat2, lng3, lat3, lng4, lat4, value) {
		featuresArr.push({
			"type": "Feature",
			"geometry": { "type": "Polygon",
				"coordinates": [
					[
						[lng1, lat1],
						[lng2, lat2],
						[lng3, lat3],
						[lng4, lat4]
					]
				]
			},
			"properties": {
				"value": value,
			}
		},);
	}

	var valArr = [];
	var arr = [];
	var json = {
		'radials': [],
		'values': [],
		'azimuths': [],
	};
	var compVals = [];
	// loop through data
	rrlEncoded.forEach((radial) => {
		arr = [];
		valArr = [];
		json.azimuths.push(radial.azimuth)
		// calculate plotting parameters
		const deadZone = radial.first_gate / radial.gate_size / scale;

		// 10% is added to the arc to ensure that each arc bleeds into the next just slightly to avoid radial empty spaces at further distances
		const startAngle = radial.azimuth * (Math.PI / 180) - halfResolution * 1.1;
		const endAngle = radial.azimuth * (Math.PI / 180) + halfResolution * 1.1;

		// plot each bin
		radial.moment_data.forEach((bin, idx) => {
			if (bin === null) return;

			//console.log(radial.azimuth)

			ctx.beginPath();
			// different methods for rrle encoded or not
			if (bin.count) {
				// rrle encoded
				ctx.strokeStyle = palette.lookupRgba[bin.value];
				ctx.arc(0, 0, (idx + deadZone) * gateSizeScaling, startAngle, endAngle + resolution * (bin.count - 1));
				//arr.push(((idx + deadZone) * gateSizeScaling) * 260)
				arr.push((idx + deadZone) * gateSizeScaling)
				valArr.push(bin.value)
				compVals.push(bin.value)
				//pushPoint(startAngle, endAngle + resolution * (bin.count - 1))
			} else {
				// plain data
				ctx.strokeStyle = palette.lookupRgba[bin];
				ctx.arc(0, 0, (idx + deadZone) * gateSizeScaling, startAngle, endAngle);
				arr.push((idx + deadZone) * gateSizeScaling)
				valArr.push(bin)
				compVals.push(bin)
			}
			ctx.stroke();
		});
		json.radials.push(arr)
		json.values.push(valArr)
	});
	function radians(deg) {
		return (3.141592654/180.)*deg;
	}
	var inv = 180.0/3.141592654;
	var re = 6371000.0;
	var phi = radians(0.483395)
	var radarLat = radians(35.33305);
	var radarLon = radians(-97.27775);
	var h0 = 0.0;
	function calculatePosition(az, range) {
        var mathaz = radians(90.0 - az);
        var h = Math.sqrt(Math.pow(range,2.0)+Math.pow(((4./3.)*re+h0),2.0)+2.*range*((4./3.)*re+h0)*Math.sin(phi))-(4./3.)*re;
        var ca = Math.acos((Math.pow(range,2.0)-Math.pow(re,2.0)-Math.pow(re+h,2.0))/(-2.0*re*(re+h)));
        var xcart = (ca*re)*Math.cos(mathaz);
        var ycart = (ca*re)*Math.sin(mathaz);
        //convert to latitude longitude
        var rho = Math.sqrt(Math.pow(xcart,2.0)+Math.pow(ycart,2.0));
        var c = rho/re;
        var lat = Math.asin(Math.cos(c)*Math.sin(radarLat)+(ycart*Math.sin(c)*Math.cos(radarLat))/(rho))*inv;
        lon = (radarLon + Math.atan((xcart*Math.sin(c))/(rho*Math.cos(radarLat)*Math.cos(c)-ycart*Math.sin(radarLat)*Math.sin(c))))*inv;

        //console.log(lat, lon)

        mx = (180.0 + lon)/360.0;
        my = (180. - (180. / 3.141592654 * Math.log(Math.tan(3.141592654 / 4. + lat * 3.141592654 / 360.)))) / 360.; 
        //console.log(mx,my);
        return {
			x:lon,
			y:lat
        }

	}
	var gateRes = gateSizeScaling;
	var azs = json.azimuths;
    var min = azs[0];
    var max = azs[azs.length-1];

    for (var key in json.radials) {
		if (key == "azimuths") continue;
		key = +key;
		var values = json.radials[key];
		var az = azs[key];
		var leftAz, rightAz, bottomR, topR;

		//case when first az
		if (key == 0) {
			//case when crossing 0
			leftAz = (min + 360 + max)/2;
			rightAz = (az+azs[key+1])/2;
		} else if (key == azs.length-1) {
			//case when crossing 0 the other way
			leftAz = (az + azs[key-1])/2;
			rightAz = (min+360+max)/2; 
		} else {
			//case when nothing to worry about
			leftAz = (az + azs[key-1])/2;
			rightAz = (az + azs[key+1])/2;
		}

		//loop through radar range gates
		for (var i=0; i<values.length; i+=2) {
			bottomR = values[i]-gateRes;
			topR = values[i] + gateRes;

			var bl = calculatePosition(leftAz, bottomR);
			//console.log(bl, bl.x);
			var tl = calculatePosition(leftAz, topR);
			var br = calculatePosition(rightAz, bottomR);
			var tr = calculatePosition(rightAz, topR);

			pushPoint(bl.x, bl.y, tl.x, tl.y, tr.x, tr.y, br.x, br.y, json.values[key][i]);
		}
	}
	//console.log(valueArr)
	//console.log(featuresArr)
	var geojsonParentTemplate = {
		"type": "FeatureCollection",
		"features": featuresArr
	}
	var blob = new Blob([JSON.stringify(geojsonParentTemplate)], {type: "text/plain"});
    var url = window.URL.createObjectURL(blob);
	const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    // the filename you want
    a.download = 'sus.geojson';
    document.body.appendChild(a);
    //a.click();

	console.log(geojsonParentTemplate);
	compVals.sort();
	compVals.reverse();
	console.log(compVals);

	const val0 = ['==', ['get', 'value'], 0];
	const val1 = ['==', ['get', 'value'], 1];
	const val2 = ['==', ['get', 'value'], 2];
	const val3 = ['==', ['get', 'value'], 3];
	const val4 = ['==', ['get', 'value'], 4];
	const val5 = ['==', ['get', 'value'], 5];
	const val6 = ['==', ['get', 'value'], 6];
	const val7 = ['==', ['get', 'value'], 7];
	const val8 = ['==', ['get', 'value'], 8];
	const val9 = ['==', ['get', 'value'], 9];
    //const val1 = ['all', ['>=', ['get', 'value'], -30], ['<', ['get', 'value'], -25]];
    //const val2 = ['all', ['>=', ['get', 'value'], -25], ['<', ['get', 'value'], -20]];
    //const val3 = ['all', ['>=', ['get', 'value'], -20], ['<', ['get', 'value'], -15]];
    //const val4 = ['all', ['>=', ['get', 'value'], -15], ['<', ['get', 'value'], -10]];
    //const val5 = ['all', ['>=', ['get', 'value'], -10], ['<', ['get', 'value'], -5]];
    //const val6 = ['all', ['>=', ['get', 'value'], -5], ['<', ['get', 'value'], 0]];
    //const val7 = ['all', ['>=', ['get', 'value'], 0], ['<', ['get', 'value'], 5]];
    //const val8 = ['all', ['>=', ['get', 'value'], 5], ['<', ['get', 'value'], 10]];
    //const val9 = ['all', ['>=', ['get', 'value'], 10], ['<', ['get', 'value'], 15]];
    //const val10 = ['all', ['>=', ['get', 'value'], 15], ['<', ['get', 'value'], 20]];
    //const val11 = ['all', ['>=', ['get', 'value'], 20], ['<', ['get', 'value'], 25]];
    //const val12 = ['all', ['>=', ['get', 'value'], 25], ['<', ['get', 'value'], 30]];
    //const val13 = ['all', ['>=', ['get', 'value'], 30], ['<', ['get', 'value'], 35]];
    //const val14 = ['all', ['>=', ['get', 'value'], 35], ['<', ['get', 'value'], 40]];
    //const val15 = ['all', ['>=', ['get', 'value'], 40], ['<', ['get', 'value'], 45]];
    //const val16 = ['all', ['>=', ['get', 'value'], 45], ['<', ['get', 'value'], 50]];
    //const val17 = ['all', ['>=', ['get', 'value'], 50], ['<', ['get', 'value'], 55]];
    //const val18 = ['all', ['>=', ['get', 'value'], 55], ['<', ['get', 'value'], 60]];
    //const val19 = ['all', ['>=', ['get', 'value'], 60], ['<', ['get', 'value'], 65]];
    //const val20 = ['all', ['>=', ['get', 'value'], 65], ['<', ['get', 'value'], 70]];
    //const val21 = ['all', ['>=', ['get', 'value'], 70], ['<', ['get', 'value'], 75]];
    //const val22 = ['>=', ['get', 'value'], 75];
    const colors = [
		'#ccffff',
		'#cc99cc',
		'#996699',
		'#663366',
		'#999966',
		'#646464',
		'#04e9e7',
		'#019ff4',
		'#0300f4',
		'#02fd02',
		'#01c501',
		'#008e00',
		'#fdf802',
		'#e5bc00',
		'#fd9500',
		'#fd0000',
		'#d40000',
		'#bc0000',
		'#f800fd',
		'#9854c6',
		'#fdfdfd'
    ];

	map.addLayer({
		'id': 'radar',
		'type': 'fill',
		'source': {
			type: 'geojson',
		    // Use a URL for the value for the `data` property.
			data: geojsonParentTemplate
		},
		'paint': {
			'fill-color': [
				'case',
					val0, colors[6],
					val1, colors[7],
					val2, colors[8],
					val3, colors[9],
					val4, colors[10],
					val5, colors[11],
					val6, colors[12],
					val7, colors[13],
					val8, colors[14],
					val9, colors[15],
					//'#FF009A'
					colors[19]
				]
		}
	});

    document.getElementById('spinnerParent').style.display = 'none';

	if (!options.palettize) {
	// return the palette and canvas
		return {
			canvas,
		};
	}

	// palettize image
	const palettized = palettizeImage(ctx, palette);

	// return palettized image
	return {
		canvas: palettized,
		palette: palette.getPalette(),
	};
};

module.exports = {
	draw,
	DEFAULT_OPTIONS,
	canvas: canvasObj,
};
