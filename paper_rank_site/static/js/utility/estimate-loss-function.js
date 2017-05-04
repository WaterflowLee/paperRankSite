// 逐步去掉对 underscore 的依赖
$.getJSON("/data/estimate_loss_function.15.20.json", function (echoData) {
    var nodes = [];
    // slice() 方法返回一个从开始到结束（不包括结束）的数组的一部分浅拷贝到一个新数组对象
    $.map(echoData.slice(0, 100), function (paper, index) {
        // for (var key in Object.keys(paper["loss_value"])){
        for (var key in paper["loss_value"]){
            if (paper["loss_value"].hasOwnProperty(key)){
                var node = [parseInt(key), paper["loss_value"][key], 10, 10];
                nodes.push(node);
            }
        }
    });
    var max_y = nodes.reduce(function (n1, n2) {
        return n1[1]>n2[1]?n1:n2;
    })[1];
    var chart = scatterChart()
        .outerDivId("graphHolder")
        .xScale(d3.scaleLinear().domain([0, 31]))
        .yScale(d3.scaleLinear().domain([0, max_y]))
        .sizeScale(d3.scaleLinear().domain([0,10]).range([0, 2]));
    chart.data(nodes).render();
});