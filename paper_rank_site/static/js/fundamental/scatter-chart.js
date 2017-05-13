'use strict'
function renderCircles(){
	var self = this;
	self._bodyG.selectAll("circle.node")
		.data(self._data)
		.enter()
		.append("circle")
		.attr("class", "node")
		.attr("cx", function (d) {
			return self._xScale(d[0]);
		})
		.attr("cy", function (d) {
			return self._yScale(d[1]);
		})
		.attr("r", function (d) {
			return self._sizeScale(d[2]);
		})
		.attr("fill", "#ffffff");
	self._bodyG.selectAll("circle.node")
		.data(self._data)
		.transition()
		.attr("fill",function(d){
			return self._colors(d[3]);
		});
}

function ScatterChart(id, scale) {
	this._sizeScale = scale;
	Chart.call(this, id);
}
ScatterChart.prototype = Object.create(Chart.prototype);
ScatterChart.prototype.constructor = ScatterChart;
ScatterChart.prototype.renderCircles = renderCircles;



function randomData() {
	return Math.random() * 9;
}
var numberOfDataPoint = 35,
	data = [];

for (var i = 0; i < numberOfDataPoint; ++i){
	var obj = {
		0:randomData(),
		1:randomData(),
		2:randomData()
	};
	data.push(obj);
}

var sizeScale = d3.scalePow().exponent(0.5).range([5, 50]).domain([0, 9]);
var chart = new ScatterChart("graphHolder", sizeScale);
chart.xScale(d3.scaleLinear().domain([0, 9]));
chart.yScale(d3.scaleLinear().domain([0, 9]));


chart.data(data);

chart.render();
chart.renderCircles();