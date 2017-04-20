'use strict'
function expandedAreaChart() {
    var _chart = {};
    var _margins = {top: 30, left: 30, right: 30, bottom: 30};
    var _xScale, _yScale, _data, stackedData, _outerDivId,
        _colors = d3.scaleOrdinal(d3.schemeCategory10),
        _svg,
        _bodyG,
        _axesG;
    var _width, _height;

    _chart.render = function () {
        if (!_svg) {
            _width = $("div#" + _outerDivId).width();
            _height = $("div#"+_outerDivId).height();
            _svg = d3.select("div#" + _outerDivId).append("svg")
                    .attr("height", _height)
                    .attr("width", _width);

            renderAxes();

            defineMainBodyClip();
        }

        renderMainBody();
    };

    function renderAxes() {
        _axesG = _svg.append("g")
                .attr("class", "axes");

        renderXAxis();

        renderYAxis();
    }

    function renderXAxis() {
        _xScale = _xScale.range([0, quadrantWidth()]);
        var xAxis = d3.axisBottom(_xScale);
        _axesG.append("g")
                .attr("class", "x axis")
                .attr("transform", function () {
                    return "translate(" + xStart() + "," + yStart() + ")";
                })
                .call(xAxis);

        d3.selectAll("g.x g.tick")
                .append("line")
                .classed("grid-line", true)
                .attr("x1", 0)
                .attr("y1", 0)
                .attr("x2", 0)
                .attr("y2", -quadrantHeight());
    }

    function renderYAxis() {
        _yScale = _yScale.range([quadrantHeight(), 0]);
        var yAxis = d3.axisLeft(_yScale);
        _axesG.append("g")
                .attr("class", "y axis")
                .attr("transform", function () {
                    return "translate(" + xStart() + "," + yEnd() + ")";
                })
                .call(yAxis);

        d3.selectAll("g.y g.tick")
                .append("line")
                .classed("grid-line", true)
                .attr("x1", 0)
                .attr("y1", 0)
                .attr("x2", quadrantWidth())
                .attr("y2", 0);
    }

    function defineMainBodyClip() {
        var padding = 5;

        _svg.append("defs")
                .append("clipPath")
                .attr("id", "MainBodyClip")
                .append("rect")
                .attr("x", 0 - padding)
                .attr("y", 0)
                .attr("width", quadrantWidth() + 2 * padding)
                .attr("height", quadrantHeight());
    }

    function renderMainBody() {
        if (!_bodyG)
            _bodyG = _svg.append("g")
                    .attr("class", "body")
                    .attr("transform", "translate("
                            + xStart() + ","
                            + yEnd() + ")")
                    .attr("clip-path", "url(#MainBodyClip)");
        // stack 是一种layout,和force layout是一样的,都负责计算更新托管数据
        var stack = d3.stack().keys(d3.range(numberOfSeries)).offset(d3.stackOffsetExpand);
        stackedData = stack(_data);

        renderLines(stackedData);

        renderAreas(stackedData);
    }

    function renderLines(stackedData) {
        var _line = d3.line()
                .x(function (d, i) {
                    return _xScale(i);
                })
                .y(function (d, i) {
                    return _yScale(d[1]);
                });

        _bodyG.selectAll("path.line")
                        .data(stackedData)
                .enter()
                .append("path")
                .style("stroke", function (d, i) {
                    return _colors(i);
                })
                .attr("class", "line");

        _bodyG.selectAll("path.line")
                    .data(stackedData)
                .transition()
                .attr("d", function (d, i) {
                    return _line(d, i);
                });
    }

    function renderAreas(stackedData) {
        var _area = d3.area()
                .x(function (d, i) {
                    return _xScale(i);
                })
                .y0(function(d, i){
                    return _yScale(d[0]);})
                .y1(function (d, i) {
                    return _yScale(d[1]);});

        _bodyG.selectAll("path.area")
                    .data(stackedData)
                .enter()
                .append("path")
                .style("fill", function (d, i) {
                    return _colors(i);
                })
                .attr("class", "area");

        _bodyG.selectAll("path.area")
                    .data(stackedData)
                .transition()
                .attr("d", function (d, i) {
                    return _area(d, i);
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

    _chart.data = function (d) {
        if(!arguments.length) return _data;
        _data = d;
        return _chart;
    };
    _chart.outerDivId = function (id){
        if(!arguments.length) return _outerDivId;
        _outerDivId = id;
        return _chart;
    };
    return _chart;
}

// function randomData() {
//     return Math.random() * 9;
// }
// var numberOfSeries = 4,
//         numberOfDataPoint = 35,
//         data = [];

// for (var i = 0; i < numberOfDataPoint; ++i){
//     var obj = {};
//     for (var j = 0; j < numberOfSeries; ++j){
//         obj[j] = randomData();
//     }
//     data.push(obj);
// }
// var chart = expandedAreaChart()
//         .outerDivId("graphHolder")
//         .xScale(d3.scaleLinear().domain([0, numberOfDataPoint - 1]))
//         .yScale(d3.scaleLinear().domain([0, 1]));


// chart.data(data);

// chart.render();