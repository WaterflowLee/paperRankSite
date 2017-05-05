'use strict'
function Chart(id) {
    this._margins = {top: 30, left: 30, right: 30, bottom: 30};
    this._colors = d3.scaleOrdinal(d3.schemeCategory10);
    this._padding = 5;
    this._outerDivId = id;
}

Chart.prototype.render = function () {
    if (!this._svg) {
        var selector = "div#" + this._outerDivId;
        this._width = $(selector).width();
        this._height = $(selector).height();
        this._svg = d3.select(selector).append("svg")
            .attr("height", this._height)
            .attr("width", this._width);

        // this.renderAxes();

        this.defineMainBodyClip();
    }

    this.renderBody();
};

Chart.prototype.renderAxes = function () {
    this._axesG = this._svg.append("g")
        .attr("class", "axes");
    this.renderXAxis();
    this.renderYAxis();
};

Chart.prototype.renderXAxis = function  () {
    this._xScale = this._xScale.range([0, this.quadrantWidth()]);
    var xAxis = d3.axisBottom(this._xScale);
    this._axesG.append("g")
        .attr("class", "x axis")
        .attr("transform", function () {
            return "translate(" + this.xStart() + "," + this.yStart() + ")";
        })
        .call(xAxis);
    d3.selectAll("g.x g.tick")
        .append("line")
        .classed("grid-line", true)
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 0)
        .attr("y2", -this.quadrantHeight());
};

Chart.prototype.renderYAxis = function () {
    this._yScale = this._yScale.range([this.quadrantHeight(), 0]);
    var yAxis = d3.axisLeft(this._yScale);
    this._axesG.append("g")
        .attr("class", "y axis")
        .attr("transform", function () {
            return "translate(" + this.xStart() + "," + this.yEnd() + ")";
        })
        .call(yAxis);

    d3.selectAll("g.y g.tick")
        .append("line")
        .classed("grid-line", true)
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", this.quadrantWidth())
        .attr("y2", 0);
};

 Chart.prototype.defineMainBodyClip = function() {
    this._svg.append("defs")
        .append("clipPath")
        .attr("id", "MainBodyClip")
        .append("rect")
        .attr("x", 0 - 2 * this._padding)
        .attr("y", 0)
        .attr("width", this.quadrantWidth() + 2 * this._padding)
        .attr("height", this.quadrantHeight() + 2 * this._padding);
};

Chart.prototype.renderBody = function() {
    if (!this._bodyG)
        this._bodyG = this._svg.append("g")
            .attr("class", "body")
            .attr("transform", "translate("
                + this.xStart()
                + ","
                + this.yEnd() + ")")
            .attr("clip-path", "url(#MainBodyClip)");
    return this;
};

Chart.prototype.data = function (d) {
    if(!arguments.length){
        return this._data;
    }
    this._data = d;
    return this;
};

Chart.prototype.xScale = function (x) {
    if (!arguments.length) return this._xScale;
    this._xScale = x;
    return this;
};

Chart.prototype.yScale = function (y) {
    if (!arguments.length) return this._yScale;
    this._yScale = y;
    return this;
};

Chart.prototype.width = function (w) {
    if (!arguments.length) return this._width;
    this._width = w;
    return this;
};

Chart.prototype.height = function (h) {
    if (!arguments.length) return this._height;
    this._height = h;
    return this;
};

Chart.prototype.margins = function (m) {
    if (!arguments.length) return this._margins;
    this._margins = m;
    return this;
};

Chart.prototype.colors = function (c) {
    if (!arguments.length) return this._colors;
    this._colors = c;
    return this;
};

Chart.prototype.xStart = function () {
    return this._margins.left;
};

Chart.prototype.yStart = function () {
    return this._height - this._margins.bottom;
};

Chart.prototype.xEnd = function () {
    return this._width - this._margins.right;
};

Chart.prototype.yEnd = function () {
    return this._margins.top;
};

Chart.prototype.quadrantWidth = function() {
    return this._width - this._margins.left - this._margins.right;
};

Chart.prototype.quadrantHeight = function() {
    return this._height - this._margins.top - this._margins.bottom;
};