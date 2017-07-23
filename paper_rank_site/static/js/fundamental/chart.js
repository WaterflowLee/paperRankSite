'use strict'
function Chart(id) {
    this._margins = {top: 30, left: 30, right: 30, bottom: 30};
    this._colors = d3.scaleOrdinal(d3.schemeCategory10);
    this._padding = 5;
    this._outerDivId = id;
}

Chart.prototype.render = function () {
    var self = this;
    if (!self._svg) {
        var selector = "div#" + self._outerDivId;
        self._width = $(selector).width();
        self._height = $(selector).height();
        self._svg = d3.select(selector).append("svg")
            .attr("height", self._height)
            .attr("width", self._width);

        self.renderAxes();
        self.defineMainBodyClip();
    }

    self.renderBody();
};

Chart.prototype.renderAxes = function () {
    var self = this;
    self._axesG = self._svg.append("g")
        .attr("class", "axes");
    self.renderXAxis();
    self.renderYAxis();
};

Chart.prototype.renderXAxis = function  () {
    var self = this;
    self._xScale = self._xScale.range([0, self.quadrantWidth()]);
    var xAxis = d3.axisBottom(self._xScale);
    self._axesG.append("g")
        .attr("class", "x axis")
        .attr("transform", function () {
            return "translate(" + self.xStart() + "," + self.yStart() + ")";
        })
        .call(xAxis);
    d3.selectAll("g.x g.tick")
        .append("line")
        .classed("grid-line", true)
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 0)
        .attr("y2", -self.quadrantHeight());
};

Chart.prototype.renderYAxis = function () {
    var self = this;
    self._yScale = self._yScale.range([self.quadrantHeight(), 0]);
    var yAxis = d3.axisLeft(self._yScale);
    self._axesG.append("g")
        .attr("class", "y axis")
        .attr("transform", function () {
            return "translate(" + self.xStart() + "," + self.yEnd() + ")";
        })
        .call(yAxis);

    d3.selectAll("g.y g.tick")
        .append("line")
        .classed("grid-line", true)
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", self.quadrantWidth())
        .attr("y2", 0);
};

 Chart.prototype.defineMainBodyClip = function() {
    var self = this;
    self._svg.append("defs")
        .append("clipPath")
        .attr("id", "MainBodyClip")
        .append("rect")
        .attr("x", 0 - 2 * self._padding)
        .attr("y", 0)
        .attr("width", self.quadrantWidth() + 2 * self._padding)
        .attr("height", self.quadrantHeight() + 2 * self._padding);
};

Chart.prototype.renderBody = function() {
    var self = this;
    if (!self._bodyG)
        self._bodyG = self._svg.append("g")
            .attr("class", "body")
            .attr("transform", "translate("
                + self.xStart()
                + ","
                + self.yEnd() + ")")
            .attr("clip-path", "url(#MainBodyClip)");
    return self;
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