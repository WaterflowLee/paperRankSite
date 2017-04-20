'use strict'
$(function() {
	var netChart = paperNet();
	$("#slider_time_range").slider({
		range: true,
		min: 1900,
		max: 2015,
		values: [1960, 1970],
		slide: function(event, ui) {
			$("#time_range_start").val(ui.values[0]);
			$("#time_range_end").val(ui.values[1]);
		}
	});
	$("#time_range_start").val($("#slider_time_range").slider("values", 0));
	$("#time_range_end").val($("#slider_time_range").slider("values", 1));

	$("#slider_interval").slider({
		value: 10,
		min:1,
		max:30,
		slide:function(event, ui){
			$("#interval").val(ui.value);
			netChart.draw();
		}
	});
	$("#interval").val($("#slider_interval").slider("value"));

	$("#slider_threshold").slider({
		value: 10,
		min:1,
		max:30,
		slide:function(event, ui){
			$("#threshold").val(ui.value);
			netChart.draw();
		}
	});
	$("#threshold").val($("#slider_threshold").slider("value"));

	$("#time_range_start").change(function(){
		$("#slider_time_range").slider("values", 0, $("#time_range_start").val());
	});
	$("#time_range_end").change(function(){
		// values 是一个函数啊，后面传入的两个值是参数
		$("#slider_time_range").slider("values", 1, $("#time_range_end").val());
	});
	$("#threshold").change(function(){
		$("#slider_threshold").slider("value", $("#threshold").val());
		netChart.draw();
	});
	$("#interval").change(function(){
		$("#slider_interval").slider("value", $("#interval").val());
		netChart.draw();
	});
	$("#accordion").accordion({"heightStyle":"content"});
	$("#request").click(netChart.ajaxGetPapers);
});
function paperNet(){
	var _netChart = {};
	var w = 0, h = 0;
	var networkChart = {
			vis : null,
			nodes : [],
			links : [],
			force : null
	};
	var papers = [];
	var colors = d3.scaleOrdinal(d3.schemeCategory20);
	var sizeScale = d3.scalePow().exponent(0.5)
			.range([5, 50]);
	var weightScale = d3.scaleLog().base(2).domain([1,2]).range([2,3]);

	_netChart.ajaxGetPapers = function (){
		var data = {};
		data["start"] = $("#time_range_start").val();
		data["end"] = $("#time_range_end").val();
		var settings = {
			"method":"POST",
			"dataType":"json",
			"data":data
		};
		$("#hint").css("visibility", "visible").text("Waiting For Data...");
		var url = "";
		if($("#topId").is(":checked")){
			url = "/papers/" + 1 + "/";
		}
		else{
			url = "/papers/" + 0 + "/";
		}
		$.ajax(url, settings)
			.done(function(echo_data){
				papers = echo_data["docs"];
				sizeScale.domain([1, echo_data["max_loss_value"]]);
				// 在API reference中是method的直接在slider中调用并传入实参,
				// 不是method的而在API reference 中显示为options的需要调用option并传入选项名和值
				$("#slider_threshold").slider("option", "max", echo_data["max_loss_value"]);
				$("#max_loss_value").text(parseInt(echo_data["max_loss_value"]));
				$("#hint").text("Data is Ready");
			})
			.fail(function(xhr, status){
			console.log("fail "+ xhr.status + " because " + status);
			})
			.always(function(){
			console.log("request completed!");
			});
	};
	_netChart.draw = function () {
		if( d3.select("#graph") != null ) {
			d3.select("#graph").remove();
		}
		w = $('#graphHolder').width();
		h = $('#graphHolder').height();
		// clear network, if available
		if( networkChart.force != null ){
			networkChart.force.stop();
		}
		networkChart.nodes = [];
		networkChart.links = [];
		buildNetwork();
		drawNetwork();
	};
	function buildNetwork(){
		var threshold = $("#threshold").val();
		var interval = $("#interval").val();
		var filtered_papers = [];
		papers.forEach(function(p){
			if(p["loss_value"][String(interval)] >= threshold){
				filtered_papers.push({
					"_id":p["_id"],
					"size":p["loss_value"][String(interval)],
					"reference_normalized_weights":p["reference_normalized_weights"]
				});
			}
		});	
		var links = deriveLinks(filtered_papers);
		networkChart.nodes = filtered_papers;
		networkChart.links = links;
	}
	function deriveLinks(ps){
		var links = [];
		var ps_set = new Set();
		ps.forEach(function(p){
			ps_set.add(p["_id"]);
		});
		ps.forEach(function(p){
			var refs = p["reference_normalized_weights"];
			for (var ref in refs){
				if(refs.hasOwnProperty(ref) && ps_set.has(ref)){
					links.push({
						"source":ref,
						"target":p["_id"],
						"weight":refs[ref]
					});
				}
			} 
		});
		return links;
	}
	// 一条link中的source 和 target 默认应该放的是nodes中两个不同的node对象
	//我现在放的是字符串肯定不行啊，可以模仿像langnet那样用的是node对象在nodes数组中的index
	function d3Id(id, prefix=""){
		return prefix + id.replace(".", "-").replace(":", "_");
	}
	function drawNetwork() {
		networkChart.vis = d3.select("#graphHolder").append("svg:svg").attr("id", "graph").attr("width", w).attr("height", h);
		var simulation = d3.forceSimulation()
			.force("link", d3.forceLink().id(function(d){return d._id;}))
			.force("charge", d3.forceManyBody().strength(function(){return 30;}))
			.force("center", d3.forceCenter(w/2, h/2))
			.force("collide", d3.forceCollide().radius(function(d,i){
				return sizeScale(d.size)+10;
				}));
		var link_visual_elems = networkChart.vis.append("g")
			.attr("class", "links")
			.selectAll("line.link")
			.data(networkChart.links)
			.enter().append("line")
			.attr("class", "link")
			.style("stroke", function(d, i) { return colors(i); })
			.style("stroke-width", function(d){ return weightScale(d.weight+1); });

		var node_visual_elems = networkChart.vis.append("g")
			.attr("class", "nodes")
			.selectAll("circle.node")
			.data(networkChart.nodes)
			.enter().append("circle")
			.attr("class", "node")
			.attr("id", function(d){return d3Id(d._id, "c_");})
			.attr("r", function(d, i) { return sizeScale(d.size); })
			.style("fill", function(d, i) { return colors(i); })
			.style("stroke", "#FFF")
			.style("stroke-width", 2)
			.call(d3.drag()
				.on("start", dragstarted)
				.on("drag", dragged)
				.on("end", dragended)
			);
		node_visual_elems.on("dblclick", function(d) {
			showInformation(d._id);
			d3.selectAll("circle").style("stroke", "#FFF");
			d3.select("#" + d3Id(d._id, "c_"))
				.style("stroke", "#000");
		});
		simulation
			.nodes(networkChart.nodes)
			.on("tick", ticked);

		simulation
			.force("link")
			.links(networkChart.links);
		networkChart.force = simulation;
		function ticked() {
			//d 是数据对象，由force layout计算x,y并存储在数据对象中的，下面是将更新后的数据对象中的值传递给可视元素
			//为了限制可视元素在一个box中，我们需要审查更改数据对象中的值，然后再将其传递给可视元素
			networkChart.nodes.forEach((node) => {
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
	}
	return _netChart;
}
function showInformation(id){
	var settings = {
		"method":"GET",
		"dataType":"json"
	};
	var url = "";
	if($("#topId").is(":checked")){
		url = "/paper/" + 1 + "/";
	}
	else{
		url = "/paper/" + 0 + "/";
	}
	$.ajax(url + id, settings)
		.done(function(echo_data){
			$("#id").text(id);
			$("#name").text(echo_data["name"].toLowerCase());
			$("#journal").text(echo_data["journal"].toLowerCase());
			$("#eigen").text(echo_data["eigen"]);
			$("#time").text(echo_data["time"]);
			$("#referenceWeight").html("");
			$("#referenceWeight").append("<ul id='referenceWeightList'></ul>");
			var reference_normalized_weights = echo_data["reference_normalized_weights"];
			for(var key in reference_normalized_weights){
				if(reference_normalized_weights.hasOwnProperty(key)){
					$("#referenceWeightList").append(
						"<li>"+key+":"+parseFloat(reference_normalized_weights[key]).toFixed(2)+"</li>");
				}
			}
			$("#citations").html("");
			$("#citations").append("<ul id='citationsList'></ul>");
			for(var i=0;i<echo_data["citations"].length;i++){
				$("#citationsList").append("<li>"+ echo_data["citations"][i] +"</li>");
			}
			$("#accordion").accordion("refresh");
			$("#lossValueSpan").css("visibility", "visible");
			drawLossValueChart(echo_data["loss_value"], "lossValueChart");
			if (echo_data["marginal_loss_value"] !== undefined){
				$("#MarginalLossValueSpan").css("visibility", "visible");
				drawLossValueChart(echo_data["marginal_loss_value"], "MarginalLossValueChart");
			}
		})
		.fail(function(xhr, status){
			console.log("fail "+ xhr.status + " because " + status);
		})
		.always(function(){
			console.log("request completed!");
		});
}
function drawLossValueChart(lossValue, divId){
	$("#" + divId).html("");
	var series = [];
	var xMax = _.max(_.map(_.keys(lossValue), function(k){return parseInt(k);}));
	for (var i=1;i<=xMax;i++){
		series.push({"0":i, "1":lossValue[i]});
	}
	var yMax = _.max(series, function(n){ return n["1"]; })["1"];
	var chart = lineChart()
		.outerDivId(divId)
    	.xScale(d3.scaleLinear().domain([1,  series.length]))
    	.yScale(d3.scaleLinear().domain([0, yMax]));
    chart.data([series]);
	chart.render();
	$(".dot, .line").css("fill", "#FFF");
}