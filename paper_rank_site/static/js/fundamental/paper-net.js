'use strict'
function paperNet(){
	var w, h;
	var _netChart = {
			vis : null,
			nodes : [],
			links : [],
			force : null
	};
	var _outerDivId;
	var colors = d3.scaleOrdinal(d3.schemeCategory20);
	var _sizeScale;
	var weightScale = d3.scaleLog().base(2).domain([1,2]).range([2,3]);

	_netChart.reset = function () {
		// select 一个不存在的元素会返回什么null or undefined ?
		if( d3.select("#graph") !== null ) {
			d3.select("#graph").remove();
		}
		var selector = "div#" + _outerDivId;
		w = $(selector).width();
		h = $(selector).height();
		// clear network, if available
		if( _netChart.force !== null ){
			_netChart.force.stop();
		}
		_netChart.nodes = [];
		_netChart.links = [];
		return _netChart;
	};
	_netChart.buildNetwork = function (nodes, links){
		_netChart.nodes = nodes;
		_netChart.links = links;
		return _netChart;
	};
	// 一条link中的source 和 target 默认应该放的是nodes中两个不同的node对象
	//我现在放的是字符串肯定不行啊，可以模仿像langnet那样用的是node对象在nodes数组中的index
	function d3Id(id, prefix=""){
		return prefix + id.replace(".", "-").replace(":", "_");
	}
	_netChart.drawNetwork = function() {
		_netChart.vis = d3.select("#" + _outerDivId)
			.append("svg:svg")
			.attr("id", "graph")
			.attr("width", w)
			.attr("height", h);
		var simulation = d3.forceSimulation()
			.force("link", d3.forceLink().id(function(d){return d._id;}))
			.force("charge", d3.forceManyBody().strength(function(){return 30;}))
			.force("center", d3.forceCenter(w/2, h/2))
			.force("collide", d3.forceCollide().radius(function(d,i){
				return _sizeScale(d.size)+10;
				}));
		var link_visual_elems = _netChart.vis.append("g")
			.attr("class", "links")
			.selectAll("line.link")
			.data(_netChart.links)
			.enter()
			.append("line")
			.attr("class", "link")
			.style("stroke", function(d, i) { return colors(i); })
			.style("stroke-width", function(d){ return weightScale(d.weight+1); });

		var node_visual_elems = _netChart.vis.append("g")
			.attr("class", "nodes")
			.selectAll("circle.node")
			.data(_netChart.nodes)
			.enter()
			.append("circle")
			.attr("class", "node")
			.attr("id", function(d){return d3Id(d._id, "c_");})
			.attr("r", function(d, i) { return _sizeScale(d.size); })
			.style("fill", function(d, i) { return colors(i); })
			.style("stroke", "#FFF")
			.style("stroke-width", 2)
			.call(d3.drag()
				.on("start", dragstarted)
				.on("drag", dragged)
				.on("end", dragended)
			);

		simulation
			.nodes(_netChart.nodes)
			.on("tick", ticked);

		simulation
			.force("link")
			.links(_netChart.links);
		_netChart.force = simulation;
		function ticked() {
			//d 是数据对象，由force layout计算x,y并存储在数据对象中的，下面是将更新后的数据对象中的值传递给可视元素
			//为了限制可视元素在一个box中，我们需要审查更改数据对象中的值，然后再将其传递给可视元素
			_netChart.nodes.forEach(function (node){
				// d3.select()对于selector有诸多的限制,不能数字打头，且不能含: + 以及. 这两个都是有语义的
				// $()则没有不能数字打头的限制，在此使用jQuery的选择器
				var radius = parseFloat(d3.select("#" + d3Id(node["_id"], "c_")).attr("r"));
				var gw = parseFloat(d3.select("#graph").attr("width"));
				var gh = parseFloat(d3.select("#graph").attr("height"));
				if (node.x < radius) {
					node.x = radius;
					node.vx = 0;
				}
				if (node.y < radius) {
					node.y = radius;
					node.vy = 0;
				}
				if (node.x > gw - radius) {
					node.x = gw - radius;
					node.vx = 0;
				}
				if (node.y > gh - radius) {
					node.y = gh- radius;
					node.vy = 0;
				}
			});
			// 下面的link相关的都是根据d.source 即node对象推出来的
			// 因此我只需要在上面审查更改node对象的值就好，不需要手动更改d.source的值
			link_visual_elems
				.attr("x1", function(d) { return d.source.x; })
				.attr("y1", function(d) { return d.source.y; })
				.attr("x2", function(d) { return d.target.x; })
				.attr("y2", function(d) { return d.target.y; });
			node_visual_elems
				.attr("cx", function(d) { return d.x; })
				.attr("cy", function(d) { return d.y; });
		}
		function dragstarted(d) {
			if (!d3.event.active) simulation.alphaTarget(0.3).restart();
			d.fx = d.x;
			d.fy = d.y;
		}

		function dragged(d) {
			d.fx = d3.event.x;
			d.fy = d3.event.y;
		}

		function dragended(d) {
			if (!d3.event.active) simulation.alphaTarget(0);
			d.fx = null;
			d.fy = null;
		}
	};
	_netChart.outerDivId = function (id){
        if(!arguments.length) return _outerDivId;
        _outerDivId = id;
        return _netChart;
    };
	_netChart.sizeScale = function (scale) {
		if(!arguments.length) return _sizeScale;
		_sizeScale = scale;
		return _netChart;
    };
	return _netChart;
}