'use strict';
function renderLines(){
	var self = this;
	var lineGenerator = d3.line()
		.x(function(d){
			return self._xScale(d[0]);
		})
		.y(function(d){
			return self._yScale(d[1]);
		});
	self._bodyG.selectAll("path.line")
		.data(self._data)
		.enter()
		.append("path")
		.attr("class", "line")
		.style("stroke", function(d, i){
			return self._colors(i);
		})
		.style("fill", "none");

	self._bodyG.selectAll("path.line")
		.data(self._data)
		.transition()
		.attr("d",function(d){
			return lineGenerator(d);
		});
}

function renderDots(){
	var self = this;
	self._data.forEach(function(series, i){
		self._bodyG.selectAll("circle._" + i)
			.data(series)
			.enter()
			.append("circle")
			.attr("class", "dot _" + i)
			.attr("stroke-width", 0);

		self._bodyG.selectAll("circle._" + i)
			.data(series)
			.style("stroke", function(){
				return self._colors(i);
			})
			.style("fill", function(){
				return self._colors(i);
			})
			.attr("stroke-width", 1)
			.transition()
			.attr("cx", function(d){
				return self._xScale(d[0]);
			})
			.attr("cy", function(d){
				return self._yScale(d[1]);
			})
			.attr("r", self._radius ? self._radius : 4.5);

		self._bodyG.selectAll("circle._" + i)
			.data(series)
			.exit()
			.remove();
	});
}

function radius(r) {
	if (!arguments.length) return this._radius;
    this._radius = r;
    return this;
}

var LineChart = function (id) {
	Chart.call(this, id);
};

LineChart.prototype = Object.create(Chart.prototype);
LineChart.prototype.constructor = LineChart;
LineChart.prototype.renderLines = renderLines;
LineChart.prototype.renderDots = renderDots;
LineChart.prototype.radius = radius;

// function randomData() {
//     return Math.random() * 9;
// }
// var numberOfSeries = 2,
//         numberOfDataPoint = 35,
//         data = [];
//
// for (var i = 0; i < numberOfSeries; ++i){
//     var series = [];
//     for (var j = 0; j < numberOfDataPoint; ++j){
//         series.push({"0":j,"1":randomData()});
//     }
//     data.push(series);
// }
// var chart = new LineChart("graphHolder");
// chart.xScale(d3.scaleLinear().domain([0, numberOfDataPoint - 1]));
// chart.yScale(d3.scaleLinear().domain([0, 10]));
//
//
// chart.data(data);
// chart.render();
// chart.renderLines();
// chart.renderDots();
