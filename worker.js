const { Level2Radar } = require('./nexrad-level-2-data/src');
const { plot } = require('./nexrad-level-2-plot/src');
const utils = require('./utils');

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

module.exports = function (self) {
    self.addEventListener('message',function (ev) {
        if (ev.data.hasOwnProperty('initial')) {
            var fileBuffer = ev.data.initial[0];

            var l2rad = new Level2Radar(toBuffer(fileBuffer))
            console.log(l2rad)
            var theFileVersion = l2rad.header.version;
            self.postMessage({
                'fileVersion': theFileVersion
            })

            var elevs = l2rad.listElevations();
            var elevAngles = l2rad.listElevations('angle', l2rad);

            var theFileVCP;
            if (theFileVersion == "06") {
                theFileVCP = l2rad.vcp.record.pattern_number;
            } else {
                theFileVCP = l2rad.data[1][0].record.vcp;
            }

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

            self.postMessage({
                'elevationList': [elevs, elevAngles, theFileVCP, finalRadarDateTime]
            })

            var theProduct = ev.data.initial[1][0];
            var theElevation = ev.data.initial[1][1];
            var theInWebWorker = ev.data.initial[1][2];
            var theLowFilterRef = ev.data.initial[1][3];
            utils.logTextFromWorker('initial reflectivity plot');
            const level2Plot = plot(l2rad, theProduct, {
                elevations: theElevation,
                inWebWorker: theInWebWorker,
                lowFilterRef: theLowFilterRef,
            });

            if (ev.data.initial[2] == 'first') {
                self.postMessage({
                    'objectTest': true
                })
                self.postMessage({
                    'doneStringifyParse': true
                })
            }
            /*setTimeout(function() {
                utils.logTextFromWorker('starting radar object transfer')
                var start = Date.now();
                async function stringifyParse() {
                    delete l2rad.options
                    for (var b = 3; b < l2rad.data.length; b++) {
                        delete l2rad.data[b]
                        delete l2rad.vcp.record.elevations[b]
                    }
                    self.postMessage({
                        'objectTest': l2rad
                    })
                }
                stringifyParse()
                    .then(function() {
                        var end = Date.now() - start;
                        utils.logTextFromWorker('finished radar object transfer in ' + end + 'ms');
                        self.postMessage({
                            'doneStringifyParse': true
                        })
                    })
            }, 2000)*/
        }
    });
};