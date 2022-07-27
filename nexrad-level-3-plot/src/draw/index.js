const { createCanvas } = require('canvas');
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
	const palette = Palette.generate(product.palette);
	// calculate scaling paramater with respect to pallet's designed criteria
	const paletteScale = (data?.productDescription?.plot?.maxDataValue ?? 255) / (product.palette.baseScale ?? data?.productDescription?.plot?.maxDataValue ?? 1);
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
			let thisSample;
			// if test for downsampling
			if (scale !== 1) {
				const remainder = idx % scale;
				// test for rollover in scaling
				if (remainder < lastRemainder) {
					// plot this point and reset values
					thisSample = maxDownsample;
					maxDownsample = 0;
				}
				// store this sample
				maxDownsample = Math.max(bin, maxDownsample);
				// store for rollover tracking
				lastRemainder = remainder;
			} else {
				thisSample = bin;
			}
			// see if there's a sample to plot
			if (!thisSample) return;
			//ctx.beginPath();
			//ctx.strokeStyle = palette[Math.round(thisSample * paletteScale)];
			//ctx.arc(0, 0, (idx + data.radialPackets[0].firstBin) / scale, startAngle, endAngle);

			arr.push((idx + data.radialPackets[0].firstBin) / scale)
			valArr.push(thisSample)

			//ctx.stroke();
		});
		json.radials.push(arr)
		json.values.push(valArr)
	});

	json.version = '06';
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

	//return canvas;
};

module.exports = {
	draw,
	DEFAULT_OPTIONS,
};
