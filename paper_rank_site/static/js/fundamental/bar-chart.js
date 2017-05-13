var renderBars = function () {
    var self = this;
    var padding = 2;

    self._bodyG.selectAll("rect.bar")
        .data(self._data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("id", function (d,i) {
            return i;
        });

    self._bodyG.selectAll("rect.bar")
        .data(self._data)
        .transition()
        .attr("x", function (d) {
            return self._xScale(d.x);
        })
        .attr("y", function (d) {
            return self._yScale(d.y);
        })
        .attr("height", function (d) {
            return self.yStart() - self._yScale(d.y) - self.yEnd();
        })
        .attr("width", function(d){
            return Math.floor(self.quadrantWidth() / self._data.length) - padding;
        });
};

function BarChart(id) {
    Chart.call(this, id);
}
BarChart.prototype = Object.create(Chart.prototype);
BarChart.prototype.constructor = BarChart;
BarChart.prototype.renderBars = renderBars;



function randomData() {
    return Math.random() * 9;
}

var numberOfDataPoint = 31,
    data;

data = d3.range(numberOfDataPoint).map(function (i) {
    return {x: i, y: randomData()};
});

var chart = new BarChart("graphHolder");
chart.xScale(d3.scaleLinear().domain([0, 31]));
chart.yScale(d3.scaleLinear().domain([0, 10]));


chart.data(data);

chart.render();
chart.renderBars();