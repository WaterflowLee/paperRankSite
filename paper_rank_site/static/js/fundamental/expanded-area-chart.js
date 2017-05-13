'use strict';
var renderAreasLines = function () {
    var self = this;
    // stack 是一种layout,和force layout是一样的,都负责计算更新托管数据
    var stackedData = self.stack(self._data);

    self.renderLines(stackedData);

    self.renderAreas(stackedData);
};

var renderLines = function (stackedData) {
    var self = this;
    var _line = d3.line()
        .x(function (d, i) {
            return self._xScale(i);
        })
        .y(function (d, i) {
            return self._yScale(d[1]);
        });

    self._bodyG.selectAll("path.line")
        .data(stackedData)
        .enter()
        .append("path")
        .style("stroke", function (d, i) {
            return self._colors(i);
        })
        .attr("class", "line");

    self._bodyG.selectAll("path.line")
        .data(stackedData)
        .transition()
        .attr("d", function (d, i) {
            return _line(d, i);
        });
};

var renderAreas = function (stackedData) {
    var self = this;
    var _area = d3.area()
        .x(function (d, i) {
            return self._xScale(i);
        })
        .y0(function(d, i){
            return self._yScale(d[0]);})
        .y1(function (d, i) {
            return self._yScale(d[1]);});

    self._bodyG.selectAll("path.area")
        .data(stackedData)
        .enter()
        .append("path")
        .style("fill", function (d, i) {
            return self._colors(i);
        })
        .attr("class", "area");

    self._bodyG.selectAll("path.area")
        .data(stackedData)
        .transition()
        .attr("d", function (d, i) {
            return _area(d, i);
        });
};


function ExpandedAreaChart(outerDivId, stack) {
    this.stack = stack;
    Chart.call(this, outerDivId);
}

ExpandedAreaChart.prototype = Object.create(Chart.prototype);
ExpandedAreaChart.prototype.constructor = ExpandedAreaChart;
ExpandedAreaChart.prototype.renderAreasLines = renderAreasLines;
ExpandedAreaChart.prototype.renderLines = renderLines;
ExpandedAreaChart.prototype.renderAreas = renderAreas;

function randomData() {
    return Math.random() * 9;
}
var numberOfSeries = 4,
        numberOfDataPoint = 35,
        data = [];

for (var i = 0; i < numberOfDataPoint; ++i){
    var obj = {};
    for (var j = 0; j < numberOfSeries; ++j){
        obj[j] = randomData();
    }
    data.push(obj);
}

var stack = d3.stack().keys(d3.range(numberOfSeries)).offset(d3.stackOffsetExpand);
var chart = new ExpandedAreaChart("graphHolder", stack);
chart.xScale(d3.scaleLinear().domain([0, numberOfDataPoint - 1]));
chart.yScale(d3.scaleLinear().domain([0, 1]));


chart.data(data);

chart.render();
chart.renderAreasLines();