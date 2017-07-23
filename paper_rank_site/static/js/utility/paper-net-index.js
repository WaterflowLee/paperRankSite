'use strict';
// 此处对象不在是一种建模方式，而是一种组织方式
// > db.papers.find({"name": {"$exists": 0}}).count()
// 26059
// > db.papers.find({"journal": {"$exists": 0}}).count()
// 26059
var paperNetView = {
	papers: null,
	sizeScale: d3.scalePow().exponent(0.5).range([5, 50]),
	netChart: paperNet().outerDivId("paper-net"),
	url: "/api/papers/",
	getPapers: function () {
		var self = this;
		var data = {};
		data["start"] = timeRangeStart.val();
		data["end"] = timeRangeEnd.val();
		var settings = {
			"method":"GET",
			"dataType":"json",
			"data":data
		};
		$("#hint").css("visibility", "visible").text("Waiting For Data...");

		// data
		// Type: PlainObject or String or Array
		// Data to be sent to the server. It is converted to a query string,
		// if not already a string.
		// It's appended to the url for GET-requests. ' +
		// 'See processData option to prevent this automatic processing. ' +
		// 'Object must be Key/Value pairs.
		// If value is an Array, jQuery serializes multiple values with same key based
		// on the value of the traditional setting.
		// method (default: 'GET')
		$.ajax(this.url, settings)
			.done(function(echo_data){
				self.papers = echo_data["docs"];
				self.sizeScale.domain([1, echo_data["max_loss_value"]]);
				// 在API reference中是method的直接在slider中调用并传入实参,
				// 不是method的而在API reference 中显示为options的需要调用option并传入选项名和值
				thresholdSlider.slider("option", "max", echo_data["max_loss_value"]);
				$("#max-loss-value").text(parseInt(echo_data["max_loss_value"]));
				$("#hint").text("Data is Ready");
				intervalSlider.slider("enable");
				thresholdSlider.slider("enable");
			})
			.fail(function(xhr, status){
			console.log("fail "+ xhr.status + " because " + status);
				// 是会检查状态码的，一看不是200，就到这里来了
				// GET http://localhost:5000/api/papers/?start=1960&end=1900 400 (BAD REQUEST)
				// fail 400 because error
			})
			.always(function(){
			console.log("request completed!");
			});
	},

	draw: function () {
		var interval = intervalSlider.slider("value");
		var filtered_papers = [];
		var self = this;
		this.papers.forEach(function(p){
			if(p["loss_value"][String(interval)] >= thresholdLower.val() && p["loss_value"][String(interval)] <= thresholdUpper.val()){
				var reference_normalized_weights = {};
				for (var key in p["reference_normalized_weights"]){
					if (p["reference_normalized_weights"].hasOwnProperty(key)){
						reference_normalized_weights[d3Id(key)] = p["reference_normalized_weights"][key];
					}
				}
				filtered_papers.push({
					"_id": d3Id(p["_id"]),
					"size": p["loss_value"][interval],
					"reference_normalized_weights": reference_normalized_weights,
					"normalized_journal": p["normalized_journal"]
				});
			}
		});
		var links = deriveLinks(filtered_papers);
		this.netChart.reset().sizeScale(this.sizeScale).buildNetwork(filtered_papers, links).drawNetwork();

		var selection = d3.select("#paper-net");
		selection.selectAll("circle.node").on("dblclick", function(d) {
			self.showInformation(inverseD3Id(d._id));
			miniPaperNetView.getPapers(inverseD3Id(d._id));
			selection.selectAll("circle").style("stroke", "#FFF");
			selection.select("#" + "c-" + d._id)
				.style("stroke", "#000");
		});
	},

	showInformation: function (id) {
		var settings = {
			"method": "GET",
			"dataType": "json"
			// 这样加的是 /?_id=id Query parameters
			// data: {
			// 	"_id": id
			// }
		};
		$.ajax(this.url + id, settings)
			.done(function(echo_data){
				$("#paper-id").text(id);
				$("#paper-name").text(echo_data["name"]?echo_data["name"].toLowerCase():"THIS PAPER HAS NO NAME!");
				$("#paper-journal").text(echo_data["journal"]?echo_data["journal"]:"THIS PAPER BELONGS TO NO JOURNAL!");
				$("#paper-eigen").text(echo_data["eigen"]);
				$("#paper-time").text(echo_data["time"]);
				var paperReferenceWeight = $("#paper-reference-weight");
				paperReferenceWeight.html("");
				paperReferenceWeight.append("<ul id='paper-reference-weight-list'></ul>");
				var reference_normalized_weights = echo_data["reference_normalized_weights"];
				for(var key in reference_normalized_weights){
					if(reference_normalized_weights.hasOwnProperty(key)){
						$("#paper-reference-weight-list").append(
							"<li>"+key+":"+parseFloat(reference_normalized_weights[key]).toFixed(2)+"</li>");
					}
				}
				var paperCitations = $("#paper-citations");
				paperCitations.html("");
				paperCitations.append("<ul id='citations-list'></ul>");
				for(var i=0;i<echo_data["citations"].length;i++){
					$("#citations-list").append("<li>"+ echo_data["citations"][i] +"</li>");
				}
				$("#paper-citation-reference").accordion("refresh");
				drawLossValueChart(echo_data["loss_value"], "paper-loss-value-chart");
			})
			.fail(function(xhr, status){
				console.log("fail "+ xhr.status + " because " + status);
			})
			.always(function(){
				console.log("request completed!");
			});
	}
};

