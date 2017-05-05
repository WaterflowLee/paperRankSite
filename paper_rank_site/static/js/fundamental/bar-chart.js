var renderBars = function () {

    var padding = 2; // <-A

    this._bodyG.selectAll("rect.bar")
        .data(this._data)
        .enter()
        .append("rect") // <-B
        .attr("class", "bar")
        .attr("id", function (d,i) {
            return i;
        });

    this._bodyG.selectAll("rect.bar")
        .data(this._data)
        .transition()
        .attr("x", function (d) {
            return this._xScale(d.x); // <-C
        })
        .attr("y", function (d) {
            return this._yScale(d.y); // <-D
        })
        .attr("height", function (d) {
            return this.yStart() - this._yScale(d.y) - this.yEnd();
        })
        .attr("width", function(d){
            return Math.floor(this.quadrantWidth() / this._data.length) - padding;
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