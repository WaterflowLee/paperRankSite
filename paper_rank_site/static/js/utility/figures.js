(function() {
  'use strict';

  var timeLineNodeModel = Backbone.Model.extend({
    defaults: {
        "_id":null,
        "avg_lv":null
    }
  });

  var timeLineNodeCollection = Backbone.Collection.extend({
    model: timeLineNodeModel,
    initialize: function (interval) {
        this.interval = interval;
        // used for reading/writing the whole collection
        this.url = "/api/time-line/" + interval + "/";
    },
    parse: function (data) {
        return data.time_line;
    }
  });

  var timeLineView = Backbone.View.extend({
    render: function (chart) {
        var series = [];
        this.collection.each(function (item) {
            series.push({
                0:item.attributes["_id"],
                1:item.attributes["avg_lv"]
            })
        });
        var data = [series];
        chart.data(data);
        chart.render();
        chart.renderLines();
        chart.renderDots();
        d3.selectAll("#time-line .dot").each(function (d) {
            $(this).popover({
                placement: "top",
                title: d[0],
                content: d[1],
                container: "body",
                trigger: "hover focus"
            });
        });
        // var dots = $(".dot");
        // dots.on('click', function () {
        //     dots.popover("hide");
        //     var self = this;
        //     setTimeout(function () {
        //         $(self).popover("show");
        //     }, 200);
        // });
        // dots.on('mouseleave', function () {
        //     $(this).popover("hide");
        // });
    }
  });

  var timeLines = {};
  var timeLinesView = Backbone.View.extend({
    // 本身它自己就不存在，因此this.$el.html(*)或者this.$el.append(*)之后立马进行$("#selector")并不能成功选中元素！
    // 它本身是在 initialize 函数退出之后才被加到DOM树中的，因此在 initialize 函数中进行元素选择是不可行的
      // 在下面我将jquery对象的构建以及装饰 与 添加到DOM树之中分开了
    el: "#time-line-view",
    chart: null,
    initialize: function(dict) {
        this.dict = dict;
        var self = this;
        var slider_interval = $("#time-line-interval-slider");
        slider_interval.slider({
		    value: 10,
		    min: 1,
		    max: 30,
		    slide: function(event, ui){
                self.renderOneTimeLine(ui.value);
                $("#time-line-interval").text(ui.value);
            }
	        });

        this.chart = new LineChart("time-line");
        this.chart.xScale(d3.scaleLinear().domain([1900, 2016]));
        this.chart.yScale(d3.scaleLinear().domain([1, 4.5]));
        this.chart.radius(5);
        this.renderOneTimeLine(slider_interval.slider("value"));
    },
    renderOneTimeLine: function (interval) {
        var self = this;
        var timeLine = this.dict[interval];
        if (timeLine){
            var curLineView = new timeLineView({collection: timeLine});
            curLineView.render(this.chart);
        }
        else{
            timeLine = new timeLineNodeCollection(interval);
            timeLine.fetch({success: function () {
                var curLineView = new timeLineView({collection: timeLine});
                self.dict[interval] = timeLine;
                curLineView.render(self.chart);
            }});
        }
    }
  });

   // new timeLinesView({dict:timeLines});
   new timeLinesView(timeLines);
    ///////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////
   var cdfModel = Backbone.Model.extend({
       defaults:{
           "_id": null,
           "cdf": null
       },
       idAttribute: "_id",
       inOrder: function () {
           return _.sortBy(this.attributes.cdf, "0");
       }
   });
   var cdfCollection = Backbone.Collection.extend({
       model: cdfModel,
       url: "/api/cdfs/",
       initialize:function () {
       },
       xMax: function (interval) {
           var model = this.get(interval);
           return _.max(model.attributes.cdf, function(node){ return node[0];})[0];
       }
   });
   var cdfView = Backbone.View.extend({
       el: "#cdf-view",
       chart: null,
       initialize: function () {
           var self = this;
           var slider_interval = $("#cdf-slider");
           slider_interval.slider({
                value: 10,
                min: 1,
                max: 30,
                slide: function(event, ui){
                    self.renderOneCdf(ui.value);
                }
	        });
            this.chart = new LineChart("cdf");
            this.chart.yScale(d3.scaleLinear().domain([0, 1]));
            this.chart.radius(5);
            this.collection.fetch({
                "success": function () {
                    self.renderOneCdf(slider_interval.slider("value"))
                }
            });
       },
       renderOneCdf: function (interval) {
           var xMax = this.collection.xMax(interval);
           this.chart.xScale(d3.scaleLinear().domain([1, xMax]));
           if(this.chart._axesG){
               this.chart._axesG.remove();
               this.chart.renderAxes();
           }
           var series = this.collection.get(interval).inOrder();
           var data = [series];
            this.chart.data(data);
            this.chart.render();
            this.chart.renderLines();
            this.chart.renderDots();
            d3.selectAll("#cdf .dot").each(function (d) {
                $(this).popover('destroy');
                $(this).popover({
                    placement: "top",
                    title: d[0],
                    content: d[1],
                    container: "#cdf",
                    trigger: "hover focus",
                    viewport: { selector: '#cdf', padding: 0 }
                });
            });
       }
   });
    var cdfCollectionObj = new cdfCollection();
    new cdfView({collection: cdfCollectionObj});
    ///////////////////////////////////////////////////////////
    ///////////////////////////////////////////////////////////
    var lossValueModel = Backbone.Model.extend({
       defaults:{
           "_id": null,
           "loss_value": null
       },
       idAttribute: "_id"
   });
    var lossValueCollection = Backbone.Collection.extend({
        model: lossValueModel,
        initialize: function (interval, percentage) {
            this.url = "/api/loss-value-function/" + interval + "/" + percentage + "/";
        }
    });
    var lossValueFunctionView = Backbone.View.extend({
        el: "#loss-value-function-view",
        chart: null,
        interval: 15,
        percentage: 10,
        collection: null,
        initialize: function () {
           var self = this;
           $(".internal").click(function () {
               self.interval = this.text();
           });
           var slider_percentage = $("#loss-value-percentage-slider");
           slider_percentage.slider({
                value: 10,
                min: 1,
                max: 20,
                slide: function(event, ui){
                    self.percentage = ui.value;
                }
	        });
           var render_command = $("#loss-value-percentage-render");
           render_command.click(function () {
               self.collection = new lossValueCollection(self.interval, self.percentage);
               // The server handler for fetch requests should return a JSON array of models.
               self.collection.fetch({"success": function (collection, response, options) {
                   self.render();
               }});
           });
            this.chart = new LineChart("loss-value-function");
            this.chart.yScale(d3.scaleLinear().domain([0, 500]));
            this.chart.xScale(d3.scaleLinear().domain([1, 30]));
            this.chart.radius(5);
            render_command.trigger("click");
       },
       render: function () {
            var data = [];
            this.collection.each(function (model) {
                var series  = _.map(model.attributes.loss_value, function(value, key){ return {0: +key, 1: +value}; });
                series = _.sortBy(series, "0");
                data.push(series);
            });
            this.chart.data(data);
            this.chart.render();
            this.chart.renderLines();
            this.chart.renderDots();
       }
    });
    // new lossValueFunctionView();
        ///////////////////////////////////////////////////////////
        ///////////////////////////////////////////////////////////
    var journalContributionsModel = Backbone.Model.extend({
        defaults:{
            contributions_meta: null,
            contributions: null
        },
        url: "/api/journal-contributions"
    });
    var journalContributionsView = Backbone.View.extend({
        el: "#journal-contributions-view",
        chart: null,
        stack: null,
        legend_template:  _.template("<li><div style='background-color: <%= color %>'></div>" +
            "<span><%= key %></span></li>"),
        initialize: function () {
            var self = this;
            $("#journal-contributions-slider").slider({
                min: 5,
                max: 9,
                value: 5,
                step: 1,
                // Triggered after the user slides a handle, if the value has changed;
                // or if the value is changed programmatically via the  value method.
                change: function (event, ui) {
                    var add = ui.value - 5;

                    $("#others").text(add);

                    var keys = self.model.attributes["contributions_meta"]["TOP5"]
                        .concat(self.model.attributes["contributions_meta"]["OthersInOrder"].slice(0, add));
                    keys.push("Others");

                    var legend = $("#journal-contributions-legend");
                    legend.html("");
                    var color = d3.scaleOrdinal(d3.schemeCategory10);
                    keys.forEach(function (key, index) {
                      legend.append(self.legend_template({
                          "color": color(index),
                          "key": key
                      }));
                    });

                    self.model.attributes["contributions"].forEach(function (contribution, index, array) {
                        var value = 0;
                        Object.keys(contribution).forEach(function (key) {
                            if (keys.indexOf(key) === -1){
                                value += contribution[key];
                            }
                        });
                        self.model.attributes["contributions"][index]["Others"] = value;
                    });
                    self.model.attributes["contributions_meta"]["keys"] = keys;
                    self.render();
                }
            });
        },
        renderAxes: function () {
            this.chart = new ExpandedAreaChart("journal-contributions", null);
            this.chart.xScale(d3.scaleLinear().domain([0, 30]));
            this.chart.yScale(d3.scaleLinear().domain([0, 1]));
            this.model.fetch({
                "success": function () {
                    $("#journal-contributions-slider").slider("value", 6);
                }
            });
        },
        render: function () {
            this.chart.stack(d3.stack().keys(this.model.attributes["contributions_meta"]["keys"]).offset(d3.stackOffsetExpand));
            this.chart.data(this.model.attributes["contributions"]);
            this.chart.render();
            this.chart.renderAreasLines();
            d3.selectAll(".area").on("mouseover", function (d) {
                console.log(d);
            });
        }
    });
    var model = new journalContributionsModel();
    // There are several special options that, if passed, will be attached directly
    // to the view: model, collection, el, id, className, tagName, attributes and events.
    // If the view defines an initialize function, it will be called when the view is first created.
    // If you'd like to create a view that references an element already in the DOM, pass in the element
    // as an option: new View({el: existingElement})
    var view = new journalContributionsView({"model": model});
    view.renderAxes();

    // jQuery.getJSON(url,data,success(data,status,xhr))
    // 该函数是简写的 Ajax 函数，等价于：
    // $.ajax({
    //   url: url,
    //   data: data,
    //   success: callback,
    //   dataType: json
    // });
    // Data that is sent to the server is appended to the URL as a query string.
    var formula = null;
    $.getJSON("/api/loss-value-function")
        .done(function (data) {
            $('select').removeAttr("disabled");
            formula = data;
        });
    $("select").change(function () {
        var interval = $("#interval-select option:selected").val();
        var percentage = $("#percentage-select option:selected").val().slice(0, -1);
        var image_src = "/static/imgs/loss_value_functions/lv_func_"+ interval + "_" + percentage +".png";
        $("#loss-value-function-img").attr("src", image_src);
        $("#loss-value-function-formula").text(formula[interval][percentage]);
    });

    var corrcoefSlider = $("#corrcoef-slider");
    var corrcoefData= null;
    corrcoefSlider.slider({
        min: 2,
        max: 30,
        stop: 1,
        value: 20,
        slide: function (event, ui) {
            var interval = ui.value;
            var image_src = "/static/imgs/corrcoef/bivariate_"+ interval + ".png";
            $("#corrcoef-img").attr("src", image_src);
            $("#corrcoef-interval").text(interval);
            $("#corrcoef").text(corrcoefData[interval]["corrcoef"]);
            $("#corrcoef-loss-value-threshold").text(corrcoefData[interval]["threshold"]);
            $("#corrcoef-two-tailed-p-value").text(corrcoefData[interval]["two_tailed_p_value"]);
        }
    });
    corrcoefSlider.slider("disable");
    $.getJSON("/api/corrcoef")
        .done(function (data) {
            corrcoefSlider.slider("enable");
            corrcoefData = data;
        });
})();