var intervalSlider = $("#interval-slider");
var thresholdSlider = $("#threshold-slider");
var thresholdLower = $("#threshold-lower");
var thresholdUpper = $("#threshold-upper");

var timeRangeSlider = $("#time-range-slider");
var timeRangeStart = $("#time-range-start");
var timeRangeEnd = $("#time-range-end");


function initDynamicELementsAndEvents () {
	timeRangeSlider.slider({
		range: true,
		min: 1900,
		max: 2015,
		values: [1960, 1970],
		slide: function(event, ui) {
			timeRangeStart.val(ui.values[0]);
			timeRangeEnd.val(ui.values[1]);
		}
	});
	timeRangeStart.val(timeRangeSlider.slider("values", 0));
	timeRangeEnd.val(timeRangeSlider.slider("values", 1));
	timeRangeStart.change(function(){
		timeRangeSlider.slider("values", 0, timeRangeStart.val());
	});
	timeRangeEnd.change(function(){
		// values 是一个函数啊，后面传入的两个值是参数
		timeRangeSlider.slider("values", 1, timeRangeEnd.val());
	});

	var intervalInput = $("#interval");
	intervalSlider.slider({
		value: 10,
		min: 1,
		max: 30,
		change: function(event, ui){
			intervalInput.val(ui.value);
			paperNetView.draw();
		},
		disabled: true
	});
	intervalInput.val(intervalSlider.slider("value"));
	intervalInput.change(function(){
		// 这样并不会触发 slide 事件，但是会触发 change 事件
		intervalSlider.slider("value", intervalInput.val());
	});

	thresholdSlider.slider({
		range: true,
		min: 1,
		max: 30,
		values: [10,20],
		slide: function(event, ui){
			thresholdLower.val(ui.values[0]);
			thresholdUpper.val(ui.values[1]);
			paperNetView.draw();
		},
		disabled: true
	});
	thresholdLower.val(thresholdSlider.slider("values", 0));
	thresholdUpper.val(thresholdSlider.slider("values", 1));
	thresholdLower.change(function(){
		thresholdSlider.slider("values", 0, thresholdLower.val());
		paperNetView.draw();
	});
	thresholdUpper.change(function(){
		thresholdSlider.slider("values", 1, thresholdUpper.val());
		paperNetView.draw();
	});


	$("#paper-citation-reference").accordion({"heightStyle":"content"});

	$("#request").click(function () {
		paperNetView.getPapers();
    });
}
$(initDynamicELementsAndEvents);

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



