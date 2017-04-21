'use strict'
function barChart() {
    var _chart = {};
    var _margins = {top: 30, left: 30, right: 30, bottom: 30};
    var _xScale, _yScale, _data, _outerDivId,
        _colors = d3.scaleOrdinal(d3.schemeCategory10),
        _svg,
        _bodyG,
        _axesG;
    var _width, _height;

    _chart.render = function () {
        if (!_svg) {
            var selector = "div#" + _outerDivId;
            _width = $(selector).width();
            _height = $(selector).height();
            _svg = d3.select(selector).append("svg")
                .attr("height", _height)
                .attr("width", _width);

            renderAxes();

            defineMainBodyClip();
        }

        renderBody();
    };

    function renderAxes() {
        _axesG = _svg.append("g")
            .attr("class", "axes");
        renderXAxis();
        renderYAxis();
    }
    function renderXAxis () {
        _xScale = _xScale.range([0, quadrantWidth()]);
        var xAxis = d3.axisBottom(_xScale);
        _axesG.append("g")
            .attr("class", "x axis")
            .attr("transform", function () {
                return "translate(" + xStart() + "," + yStart() + ")";
            })
            .call(xAxis);
        // d3.selectAll("g.x g.tick")
        //     .append("line")
        //     .classed("grid-line", true)
        //     .attr("x1", 0)
        //     .attr("y1", 0)
        //     .attr("x2", 0)
        //     .attr("y2", -quadrantHeight());
    }
    // var xAxis = d3.svg.axis()
    //     .scale(_x.range([0, quadrantWidth()]))
    //     .orient("bottom");
    //
    // var yAxis = d3.svg.axis()
    //     .scale(_y.range([quadrantHeight(), 0]))
    //     .orient("left");
    //
    // axesG.append("g")
    //     .attr("class", "axis")
    //     .attr("transform", function () {
    //         return "translate(" + xStart() + "," + yStart() + ")";
    //     })
    //     .call(xAxis);
    //
    // axesG.append("g")
    //     .attr("class", "axis")
    //     .attr("transform", function () {
    //         return "translate(" + xStart() + "," + yEnd() + ")";
    //     })
    //     .call(yAxis);
    function renderYAxis() {
        _yScale = _yScale.range([quadrantHeight(), 0]);
        var yAxis = d3.axisLeft(_yScale);
        _axesG.append("g")
            .attr("class", "y axis")
            .attr("transform", function () {
                return "translate(" + xStart() + "," + yEnd() + ")";
            })
            .call(yAxis);

        // d3.selectAll("g.y g.tick")
        //     .append("line")
        //     .classed("grid-line", true)
        //     .attr("x1", 0)
        //     .attr("y1", 0)
        //     .attr("x2", quadrantWidth())
        //     .attr("y2", 0);
    }
    function defineMainBodyClip() {
        var padding = 5;

        _svg.append("defs")
            .append("clipPath")
            .attr("id", "MainBodyClip")
            .append("rect")
            .attr("x", 0 - 2 * padding)
            .attr("y", 0)
            .attr("width", quadrantWidth() + 2 * padding)
            .attr("height", quadrantHeight() + 2 * padding);
    }

    function renderBody() {
        if (!_bodyG)
            _bodyG = _svg.append("g")
                .attr("class", "body")
                .attr("transform", "translate("
                    + xStart()
                    + ","
                    + yEnd() + ")")
                .attr("clip-path", "url(#MainBodyClip)");

        renderBars();
    }

    function renderBars() {
        var padding = 2; // <-A

        _bodyG.selectAll("rect.bar")
            .data(_data)
            .enter()
            .append("rect") // <-B
            .attr("class", "bar")
            .attr("id", function (d,i) {
                return i;
            });

        _bodyG.selectAll("rect.bar")
            .data(_data)
            .transition()
            .attr("x", function (d) {
                return _xScale(d.x); // <-C
            })
            .attr("y", function (d) {
                return _yScale(d.y); // <-D
            })
            .attr("height", function (d) {
                return yStart() - _yScale(d.y) - 30;
            })
            .attr("width", function(d){
                return Math.floor(quadrantWidth() / _data.length) - padding;
            });
    }

    function xStart() {
        return _margins.left;
    }

    function yStart() {
        return _height - _margins.bottom;
    }
    _chart.yStart = function () {
        return yStart();
    };

    function xEnd() {
        return _width - _margins.right;
    }

    function yEnd() {
        return _margins.top;
    }
    _chart.yEnd = function () {
        return yEnd();
    };
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

    _chart.height = function (h) {
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
        if(!arguments.length){
            return _data;
        }
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

function randomData() {
    return Math.random() * 9;
}

var numberOfDataPoint = 31,
    data;

data = d3.range(numberOfDataPoint).map(function (i) {
    return {x: i, y: 1};
});

var chart = barChart().outerDivId("graphHolder")
    .xScale(d3.scaleLinear().domain([0, 31]))
    .yScale(d3.scaleLinear().domain([0, 10]));


chart.data(data);

chart.render();