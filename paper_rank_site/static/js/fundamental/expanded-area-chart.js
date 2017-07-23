'use strict';
var renderAreasLines = function () {
    var self = this;
    // stack 是一种layout,和force layout是一样的,都负责计算更新托管数据
    var stackedData = self._stack(self._data);

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
    //  在没有指定data中的key时，key用的是datum在data中的index；

    //  只有当data中datum数量增加时，才会运行enter，在data中的datum变化时不会运行enter
    //  即当datum变化时，仅仅在update中对已有可视元素进行变化
    self._bodyG.selectAll("path.line")
        .data(stackedData)
        .enter()
        .append("path")
        .style("stroke", function (d, i) {
            return self._colors(i);
        })
        .attr("class", "line");
    //  不管data中的每一个datum 变与不变，这一步都会重绘（改变属性d）
    //  即d3不关心每一个datum 变与不变，只关心data中datum数量的增或减，从而能增加或者删除可视元素，并在update中
    //  对已有元素和新加元素无差别重绘
    self._bodyG.selectAll("path.line")
        .data(stackedData)
        .transition()
        .attr("d", function (d, i) {
            return _line(d, i);
        });

    //  只有当data中datum数量减少时，才会运行exit，从而能删除可视元素
    self._bodyG.selectAll("path.line")
        .data(stackedData)
        .exit()
        .transition()
        .remove();
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

    self._bodyG.selectAll("path.area")
        .data(stackedData)
        .exit()
        .transition()
        .remove();
};

var stack = function (s) {
    if (!arguments.length) return this._stack;
    this._stack = s;
    return this;
};

function ExpandedAreaChart(outerDivId, stack) {
    this._stack = stack;
    Chart.call(this, outerDivId);
}

ExpandedAreaChart.prototype = Object.create(Chart.prototype);
ExpandedAreaChart.prototype.constructor = ExpandedAreaChart;
ExpandedAreaChart.prototype.renderAreasLines = renderAreasLines;
ExpandedAreaChart.prototype.renderLines = renderLines;
ExpandedAreaChart.prototype.renderAreas = renderAreas;
ExpandedAreaChart.prototype.stack = stack;

// function randomData() {
//     return Math.random() * 9;
// }
// var numberOfSeries = 4,
//         numberOfDataPoint = 35,
//         data = [];
//
// for (var i = 0; i < numberOfDataPoint; ++i){
//     var obj = {};
//     for (var j = 0; j < numberOfSeries; ++j){
//         obj[j] = randomData();
//     }
//     data.push(obj);
// }
//
// var stack = d3.stack().keys(d3.range(numberOfSeries)).offset(d3.stackOffsetExpand);
// var chart = new ExpandedAreaChart("graphHolder", stack);
// chart.xScale(d3.scaleLinear().domain([0, numberOfDataPoint - 1]));
// chart.yScale(d3.scaleLinear().domain([0, 1]));
//
//
// chart.data(data);
//
// chart.render();
// chart.renderAreasLines();