function drawLossValueChart(lossValue, divId){
	$("#" + divId).html("");
	var series = [];
	var xMax = _.max(_.map(_.keys(lossValue), function(k){return parseInt(k);}));
	for (var i=1;i<=xMax;i++){
		series.push({"0":i, "1":lossValue[i]});
	}
	var yMax = _.max(series, function(n){ return n["1"]; })["1"];
	var chart = new LineChart(divId);
	chart.xScale(d3.scaleLinear().domain([1, series.length + 1]));
	chart.yScale(d3.scaleLinear().domain([0, yMax + 1]));


	chart.data([series]);
	chart.render();
	chart.renderLines();
	chart.renderDots();
}

var miniPaperNetView = {
	citations: null,
	root: null,
	netChart: paperNet().outerDivId("paper-net-mini"),
	sizeScale: d3.scalePow().exponent(0.5).range([5, 20]),
	url: "/api/mini-net/",
	getPapers: function (id) {
		var settings = {
			"dataType": "json",
			"method": "GET"
		};
		var self = this;
		$.ajax(this.url + id, settings)
			.done(function (echo_data) {
				self.sizeScale.domain([1, echo_data["max_loss_value"]]);
				self.citations = echo_data["citations"];
				self.root = echo_data["paper"];
				self.draw();
            })
			.fail(function(xhr, status){
				console.log("fail "+ xhr.status + " because " + status);
			})
			.always(function () {
				console.log("request completed!");
        	});
    },
	draw: function () {
		var interval = intervalSlider.slider("value");
		var time = this.root["time"];
		var filtered_papers = [];
		var papers = [this.root].concat(this.citations);
		papers.forEach(function (p, i) {
			var reference_normalized_weights = {};
			for (var key in p["reference_normalized_weights"]){
				if (p["reference_normalized_weights"].hasOwnProperty(key)){
					reference_normalized_weights[d3Id(key)] = p["reference_normalized_weights"][key];
				}
			}
			if (i>0) {
				var citation_interval = interval - (p["time"] - time);
				if (p["loss_value"][citation_interval]){
					filtered_papers.push({
						"_id": d3Id(p["_id"]),
						"size": p["loss_value"][citation_interval],
						"reference_normalized_weights": reference_normalized_weights,
						"normalized_journal": p["normalized_journal"]
					});
				}
            }
            if(i==0){
				filtered_papers.push({
                    "_id": d3Id(p["_id"]),
                    "size": p["loss_value"][interval],
                    "reference_normalized_weights": reference_normalized_weights,
                    "normalized_journal": p["normalized_journal"]
                });
			}
		});
		var links = deriveLinks(filtered_papers);
		this.netChart.reset().sizeScale(this.sizeScale).buildNetwork(filtered_papers, links).force
			.force("charge", d3.forceManyBody().strength(function(){return -50 * filtered_papers.length;}))
		this.netChart.drawNetwork();

		this.netChart.vis.append("g")
			.selectAll("text.loss-value")
			.data(this.netChart.force.nodes())
			.enter()
			.append("text")
			.classed("loss-value", true)
			.attr("x", 8)
    		.attr("y", ".31em")
    		.text(function(d) { return d.size.toFixed(2); });

		this.netChart.vis.append("g")
			.selectAll("text.reference-weights")
			.data(this.netChart.force.force("link").links())
			.enter()
			.append("text")
			.classed("reference-weights", true)
			.attr("x", 8)
    		.attr("y", ".31em")
    		.text(function(d) { return d.weight.toFixed(2); });

		var selection = d3.select("#paper-net-mini");
		// selection.selectAll("circle.node").on("dblclick", function(d) {
		// 	// self.showInformation(inverseD3Id(d._id));
		// 	// showPaperNetMini(inverseD3Id(d._id));
		// 	selection.selectAll("circle").style("stroke", "#FFF");
		// 	selection.select("#" + "c-" + d._id)
		// 		.style("stroke", "#000");
		// });
		selection.select("#c-" + d3Id(this.root["_id"]))
			.style("stroke", "#000")
			.style("opacity", 1);
	}
};

function d3Id(id){
	return id.replace(".", "-").replace(":", "_");
}
function inverseD3Id(id) {
	return id.replace("-", ".").replace("_", ":");
}