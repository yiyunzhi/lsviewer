// ==UserScript==
// @name         LSViewer
// @namespace    https://yiyunzhi.github.io/
// @version      0.1.1
// @description  Extend the page chart and infomation on the page of ls-x.de
// @author       GF Zhang
// @include      *ls-x.de/de/tradebox*
// @supportURL   https://github.com/yiyunzhi/lsviewer
// @updateURL    https://github.com/yiyunzhi/lsviewer/raw/master/lsviewer/tradebox.user.js
// @downloadURL  https://raw.githubusercontent.com/yiyunzhi/lsviewer/master/tradebox.user.js
// @require      https://code.jquery.com/jquery-3.4.1.min.js
// @require      https://code.highcharts.com/highcharts.js
// @require      https://code.highcharts.com/modules/heatmap.js
// @require      https://code.highcharts.com/modules/treemap.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_setClipboard
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @run-at       document-end
// @noframes
// ==/UserScript==
(function() {
    'use strict';
    var $ = jQuery.noConflict();
    'use strict';
    // template used to insert
    var _template='<div class="row">'+
            '<div class="col-md-12">'+
            '<div id="treeMapContainer" style="width:100%; height:400px;"></div>'+
            '<h4 id="updateDate" style="text-align: center"></h4></div></div>';
    var _treemapParentElm=$('div#page_content> .mpe_container> .mpe_bootstrapgrid');
    var _tradeTable=$('table[data-type="trades"]');
    _treemapParentElm.prepend(_template);
    // only 10 items be plotted
    const _topMaxLength = 10;
    var _topCollection = [];
    // initial highchart
    var myChart = Highcharts.chart('treeMapContainer', {
        colorAxis: {
            minColor: '#FFFFDF',
            maxColor: Highcharts.getOptions().colors[0]
        },
        chart: {
            animation: false
        },
        series: [{
            type: 'treemap',
            animation: false,
            layoutAlgorithm: 'squarified',
            data: []
        }],
        plotOptions: {
            treemap: {
                animation: false,
                tooltip: {
                    headerFormat: '<b>{point.name}</b><br>',
                    pointFormat: '<b>{point.name}</b><br>{point.value} Stk.,{point.price} Euro, Ingst: {point.value} Euro'
                },
                dataLabels: {
                    crop: true,
                    formatter: function () {
                        return '<b style="font-size: 16px">' + this.point.name + '</b> ' +
                            '<br/>' +
                            '<b>Preise: ' + this.point.price + ' €</b> ' +
                            '<br/>' +
                            '<b>Kurse: ' + this.point.volume + ' Stk.</b> ' +
                            '<br/>' +
                            '<b>Beitrag: ' + this.point.value + ' €</b>';
                    },
                    color: 'red'
                }
            }
        },
        title: {
            text: 'Trade Treemap'
        }
    });
    // function used to sort
    function dsc_compare(property) {
        return function (obj1, obj2) {
            var value1 = obj1[property];
            var value2 = obj2[property];
            return value1 - value2;
        }
    }
    //function to update the topCollectionArray
    var updateTopCollection = function (obj) {
        var _idx = _topCollection.findIndex(function (o) {
            return o.name === obj.name;
        });
        if (_idx != -1) {
            _topCollection[_idx].value += obj.value;
            _topCollection[_idx].volume += obj.volume;
            _topCollection[_idx].price = obj.price;
        } else {
            _topCollection.push(obj);
        }
        // sort collection;
        _topCollection.sort(dsc_compare('value', true));
        //console.log('result:', _topCollection);
    };
    //function to update the DataSeries of myChart
    var funcUpdateDataSeries = function () {
        var _series = myChart.series[0];
        var _iteration_max = _topCollection.length >= _topMaxLength ? _topMaxLength : _topCollection.length;
        var _tops = _topCollection.slice(-1 * _iteration_max);
        for (var i = 0; i < _iteration_max; i++) {
            var _p = {
                name: _tops[i].name,
                value: _tops[i].value,
                price: _tops[i].price,
                volume: _tops[i].volume,
                colorValue: _iteration_max - i
            };
            if (_series.data[i]) {
                _series.data[i].update(_p);
            } else {
                _series.addPoint(_p);
            }

        }
    };
    // function to parse the price string that with currency symbol in it.
    var funcParsePriceString = function (s) {
        return parseFloat(s.replace('.', '').replace(',', '.').replace('€', ''));
    };
    // bind the DOMNodeInserted and handle the update of the topCollection and the chart
    _tradeTable.on('DOMNodeInserted', function (e) {
        var array = $(this).find("tbody tr").eq(1).children().toArray();
        var _obj = {
            date: array.pop().innerText,
            volume: parseInt(array.pop().innerText),
            price: funcParsePriceString(array.pop().innerText),
            name: array.pop().innerText
        };
        _obj.value = _obj.volume * _obj.price;
        updateTopCollection(_obj);
        funcUpdateDataSeries();
        $('#updateDate').text(_obj.date);
    });
})();
