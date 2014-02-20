
nv.models.heatmap = function() {
  "use strict";
  //============================================================
  // Public Variables with Default Settings
  //------------------------------------------------------------

  var margin = {top: 0, right: 0, bottom: 0, left: 0}
    , width = 720
    , height = 480
    , id = Math.floor(Math.random() * 10000) //Create semi-unique ID in case user doesn't select one
    , x = d3.scale.ordinal()
    , y = d3.scale.ordinal()
    //, z = d3.scale.linear().domain([0,4]).clamp(true)
    , z
    , zz = d3.scale.quantize()
    , c = d3.scale.category10().domain(d3.range(10))
    , getX = function(d) { return d.x }
    , getY = function(d) { return d.y }
    , getZ = function(d) { return d.z }
    , forceZ = [0] // 0 is forced by default.. this makes sense for the majority of bar graphs... user can always do chart.forceY([]) to remove
    , color = nv.utils.defaultColor()
    , showValues = false
    , valuePadding = 60
    , valueFormat = d3.format(',.2f')
    , delay = 1200
    , xDomain
    , yDomain
    , zzDomain
    , xRange
    , yRange
    , numClusters = 3
    , dispatch = d3.dispatch('chartClick', 'elementClick', 'elementDblClick', 'elementMouseover', 'elementMouseout')
    // This would determine how the values in the cells would be displayed
    ;

  //============================================================


  //============================================================
  // Private Variables
  //------------------------------------------------------------

  var x0, y0 //used to store previous scales
      ;

  //============================================================


  function chart(selection) {
    selection.each(function(data) {

      // PK you might need to modify the data based on how the chart is built
      //var node_names = data.nodes.map(function(d){ return d.name});

      // DATA MODIFICATION based on the example
      var matrix = [],
          nodes = data.nodes,
          nn = nodes.length;

      nodes.forEach(function(node,i){
         node.index = i;
         matrix[i] = d3.range(nn).map(function(j){ return {x:j, y:i, z:0}; });
      });

      data.links.forEach(function(link){
          //GOLD//matrix[link.source][link.target].z = link.value;
          // The following line is just for testing...
          matrix[link.source][link.target].z = 100*Math.random();
      });
      // END DATA MODIFICATION based on the example

      var availableWidth = width - margin.left - margin.right,
          availableHeight = height - margin.top - margin.bottom,
          container = d3.select(this);

      // TODO PK Check this, you have to set the scales correctly, but we can skip for now
      //------------------------------------------------------------
      // Setup Scales

      //GOLD//x   .domain(xDomain || data.nodes.map(function(d){return d.name}))
      x   .domain(xDomain || d3.range(nodes.length))
          .rangeBands(xRange || [0, availableWidth]);

      //GOLD//y   .domain(yDomain || data.nodes.map(function(d){return d.name}))
      y   .domain(yDomain || d3.range(nodes.length))
          .rangeBands(yRange || [0, availableHeight]);

      // New domain and range, quantized to specify the cluster
      zz   .domain(zzDomain || d3.extent(data.links.map(function(d){return d.value}).concat(forceZ)))
           .range(d3.range(numClusters));

      // Setup an array of 'z' domains
      z = d3.range(numClusters).map(function(){ return d3.scale.linear()});
      z.forEach(function(scale, i){
          scale.domain(zz.invertExtent(i))
                .range([0.15,1])
                .clamp(true);
      });

      //console.log(JSON.stringify(nodes));
      //console.log(x.domain());

      x0 = x0 || x;
      //y0 = y0 || d3.scale.linear().domain(y.domain()).range([y(0),y(0)]);
      y0 = y0 || y;
      //------------------------------------------------------------

      //------------------------------------------------------------
      // Setup containers and skeleton of chart

      var wrap = d3.select(this).selectAll('g.nv-wrap.nv-heatmap').data([data]);
      var wrapEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-heatmap');
      var defsEnter = wrapEnter.append('defs');
      var gEnter = wrapEnter.append('g');
      var g = wrap.select('g');

      //GOLD//gEnter.append('g').attr('class', 'nv-rows-cols');

      wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      //------------------------------------------------------------

      // PK START
      gEnter.append("rect")
        .attr("class", "background")
        .attr("style", "fill:#eee")
        .attr("width", availableWidth)
        .attr("height", availableHeight);

      var row = gEnter.selectAll(".row")
                    .data(matrix)
                .enter().append("g")
                    .attr("class", "row")
                    .attr("transform", function(d,i){ return "translate(0," + y(i) + ")";})
                    .each(row)
                    ;

      row.append("line")
            .attr("style", "stroke:#fff")
            .attr("x2", availableWidth);

      row.append("text")
            .attr("x", -6)
            .attr("y", y.rangeBand()/2)
            .attr("dy", ".32em")
            .attr("text-anchor", "end")
            .text(function(d,i){ return nodes[i].name; });


      var column = gEnter.selectAll(".column")
                        .data(matrix)
                    .enter().append("g")
                        .attr("class", "column")
                        .attr("transform",function(d,i){ return "translate(" + x(i) + ")rotate(-90)"; })

      column.append("line")
            .attr("style", "stroke:#fff")
            .attr("x1", -availableHeight);

      column.append("text")
                .attr("x", 6)
                .attr("y", x.rangeBand()/2)
                .attr("dy", ".32em")
                .attr("text-anchor", "start")
                .text(function(d,i){ return nodes[i].name; });

      function row(row){
          var cell = d3.select(this).selectAll(".cell")
                            .data(row.filter(function(d){ return d.z; }))
                        .enter().append("g");
           
          // Add color to each cell 
          cell 
            .append("rect")
                .attr("class", "cell")
                .attr("x", function(d){ return x(d.x); })
                .attr("width", x.rangeBand())
                .attr("height", y.rangeBand())
                .style("fill-opacity", function(d){ return z[zz(d.z)](d.z); })
                .style("fill", function(d){ return color(d,zz(d.z))})
                .on("mouseover", mouseover)
                .on("mouseout", mouseout)
                ;
         
          // Add text to each cell 
          cell 
            .append("text")
                //.attr("class", "cell")
                .attr("x", function(d){ return x.rangeBand()/2+x(d.x); })
                .attr("y", y.rangeBand()/2)
                .attr("dy", ".32em")
                .attr("text-anchor", "middle")
                .text(function(d){ return valueFormat(getZ(d))})
                ;

      }

      function mouseover(p){
          gEnter.selectAll(".row text").classed("active", function(d,i){ return i == p.y});
          gEnter.selectAll(".row text").classed("active", function(d,i){ return i == p.x});
      }

      function mouseout(){
          gEnter.selectAll("text").classed("active", false);
      }
      // PK END


    //OLD//  // PK Create groups here
    //OLD//  var groups = wrap.select('.nv-groups').selectAll('.nv-group')
    //OLD//      .data(function(d) { return d }, function(d,i) { return i });
    //OLD//  groups.enter().append('g')
    //OLD//      .style('stroke-opacity', 1e-6)
    //OLD//      .style('fill-opacity', 1e-6);
    //OLD//  groups.exit().transition()
    //OLD//      .style('stroke-opacity', 1e-6)
    //OLD//      .style('fill-opacity', 1e-6)
    //OLD//      .remove();
    //OLD//  groups
    //OLD//      .attr('class', function(d,i) { return 'nv-group nv-series-' + i })
    //OLD//      .classed('hover', function(d) { return d.hover })
    //OLD//      .style('fill', function(d,i){ return color(d, i) })
    //OLD//      .style('stroke', function(d,i){ return color(d, i) });
    //OLD//  groups.transition()
    //OLD//      .style('stroke-opacity', 1)
    //OLD//      .style('fill-opacity', .75);


    //OLD//  // PK Create bars here, I guess for each group
    //OLD//  var bars = groups.selectAll('g.nv-bar')
    //OLD//      .data(function(d) { return d.values });

    //OLD//  bars.exit().remove();

    //OLD//  var barsEnter = bars.enter().append('g')
    //OLD//      .attr('transform', function(d,i,j) {
    //OLD//          return 'translate(' + y0(d.y0) + ',' + ((d.sID * x.rangeBand() / stacks.length ) + d.sID*3 + x(getX(d,i))) + ')'
    //OLD//      });

    //OLD//  barsEnter.append('rect')
    //OLD//      .attr('width', 0)
    //OLD//      .attr('height', x.rangeBand() / (stacks.length) )

    //OLD//  bars
    //OLD//      .on('mouseover', function(d,i) { //TODO: figure out why j works above, but not here
    //OLD//        d3.select(this).classed('hover', true);
    //OLD//        dispatch.elementMouseover({
    //OLD//          value: getY(d,i),
    //OLD//          point: d,
    //OLD//          series: data[d.series],
    //OLD//          //GOLD//pos: [ y(getY(d,i) + (stacked ? d.y0 : 0)), x(getX(d,i)) + (x.rangeBand() * (stacked ? data.length / 2 : d.series + .5) / data.length) ],
    //OLD//          pos: [ y(getY(d,i) + d.y0), x(getX(d,i)) + d.sID*3 + (x.rangeBand() * (d.sID+0.5) / stacks.length) ],
    //OLD//          pointIndex: i,
    //OLD//          seriesIndex: d.series,
    //OLD//          e: d3.event
    //OLD//        });
    //OLD//      })
    //OLD//      .on('mouseout', function(d,i) {
    //OLD//        d3.select(this).classed('hover', false);
    //OLD//        dispatch.elementMouseout({
    //OLD//          value: getY(d,i),
    //OLD//          point: d,
    //OLD//          series: data[d.series],
    //OLD//          pointIndex: i,
    //OLD//          seriesIndex: d.series,
    //OLD//          e: d3.event
    //OLD//        });
    //OLD//      })
    //OLD//      .on('click', function(d,i) {
    //OLD//        dispatch.elementClick({
    //OLD//          value: getY(d,i),
    //OLD//          point: d,
    //OLD//          series: data[d.series],
    //OLD//          //GOLD//pos: [x(getX(d,i)) + (x.rangeBand() * (stacked ? data.length / 2 : d.series + .5) / data.length), y(getY(d,i) + (stacked ? d.y0 : 0))],  // TODO: Figure out why the value appears to be shifted
    //OLD//          pos: [x(getX(d,i)) + d.sID*3 + (x.rangeBand() * (d.sID + .5) / stacks.length), y(getY(d,i) + d.y0)],  // TODO: Figure out why the value appears to be shifted
    //OLD//          pointIndex: i,
    //OLD//          seriesIndex: d.series,
    //OLD//          e: d3.event
    //OLD//        });
    //OLD//        d3.event.stopPropagation();
    //OLD//      })
    //OLD//      .on('dblclick', function(d,i) {
    //OLD//        dispatch.elementDblClick({
    //OLD//          value: getY(d,i),
    //OLD//          point: d,
    //OLD//          series: data[d.series],
    //OLD//          //GOLD//pos: [x(getX(d,i)) + (x.rangeBand() * (stacked ? data.length / 2 : d.series + .5) / data.length), y(getY(d,i) + (stacked ? d.y0 : 0))],  // TODO: Figure out why the value appears to be shifted
    //OLD//          pos: [x(getX(d,i)) + d.sID*3 + (x.rangeBand() * (d.sID + .5) / stacks.length), y(getY(d,i) + d.y0)],  // TODO: Figure out why the value appears to be shifted
    //OLD//          pointIndex: i,
    //OLD//          seriesIndex: d.series,
    //OLD//          e: d3.event
    //OLD//        });
    //OLD//        d3.event.stopPropagation();
    //OLD//      });


    //OLD//  barsEnter.append('text');

    //OLD//  if (showValues) {
    //OLD//    // Check if you want to enable or disable the 'text' value
    //OLD//    data.forEach(function(series){
    //OLD//        //console.log('JJ:: ' + series.enabletext);
    //OLD//        if(typeof series.enabletext == 'undefined') {
    //OLD//            series.enabletext = false;
    //OLD//        }

    //OLD//        series.values.forEach(function(point){ 
    //OLD//            point.enabletext = series.enabletext;
    //OLD//        });
    //OLD//    });

    //OLD//    // Show values for all the bars by default
    //OLD//    if(!showValuesSeries) showValuesSeries = d3.range(data.length);
    //OLD//    bars.select('text')
    //OLD//        .attr('text-anchor', function(d,i) { return getY(d,i) < 0 ? 'end' : 'start' })
    //OLD//        .attr('y', x.rangeBand() / (data.length * 2))
    //OLD//        .attr('dy', '.46em')
    //OLD//        //GOLD//.text(function(d,i) { return valueFormat(getY(d,i)) })
    //OLD//        .text(function(d,i) {
    //OLD//            if (d.enabletext)
    //OLD//                return valueFormat(getY(d,i))
    //OLD//            else
    //OLD//                return '' })
    //OLD//    bars.transition()
    //OLD//      .select('text')
    //OLD//        .attr('x', function(d,i) { return getY(d,i) < 0 ? -4 : y(getY(d,i)) - y(0) + 4 })
    //OLD//  } else {
    //OLD//    bars.selectAll('text').text('');
    //OLD//  }

    //OLD//  bars
    //OLD//      .attr('class', function(d,i) { return getY(d,i) < 0 ? 'nv-bar negative' : 'nv-bar positive'})

    //OLD//  if (barColor) {
    //OLD//    if (!disabled) disabled = data.map(function() { return true });
    //OLD//    bars
    //OLD//      .style('fill', function(d,i,j) { return d3.rgb(barColor(d,i)).darker(  disabled.map(function(d,i) { return i }).filter(function(d,i){ return !disabled[i]  })[j]   ).toString(); })
    //OLD//      .style('stroke', function(d,i,j) { return d3.rgb(barColor(d,i)).darker(  disabled.map(function(d,i) { return i }).filter(function(d,i){ return !disabled[i]  })[j]   ).toString(); });
    //OLD//  }

    //OLD//  // Create Stacked and Grouped Bars
    //OLD//  bars.transition()
    //OLD//      .attr('transform', function(d,i,j) {
    //OLD//        //TODO: stacked must be all positive or all negative, not both?
    //OLD//        return 'translate(' +
    //OLD//        (y(d.y0) + d.localID*1)
    //OLD//        + ',' +
    //OLD//        (d.sID * x.rangeBand() / stacks.length
    //OLD//        +
    //OLD//        d.sID*3
    //OLD//        +
    //OLD//        x(getX(d,i)) )
    //OLD//        + ')'
    //OLD//      })
    //OLD//    .select('rect')
    //OLD//      .attr('height', x.rangeBand() / stacks.length )
    //OLD//      .attr('width', function(d,i) {
    //OLD//        return Math.max(Math.abs(y(getY(d,i)) - y(0)),1)
    //OLD//      });


    //store old scales for use in transitions on update
    x0 = x.copy();
    y0 = y.copy();

    });

    return chart;
  }


  //============================================================
  // Expose Public Variables
  //------------------------------------------------------------

  chart.dispatch = dispatch;

  chart.options = nv.utils.optionsFunc.bind(chart);

  chart.x = function(_) {
    if (!arguments.length) return getX;
    getX = _;
    return chart;
  };

  chart.y = function(_) {
    if (!arguments.length) return getY;
    getY = _;
    return chart;
  };

  chart.margin = function(_) {
    if (!arguments.length) return margin;
    margin.top    = typeof _.top    != 'undefined' ? _.top    : margin.top;
    margin.right  = typeof _.right  != 'undefined' ? _.right  : margin.right;
    margin.bottom = typeof _.bottom != 'undefined' ? _.bottom : margin.bottom;
    margin.left   = typeof _.left   != 'undefined' ? _.left   : margin.left;
    return chart;
  };

  chart.width = function(_) {
    if (!arguments.length) return width;
    width = _;
    return chart;
  };

  chart.height = function(_) {
    if (!arguments.length) return height;
    height = _;
    return chart;
  };

  chart.xScale = function(_) {
    if (!arguments.length) return x;
    x = _;
    return chart;
  };

  chart.yScale = function(_) {
    if (!arguments.length) return y;
    y = _;
    return chart;
  };

  chart.xDomain = function(_) {
    if (!arguments.length) return xDomain;
    xDomain = _;
    return chart;
  };

  chart.yDomain = function(_) {
    if (!arguments.length) return yDomain;
    yDomain = _;
    return chart;
  };

  chart.zzDomain = function(_) {
    if (!arguments.length) return zzDomain;
    zzDomain = _;
    return chart;
  };

  chart.xRange = function(_) {
    if (!arguments.length) return xRange;
    xRange = _;
    return chart;
  };

  chart.yRange = function(_) {
    if (!arguments.length) return yRange;
    yRange = _;
    return chart;
  };

  chart.forceY = function(_) {
    if (!arguments.length) return forceY;
    forceY = _;
    return chart;
  };

  chart.color = function(_) {
    if (!arguments.length) return color;
    color = nv.utils.getColor(_);
    return chart;
  };

  chart.id = function(_) {
    if (!arguments.length) return id;
    id = _;
    return chart;
  };

  chart.delay = function(_) {
    if (!arguments.length) return delay;
    delay = _;
    return chart;
  };

  chart.showValues = function(_) {
    if (!arguments.length) return showValues;
    showValues = _;
    return chart;
  };

  chart.numClusters = function(_) {
    if (!arguments.length) return numClusters;
    numClusters = _;
    return chart;
  };

  chart.valueFormat= function(_) {
    if (!arguments.length) return valueFormat;
    valueFormat = _;
    return chart;
  };

  chart.valuePadding = function(_) {
    if (!arguments.length) return valuePadding;
    valuePadding = _;
    return chart;
  };

  //============================================================


  return chart;
}
