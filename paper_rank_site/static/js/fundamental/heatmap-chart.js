'use strict'
// 都是函数类模式, 即构造函数返回对象
function heatmapChart() {
    var _chart = {};
    var _width, _height,
        _margins = {top:30, left:30, right:30, bottom:30},
        _xScale, _yScale, _outerDivId, _data,
        _colors = d3.scaleOrdinal(d3.schemeCategory20),
        _svg,
        _axesG,
        _bodyG,
        _cellXSize,
        _cellYSize;
    _chart.render = function(){
        if(!_svg){
            _width = $("div#" + _outerDivId).width();
            _height = $("div#" + _outerDivId).height();
            _svg = d3.select("div#" + _outerDivId)
                .append("svg")
                .attr("width", _width)
                .attr("height", _height);
            renderAxes();
            defineMainBodyClip();
        }
        renderMainBody();
    };
    function renderAxes(){
        _axesG = _svg.append("g")
            .attr("class","axes");
        renderXAxis();
        renderYAxis();
    }
    function renderXAxis(){
        _xScale = _xScale.range([0, quadrantWidth()]);
        var xAxisGenerator = d3.axisBottom(_xScale);
        _axesG.append("g")
            .attr("class", "x axis")
            // 是相对本该在的位置的移动！本该在的位置和父元素有关
            .attr("transform", function(){
                return "translate(" + xStart() + "," +
                    yStart() + ")";
            })
            .call(xAxisGenerator);
    }
    function renderYAxis(){
        _yScale = _yScale.range([quadrantHeight(), 0]);
        var yAxisGenerator = d3.axisLeft(_yScale);
        _axesG.append("g")
            .attr("class", "y axis")
            // 是相对本该在的位置的移动！本该在的位置和父元素有关
            .attr("transform", function(){
                return "translate(" + xStart() + "," +
                    yEnd() + ")";
            })
            .call(yAxisGenerator);
    }
    function defineMainBodyClip(){
        var padding = 5;
        _svg.append("defs")
            .append("clipPath")
            .attr("id", "MainBodyClipPath")
            .append("rect")
            .attr("x", 0 - padding)
            .attr("y", 0 - padding)
            .attr("width", quadrantWidth() + 2*padding)
            .attr("height", quadrantHeight() + 2*padding);
    }
    function renderMainBody(){
        _cellXSize = _xScale(2) - _xScale(1) - 1;
        _cellYSize = _yScale(1) - _yScale(2) - 1;
        _bodyG = _svg.append("g")
            .attr("class", "mainBody")
            .attr("transform", function(){
                return "translate(" + xStart() + ","
                    + yEnd() +")";
            })
            .attr("clip-path", "url(#MainBodyClipPath)");
        renderRectangles();
    }
    function renderRectangles(){
        // selectAll 和 data 分别指定两个集合,
        // 两个集合都指定后才能enter
        _bodyG.selectAll("rect.cell")
            .data(_data)
            .enter()
            .append("rect")
            .attr("class", "cell")
            .attr("width", _cellXSize)
            .attr("height", _cellYSize)
            .attr("x", function (d) {
                return _xScale(d[0]);
            })
            .attr("y", function (d) {
                return _yScale(d[1]) - _cellYSize;
            })
            .attr("fill", "#ffffff");
        _bodyG.selectAll("rect.cell")
            .data(_data)
            .transition()
            .attr("fill",function(d){
                return _colors(d[2]);
            });
    }

    function xStart() {
        return _margins.left;
    }

    function yStart() {
        return _height - _margins.bottom;
    }

    function xEnd() {
        return _width - _margins.right;
    }

    function yEnd() {
        return _margins.top;
    }

    function quadrantWidth() {
        return _width - _margins.left - _margins.right;
    }

    function quadrantHeight() {
        return _height - _margins.top - _margins.bottom;
    }

    _chart.width = function (w) {
        if (!arguments.length) return _width;
        _width = w;
        return _chart;
    };

    _chart.height = function (h) { // <-1C
        if (!arguments.length) return _height;
        _height = h;
        return _chart;
    };

    _chart.margins = function (m) {
        if (!arguments.length) return _margins;
        _margins = m;
        return _chart;
    };

    _chart.colors = function (c) {
        if (!arguments.length) return _colors;
        _colors = c;
        return _chart;
    };

    _chart.xScale = function (x) {
        if (!arguments.length) return _xScale;
        _xScale = x;
        return _chart;
    };

    _chart.yScale = function (y) {
        if (!arguments.length) return _yScale;
        _yScale = y;
        return _chart;
    };

    _chart.data = function (d){
        if(!arguments.length) return _data;
        _data = d;
        return _chart;
    };
    _chart.outerDivId = function (id){
        if(!arguments.length) return _outerDivId;
        _outerDivId = id;
        return _chart;
    };

    return _chart; // <-1E
}