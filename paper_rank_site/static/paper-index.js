'use strict'
var papers;
var sizeScale = d3.scalePow().exponent(0.5).range([5, 50]);
var netChart = paperNet().outerDivId("graphHolder");
$(function() {
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
			draw(netChart);
		}
	});
	$("#interval").val($("#slider_interval").slider("value"));

	$("#slider_threshold").slider({
		range:true,
		min:1,
		max:30,
		values: [10,20],
		slide:function(event, ui){
			$("#thresholdLower").val(ui.values[0]);
			$("#thresholdUpper").val(ui.values[1]);
			draw(netChart);
		}
	});
	$("#thresholdLower").val($("#slider_threshold").slider("values", 0));
	$("#thresholdUpper").val($("#slider_threshold").slider("values", 1));

	$("#time_range_start").change(function(){
		$("#slider_time_range").slider("values", 0, $("#time_range_start").val());
	});
	$("#time_range_end").change(function(){
		// values 是一个函数啊，后面传入的两个值是参数
		$("#slider_time_range").slider("values", 1, $("#time_range_end").val());
	});
	$("#thresholdLower").change(function(){
		$("#slider_threshold").slider("values", 0, $("#thresholdLower").val());
		draw(netChart);
	});
	$("#thresholdUpper").change(function(){
		$("#slider_threshold").slider("values", 1, $("#thresholdUpper").val());
		draw(netChart);
	});
	$("#interval").change(function(){
		$("#slider_interval").slider("value", $("#interval").val());
		draw(netChart);
	});
	$("#accordion").accordion({"heightStyle":"content"});

	$("#request").click(ajaxGetPapers);
});

var ajaxGetPapers = function (){
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



function draw(netChart) {
	var thresholdLower = $("#thresholdLower").val();
	var thresholdUpper = $("#thresholdUpper").val();
	var interval = $("#interval").val();
	var filtered_papers = [];
	papers.forEach(function(p){
		if(p["loss_value"][String(interval)] >= thresholdLower && p["loss_value"][String(interval)] <= thresholdUpper){
			filtered_papers.push({
				"_id":p["_id"],
				"size":p["loss_value"][String(interval)],
				"reference_normalized_weights":p["reference_normalized_weights"]
			});
		}
	});
	var links = deriveLinks(filtered_papers);
	netChart.reset().sizeScale(sizeScale).buildNetwork(filtered_papers, links).drawNetwork();
	d3.selectAll("circle.node").on("dblclick", function(d) {
		showInformation(d._id);
		d3.selectAll("circle").style("stroke", "#FFF");
		d3.select("#" + d3Id(d._id, "c_"))
			.style("stroke", "#000");
	});
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

function d3Id(id, prefix=""){
	return prefix + id.replace(".", "-").replace(":", "_");
}