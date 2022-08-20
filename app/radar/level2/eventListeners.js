const { plot } = require('../../../nexrad-level-2-plot/src');
const loaders = require('../loaders');
const mapFuncs = require('../map/mapFunctions');

function loadL2Listeners(l2rad) {
    // var btnsArr = [
    //     "level2-ref",
    //     "level2-vel",
    //     "level2-rho",
    //     "level2-phi",
    //     "level2-zdr",
    //     "level2-sw "
    // ]
    // for (key in btnsArr) {
    //     var curElemIter = document.getElementById(btnsArr[key]);
    //     curElemIter.disabled = false;
    // }

    // $('.l2BtnGroup button').on('click', function () {
    //     if (this.value == 'level2-ref') {
    //         const level2Plot = plot(l2rad, 'REF', {
    //             elevations: 1,
    //         });
    //     } else if (this.value == 'level2-vel') {
    //         const level2Plot = plot(l2rad, 'VEL', {
    //             elevations: 2,
    //         });
    //     } else if (this.value == 'level2-rho') {
    //         const level2Plot = plot(l2rad, 'RHO', {
    //             elevations: 1,
    //         });
    //     } else if (this.value == 'level2-phi') {
    //         const level2Plot = plot(l2rad, 'PHI', {
    //             elevations: 1,
    //         });
    //     } else if (this.value == 'level2-zdr') {
    //         const level2Plot = plot(l2rad, 'ZDR', {
    //             elevations: 1,
    //         });
    //     } else if (this.value == 'level2-sw ') {
    //         const level2Plot = plot(l2rad, 'SW ', {
    //             elevations: 7,
    //         });
    //     }
    // })


    // <li><a class="dropdown-item" href="#" value="tilt1">Tilt 1</a></li>
    function returnDropdownItem(value) {
        var dropdownItem = `<li><a class="dropdown-item" href="#" value="${value}">${value}</a></li>`;
        return dropdownItem;
    }
    $('#l2ProductBtn').attr('value', 'REF');
    $('.l2BtnGroup').on('click', function (e) {
        var clickedValue = $(e.target).attr('value');
        $('#dataDiv').data('currentElevation', clickedValue);
        var allProdsForElev = $('#dataDiv').data('elevsAndProds')[clickedValue - 1][2];

        document.getElementById('l2ProductBtn').innerHTML = 'Products';

        document.getElementById('l2ProductMenu').innerHTML = '';
        for (key in allProdsForElev) {
            document.getElementById('l2ProductMenu').innerHTML += returnDropdownItem(allProdsForElev[key])
        }

        plot(l2rad, $('#l2ProductBtn').attr('value'), {
            elevations: parseInt(clickedValue),
        });
    })

    $('#l2ProductMenu').on('click', function(e) {
        var clickedVal = $(e.target).attr('value');

        document.getElementById('l2ProductBtn').innerHTML = clickedVal;
        $('#l2ProductBtn').attr('value', clickedVal);

        plot(l2rad, clickedVal, {
            elevations: parseInt($('#dataDiv').data('currentElevation')),
        });
    })
}

module.exports = loadL2Listeners;