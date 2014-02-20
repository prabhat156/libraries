
nv.models.heatmapChart = function() {
  "use strict";
  //============================================================
  // Public Variables with Default Settings
  //------------------------------------------------------------

  var heatmap = nv.models.heatmap()
    , xAxis = nv.models.axis()
    , yAxis = nv.models.axis()
    , legend = ["Low","High"]
    , controls = nv.models.legend().height(30)
    ;

  var margin = {top: 150, right: 20, bottom: 60, left: 120}
    , width = null
    , height = null
    , color = nv.utils.defaultColor()
    , showControls = false
    , showLegend = true
    , showXAxis = true
    , showYAxis = true
    , stacked = false
    , tooltips = true
    , tooltip = function(key, x, y, e, graph) {
        return '<h3>' + key + ' - ' + x + '</h3>' +
               '<p>' +  y + '</p>'
      }
    , x //can be accessed via chart.xScale()
    , y //can be accessed via chart.yScale()
    , state = { stacked: stacked }
    , defaultState = null
    , noData = 'No Data Available.'
    , dispatch = d3.dispatch('tooltipShow', 'tooltipHide', 'stateChange', 'changeState')
    , controlWidth = function() { return showControls ? 180 : 0 }
    , transitionDuration = 250
    , chartTitle = "Chart"
    , chartTitleStyle = "font-size:24px"
    , yAxisLabel = "y-Axis Label"
    , yAxisLabelStyle = "text-anchor:middle;font-size:18px"
    ;

  xAxis
    .orient('bottom')
    .rotateLabels(-90)
    //.tickPadding(5)
    //.highlightZero(false)
    //.showMaxMin(false)
    //.tickFormat(function(d) { return d })
    ;
  yAxis
    .orient('left')
    //.tickFormat(d3.format(',.1f'))
    ;

  controls.updateState(false);
  //============================================================


  //============================================================
  // Private Variables
  //------------------------------------------------------------

  var showTooltip = function(e, offsetElement) {
    var left = e.pos[0] + ( offsetElement.offsetLeft || 0 ),
        top = e.pos[1] + ( offsetElement.offsetTop || 0),
        x = xAxis.tickFormat()(multibar.x()(e.point, e.pointIndex)),
        y = yAxis.tickFormat()(multibar.y()(e.point, e.pointIndex)),
        content = tooltip(e.series.key, x, y, e, chart);

    nv.tooltip.show([left, top], content, e.value < 0 ? 'e' : 'w', null, offsetElement);
  };

  //============================================================


  function chart(selection) {
    selection.each(function(data) {

      var container = d3.select(this),
          that = this;

      var availableWidth = (width  || parseInt(container.style('width')) || 960)
                             - margin.left - margin.right,
          availableHeight = (height || parseInt(container.style('height')) || 640)
                             - margin.top - margin.bottom;

      chart.update = function() { container.transition().duration(transitionDuration).call(chart) };
      chart.container = this;

      //OLD////set state.disabled
      //OLD//state.disabled = data.map(function(d) { return !!d.disabled });

      //OLD//if (!defaultState) {
      //OLD//  var key;
      //OLD//  defaultState = {};
      //OLD//  for (key in state) {
      //OLD//    if (state[key] instanceof Array)
      //OLD//      defaultState[key] = state[key].slice(0);
      //OLD//    else
      //OLD//      defaultState[key] = state[key];
      //OLD//  }
      //OLD//}


      //------------------------------------------------------------
      // Display No Data message if there's nothing to show.

      //GOLD//if (!data || !data.length || !data.filter(function(d) { return d.values.length }).length) {
      if (!data) {
        var noDataText = container.selectAll('.nv-noData').data([noData]);

        noDataText.enter().append('text')
          .attr('class', 'nvd3 nv-noData')
          .attr('dy', '-.7em')
          .style('text-anchor', 'middle');

        noDataText
          .attr('x', margin.left + availableWidth / 2)
          .attr('y', margin.top + availableHeight / 2)
          .text(function(d) { return d });

        return chart;
      } else {
        container.selectAll('.nv-noData').remove();
      }

      //------------------------------------------------------------


      //===================================================================
      // Add Chart Title
      //===================================================================
      container.selectAll('text')
          .data([chartTitle])
          .enter()
          .append('text')
          .attr('x', margin.left + availableWidth/2)
          .attr('y', 30)
          .attr("text-anchor", "middle")
          .attr("style", chartTitleStyle)
          .text(function(d){return d});
      //===================================================================

      //------------------------------------------------------------
      // Setup Scales

      x = heatmap.xScale();
      y = heatmap.yScale();

      //------------------------------------------------------------


      //------------------------------------------------------------
      // Setup containers and skeleton of chart

      var wrap = container.selectAll('g.nv-wrap.nv-heatmapChart').data([data]);
      var gEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-heatmapChart').append('g');
      var defEnter = gEnter.append('defs');
      var g = wrap.select('g');

      gEnter.append('g').attr('class', 'nv-x nv-axis');
      gEnter.append('g').attr('class', 'nv-y nv-axis')
            .append('g').attr('class', 'nv-zeroLine')
            .append('line');
      gEnter.append('g').attr('class', 'nv-heatmapWrap');
      gEnter.append('g').attr('class', 'nv-legendWrap');
      //gEnter.append('g').attr('class', 'nv-controlsWrap');

      //------------------------------------------------------------


      //------------------------------------------------------------
      // Define gradient for legend
      var gradient = defEnter.append('linearGradient')
          .attr('id', "nv-legend-grad");
      //GOLD//gradient
      //GOLD//    .append("stop")
      //GOLD//    .attr("offset", "0")
      //GOLD//    .attr("stop-color", "#FFFF00")
      //GOLD//    .attr("stop-opacity", "0.05");
      //GOLD//gradient
      //GOLD//    .append("stop")
      //GOLD//    .attr("offset", "0.33")
      //GOLD//    .attr("stop-color", "#FFFF00")
      //GOLD//    .attr("stop-opacity", "1");
      //GOLD//gradient
      //GOLD//    .append("stop")
      //GOLD//    .attr("offset", "0.33")
      //GOLD//    .attr("stop-color", "#FDD017")
      //GOLD//    .attr("stop-opacity", "0.05");
      //GOLD//gradient
      //GOLD//    .append("stop")
      //GOLD//    .attr("offset", "0.67")
      //GOLD//    .attr("stop-color", "#FDD017")
      //GOLD//    .attr("stop-opacity", "1");
      //GOLD//gradient
      //GOLD//    .append("stop")
      //GOLD//    .attr("offset", "0.67")
      //GOLD//    .attr("stop-color", "#FF0000")
      //GOLD//    .attr("stop-opacity", "0.05");
      //GOLD//gradient
      //GOLD//    .append("stop")
      //GOLD//    .attr("offset", "1")
      //GOLD//    .attr("stop-color", "#FF0000")
      //GOLD//    .attr("stop-opacity", "1");
       
       var gradcolors = d3.range(2*heatmap.numClusters()).map(function(d,i){ return color(d,Math.floor(i/2))});
       gradient.selectAll("stop")
            .data(gradcolors)
        .enter()
            .append("stop")
            .attr("offset", function(d,i){
                return Math.floor((i+1)/2)*(1/heatmap.numClusters());
            })
            .attr("stop-color", function(d){return d})
            .attr("stop-opacity", function(d,i){
                //GOLD//if(i%2 == 0) return 0.15;
                //GOLD//else return 1;
                return 1; 
            });
      //------------------------------------------------------------

      //------------------------------------------------------------
      // Legend

      if (showLegend) {

        g.select('.nv-legendWrap')
            .attr("height", 100)
            .attr("width", 100)
            .attr("transform", "translate(0, " + (availableHeight)+")")
            ;

        // New Legend
        //var offset = availableWidth - (40*legend.length + 60*(legend.length-1));
        //offset = offset/2;
        g.select('.nv-legendWrap').selectAll('rect')
            .data(['AA'])
            .enter()
            .append("rect")
            .attr("x", function(d,i){return 28 })
            .attr("y", 20)
            .attr("width", 300)
            .attr("height", 20)
            .style("fill", "url(#nv-legend-grad)")
            ;
        g.select('.nv-legendWrap').selectAll("text")
                .data([' 0','10','20','30','40','50','60','70','80','90','100'])
            .enter()
                .append("text")
                //.attr("x", function(d,i){ return (i==0?0:300+5+28)})
                .attr("x", function(d,i){ return i==0?i*30+25:i*30+20})
                .attr("y", 50)
                .attr("dy", "0.32em")
                .attr('text-anchor', 'start')
                .text(function(d){ return d})
                ;

        //legend.width(availableWidth - controlWidth());

        //if (multibar.barColor())
        //  data.forEach(function(series,i) {
        //    series.color = d3.rgb('#ccc').darker(i * 1.5).toString();
        //  })

        //g.select('.nv-legendWrap')
        //    .datum(data)
        //    .call(legend);

        ////GOLD//if ( margin.top != legend.height()) {
        ////GOLD//  margin.top = legend.height();
        ////GOLD//  availableHeight = (height || parseInt(container.style('height')) || 400)
        ////GOLD//                     - margin.top - margin.bottom;
        ////GOLD//}

        //g.select('.nv-legendWrap')
        //    //GOLD//.attr('transform', 'translate(' + controlWidth() + ',' + (-margin.top) +')');
        //    .attr('transform', 'translate(' + controlWidth() + ',' + (-legend.height()) +')');
      }

      //------------------------------------------------------------


      //OLD////------------------------------------------------------------
      //OLD//// Controls

      //OLD//if (showControls) {
      //OLD//  var controlsData = [
      //OLD//    { key: 'Grouped', disabled: multibar.stacked() },
      //OLD//    { key: 'Stacked', disabled: !multibar.stacked() }
      //OLD//  ];

      //OLD//  controls.width(controlWidth()).color(['#444', '#444', '#444']);
      //OLD//  g.select('.nv-controlsWrap')
      //OLD//      .datum(controlsData)
      //OLD//      .attr('transform', 'translate(0,' + (-margin.top) +')')
      //OLD//      .call(controls);
      //OLD//}

      //OLD////------------------------------------------------------------


      wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');


      //------------------------------------------------------------
      // Main Chart Component(s)

      heatmap
        //.disabled(data.map(function(series) { return series.disabled }))
        .width(availableWidth)
        .height(availableHeight)
        .color(color)
        //OLD//.color(data.map(function(d,i) {
        //OLD//  return d.color || color(d, i);
        //OLD//}).filter(function(d,i) { return !data[i].disabled }))
        ;


      //OLD//var heatmapWrap = g.select('.nv-heatmapWrap')
      //OLD//    .datum(data.filter(function(d) { return !d.disabled }))
      var heatmapWrap = g.select('.nv-heatmapWrap')
          .datum(data)

      heatmapWrap.transition().call(heatmap);

      //console.log(x.domain());
      //------------------------------------------------------------


      //OLD-KEEP////------------------------------------------------------------
      //OLD-KEEP//// Setup Axes

      //OLD-KEEP//if (showXAxis) {
      //OLD-KEEP//    console.log('FFF: ' + heatmap.yScale().domain());
      //OLD-KEEP//    xAxis
      //OLD-KEEP//      .scale(x)
      //OLD-KEEP//      //.ticks( availableHeight / 24 )
      //OLD-KEEP//      //GOLD//.tickSize(-(multibar.showValues() ? (availableWidth-multibar.valuePadding()) : availableWidth), 0)
      //OLD-KEEP//      ;

      //OLD-KEEP//    g.select('.nv-x.nv-axis').transition()
      //OLD-KEEP//        .call(xAxis);

      //OLD-KEEP//    var xTicks = g.select('.nv-x.nv-axis').selectAll('g');

      //OLD-KEEP//    xTicks
      //OLD-KEEP//        .selectAll('line, text');

      //OLD-KEEP//}

      //OLD-KEEP//if (showYAxis) {
      //OLD-KEEP//    y.nice();
      //OLD-KEEP//    yAxis
      //OLD-KEEP//      .scale(y)
      //OLD-KEEP//      .ticks( availableWidth / 100 )
      //OLD-KEEP//      .axisLabel(yAxisLabel)
      //OLD-KEEP//      .axisLabelDistance(30)
      //OLD-KEEP//      .tickSize( -availableHeight, 0);

      //OLD-KEEP//    g.select('.nv-y.nv-axis')
      //OLD-KEEP//        .attr('transform', 'translate(0,' + availableHeight + ')');
      //OLD-KEEP//    g.select('.nv-y.nv-axis').transition()
      //OLD-KEEP//        .call(yAxis);

      //OLD-KEEP//    g.select('.nv-y.nv-axis').select('.nv-axis').select('.nv-axislabel')
      //OLD-KEEP//        .attr("style", yAxisLabelStyle)
      //OLD-KEEP//        // Reset the placement of the y-axis label
      //OLD-KEEP//        .attr('y', margin.bottom-10)
      //OLD-KEEP//        ;
      //OLD-KEEP//}

      //OLD-KEEP//// Zero line
      //OLD-KEEP//g.select(".nv-zeroLine line")
      //OLD-KEEP//  .attr("x1", y(0))
      //OLD-KEEP//  .attr("x2", y(0))
      //OLD-KEEP//  .attr("y1", 0)
      //OLD-KEEP//  .attr("y2", -availableHeight)
      //OLD-KEEP//  ;

      //OLD-KEEP////------------------------------------------------------------

      //OLD-KEEP////TEST for bar shift with axis label length
      //OLD-KEEP////TEST/multibar.margin({left: 200});
      //OLD-KEEP////TEST//barsWrap.transition().call(multibar);


      //OLD-KEEP////============================================================
      //OLD-KEEP//// Event Handling/Dispatching (in chart's scope)
      //OLD-KEEP////------------------------------------------------------------

      //OLD-KEEP//legend.dispatch.on('stateChange', function(newState) {
      //OLD-KEEP//  state = newState;
      //OLD-KEEP//  dispatch.stateChange(state);
      //OLD-KEEP//  chart.update();
      //OLD-KEEP//});

      //OLD-KEEP//controls.dispatch.on('legendClick', function(d,i) {
      //OLD-KEEP//  if (!d.disabled) return;
      //OLD-KEEP//  controlsData = controlsData.map(function(s) {
      //OLD-KEEP//    s.disabled = true;
      //OLD-KEEP//    return s;
      //OLD-KEEP//  });
      //OLD-KEEP//  d.disabled = false;

      //OLD-KEEP//  switch (d.key) {
      //OLD-KEEP//    case 'Grouped':
      //OLD-KEEP//      multibar.stacked(false);
      //OLD-KEEP//      break;
      //OLD-KEEP//    case 'Stacked':
      //OLD-KEEP//      multibar.stacked(true);
      //OLD-KEEP//      break;
      //OLD-KEEP//  }

      //OLD-KEEP//  state.stacked = multibar.stacked();
      //OLD-KEEP//  dispatch.stateChange(state);

      //OLD-KEEP//  chart.update();
      //OLD-KEEP//});

      //OLD-KEEP//dispatch.on('tooltipShow', function(e) {
      //OLD-KEEP//  if (tooltips) showTooltip(e, that.parentNode);
      //OLD-KEEP//});

      //OLD-KEEP//// Update chart from a state object passed to event handler
      //OLD-KEEP//dispatch.on('changeState', function(e) {

      //OLD-KEEP//  if (typeof e.disabled !== 'undefined') {
      //OLD-KEEP//    data.forEach(function(series,i) {
      //OLD-KEEP//      series.disabled = e.disabled[i];
      //OLD-KEEP//    });

      //OLD-KEEP//    state.disabled = e.disabled;
      //OLD-KEEP//  }

      //OLD-KEEP//  if (typeof e.stacked !== 'undefined') {
      //OLD-KEEP//    multibar.stacked(e.stacked);
      //OLD-KEEP//    state.stacked = e.stacked;
      //OLD-KEEP//  }

      //OLD-KEEP//  chart.update();
      //OLD-KEEP//});
      //OLD-KEEP////============================================================


    });

    return chart;
  }


  //============================================================
  // Event Handling/Dispatching (out of chart's scope)
  //------------------------------------------------------------

  //OLD//multibar.dispatch.on('elementMouseover.tooltip', function(e) {
  //OLD//  e.pos = [e.pos[0] +  margin.left, e.pos[1] + margin.top];
  //OLD//  dispatch.tooltipShow(e);
  //OLD//});

  //OLD//multibar.dispatch.on('elementMouseout.tooltip', function(e) {
  //OLD//  dispatch.tooltipHide(e);
  //OLD//});
  //OLD//dispatch.on('tooltipHide', function() {
  //OLD//  if (tooltips) nv.tooltip.cleanup();
  //OLD//});

  //============================================================


  //============================================================
  // Expose Public Variables
  //------------------------------------------------------------

  // expose chart's sub-components
  chart.dispatch = dispatch;
  chart.heatmap = heatmap;
  chart.legend = legend;
  chart.xAxis = xAxis;
  chart.yAxis = yAxis;

  d3.rebind(chart, heatmap, 'x', 'y', 'xDomain', 'yDomain', 'xRange', 'yRange', 'forceX', 'forceY', 'numClusters', 'zzDomain',
    'clipEdge', 'id', 'delay', 'showValues','showValuesSeries', 'showBarLabels', 'valueFormat', 'stacked', 'barColor');

  chart.options = nv.utils.optionsFunc.bind(chart);

  chart.margin = function(_) {
    if (!arguments.length) return margin;
    margin.top    = typeof _.top    != 'undefined' ? _.top    : margin.top;
    margin.right  = typeof _.right  != 'undefined' ? _.right  : margin.right;
    margin.bottom = typeof _.bottom != 'undefined' ? _.bottom : margin.bottom;
    margin.left   = typeof _.left   != 'undefined' ? _.left   : margin.left;
    return chart;
  };

  chart.chartTitle = function(_) {
    if (!arguments.length) return chartTitle;
    chartTitle = _;
    return chart;
  };

  chart.chartTitleStyle = function(_) {
    if (!arguments.length) return chartTitleStyle;
    chartTitleStyle = _;
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

  chart.color = function(_) {
    if (!arguments.length) return color;
    color = nv.utils.getColor(_);
    //legend.color(color);
    return chart;
  };

  chart.showControls = function(_) {
    if (!arguments.length) return showControls;
    showControls = _;
    return chart;
  };

  chart.legend = function(_) {
    if (!arguments.length) return legend;
    legend = _;
    return chart;
  };

  chart.showLegend = function(_) {
    if (!arguments.length) return showLegend;
    showLegend = _;
    return chart;
  };

  chart.showXAxis = function(_) {
    if (!arguments.length) return showXAxis;
    showXAxis = _;
    return chart;
  };

  chart.showYAxis = function(_) {
    if (!arguments.length) return showYAxis;
    showYAxis = _;
    return chart;
  };

  chart.yAxisLabel = function(_) {
    if (!arguments.length) return yAxisLabel;
    yAxisLabel = _;
    return chart;
  };

  chart.yAxisLabelStyle = function(_) {
    if (!arguments.length) return yAxisLabelStyle;
    yAxisLabelStyle = _;
    return chart;
  };

  chart.tooltip = function(_) {
    if (!arguments.length) return tooltip;
    tooltip = _;
    return chart;
  };

  chart.tooltips = function(_) {
    if (!arguments.length) return tooltips;
    tooltips = _;
    return chart;
  };

  chart.tooltipContent = function(_) {
    if (!arguments.length) return tooltip;
    tooltip = _;
    return chart;
  };

  chart.state = function(_) {
    if (!arguments.length) return state;
    state = _;
    return chart;
  };

  chart.defaultState = function(_) {
    if (!arguments.length) return defaultState;
    defaultState = _;
    return chart;
  };

  chart.noData = function(_) {
    if (!arguments.length) return noData;
    noData = _;
    return chart;
  };

  chart.transitionDuration = function(_) {
    if (!arguments.length) return transitionDuration;
    transitionDuration = _;
    return chart;
  };
  //============================================================


  return chart;
}
