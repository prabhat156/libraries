
nv.models.logDiscreteBarPlusLineChartPan = function() {
  "use strict";
  //============================================================
  // Public Variables with Default Settings
  //------------------------------------------------------------

  var discretebar = nv.models.logDiscreteBar()
    , xAxis = nv.models.axis()
    , yAxis = nv.models.axis()
    , lines = nv.models.line()
    //, y2Axis = nv.models.axis().showMaxMin(false)
    , y2Axis = nv.models.axis()
    , zoom = d3.behavior.zoom()
    , legend = nv.models.legend()
    //WORKING//, interactiveLayer = nv.interactiveGuideline()
    ;

  //discretebar.xRange([0, 9000], .1);

  var margin = {top: 60, right: 10, bottom: 50, left: 60}
    , width = null
    , height = null
    , color = nv.utils.getColor()
    , showXAxis = true
    , showYAxis = true
    , showY2Axis = true
    , rightAlignYAxis = false
    , staggerLabels = false
    , tooltips = true
    , rotateLabels = 0
    , tooltip = function(key, x, y, y2, e, graph) {
        return '<h3>' + x + '</h3>' +
               '<p>' +  y + '</p>' +
               '<p>' +  y2 + '</p>'
      }
    , x
    , y
    , y2
    , noData = "No Data Available."
    , dispatch = d3.dispatch('tooltipShow', 'tooltipHide', 'beforeUpdate', 'zoom')
    , transitionDuration = 250
    , plotWidth = 4000
    , chartTitle = "Chart"
    , chartTitleStyle = "font-size:24px"
    , showLegend = true
    , current_tx = 0
    , xAxisLabel = "Label on x-axis"
    , yAxisLabel = "Label on y-axis"
    , y2AxisLabel = "Label on y2-axis"
    , xAxisLabelStyle = "font-size:18px"
    , yAxisLabelStyle = "text-anchor:middle;font-size:18px;"
    , y2AxisLabelStyle = "text-anchor:middle;font-size:18px"
    //WORKING//, useInteractiveGuideLine = true
    ;

  xAxis
    .orient('bottom')
    .highlightZero(false)
    .showMaxMin(false)
    .tickFormat(function(d) { return d })
    ;
  yAxis
    .orient((rightAlignYAxis) ? 'right' : 'left')
    // This is for log-axis
    .tickFormat(
            function(d){
                var d_n;
                if (d < 1) {
                    var factor = Math.pow(10, 1-Math.ceil(log10(d)));
                    d_n = d3.format('f')(d*factor);
                    if((d_n-1)%9 == 0){
                        return d3.format('s')(d_n/factor);
                    } else {
                        return '';
                    }
                } else {
                    //return d3.format('.2f')(d);
                    d_n = d3.format('f')(d);
                    if((d_n-1)%9 == 0){
                        return d3.format('s')(d_n);
                    } else {
                        return '';
                    }
                }
            })
    ;

  lines
    .clipEdge(false)
    .padData(true)
    //.scatter.forceY([0])    //This to make sure that y2Axis start from 0
    //.scatter.xRange([0,9000])
    ;

  y2Axis
    .orient('right')
    .tickFormat(d3.format(',.1f'))
    ;

  //============================================================

  //============================================================
  // Private Variables
  //------------------------------------------------------------

  var showTooltip = function(e, offsetElement, linePoints) {
    // Get the current translation position
    var t = zoom.translate(),
        tx = t[0],
        ty = t[1];
    
    // Translation
    tx = Math.min(tx, 0);

    // This makes sure that the e.value comparison is not based on a fixed value but depending on the domain()
    var yTickArray = yAxis.scale().ticks();
    var threshold = yTickArray[Math.floor(yTickArray.length/3)];

    //GOLD//var left = e.pos[0] + ( offsetElement.offsetLeft || 0 ),
    var left = e.pos[0] + ( offsetElement.offsetLeft || 0 ) + tx,
        top = e.pos[1] + ( offsetElement.offsetTop || 0),
        x = xAxis.tickFormat()(discretebar.x()(e.point, e.pointIndex)),
        //y = yAxis.tickFormat()(discretebar.y()(e.point, e.pointIndex)),
        y = d3.format('.2f')(discretebar.y()(e.point, e.pointIndex)),
       
        // Display the value of the lines
        y2 = y2Axis.tickFormat()(lines.y()(linePoints[0].values).value),
        content = tooltip(e.series.key, x, y, y2, e, chart);

    //GOLD//nv.tooltip.show([left, top], content, e.value < 0 ? 'n' : 's', null, offsetElement);
    nv.tooltip.show([left, top], content, e.value > threshold ? 'n' : 's', null, offsetElement);
  };

  //============================================================
  
  
  //============================================================
  // Private Variables
  //------------------------------------------------------------
  var log10 = function(val){
      return Math.log(val)/Math.LN10;
  }
  //============================================================


  function chart(selection) {
    selection.each(function(data) {
      var container = d3.select(this),
          that = this;

      var availableWidth = (width  || parseInt(container.style('width')) || 960)
                             - margin.left - margin.right,
          availableHeight = (height || parseInt(container.style('height')) || 400)
                             - margin.top - margin.bottom;

        // PK : Code Added
        //var plotWidth = 4000;
        discretebar.xRange([0, plotWidth], .1);
        var tempPadding = lines.scatter.padDataOuter();
        lines.scatter.xRange([(plotWidth * tempPadding +  plotWidth) / (2 *data[0].values.length), plotWidth - plotWidth * (1 + tempPadding) / (2 * data[0].values.length)  ]);
        //console.log('AW: ' + availableWidth + ' AH: ' + availableHeight);
        // PK : Coded added end
  
      chart.update = function() { 
        dispatch.beforeUpdate(); 
        container.transition().duration(transitionDuration).call(chart); 
      };
      chart.container = this;

      //------------------------------------------------------------
      // Display No Data message if there's nothing to show.

      if (!data || !data.length || !data.filter(function(d) { return d.values.length }).length) {
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
          .attr('x', availableWidth/2)
          .attr('y', 30)
          .attr("text-anchor", "middle")
          .attr("style", chartTitleStyle)
          .text(function(d){return d});
      //===================================================================


      //------------------------------------------------------------
      // Setup Scales

      var dataBars = data.filter(function(d){ return !d.disabled && d.bar});
      var dataLines = data.filter(function(d){ return !d.disabled && !d.bar});

      x = discretebar.xScale();
      y = discretebar.yScale()
          .clamp(true)
          ;

      //y2 = discretebar.yScale().clamp(true);
      y2 = lines.yScale();

      //------------------------------------------------------------


      //------------------------------------------------------------
      // Setup containers and skeleton of chart

      var wrap = container.selectAll('g.nv-wrap.nv-discreteBarWithAxes').data([data]);
      var gEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-discreteBarWithAxes').append('g');
      var defsEnter = gEnter.append('defs');
      var g = wrap.select('g');

      gEnter.append('g').attr('class', 'nv-x nv-axis');
      gEnter.append('g').attr('class', 'nv-y nv-axis')
            .append('g').attr('class', 'nv-zeroLine')
            .append('line');
        
      gEnter.append('g').attr('class', 'nv-barsWrap');
      gEnter.append('g').attr('class', 'nv-y2 nv-axis');
      gEnter.append('g').attr('class', 'nv-linesWrap');
      //WORKING//gEnter.append('g').attr('class', 'nv-interactive');
      // LEGEND
      gEnter.append('g').attr('class', 'nv-legendWrap');
      
      g.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      if (rightAlignYAxis) {
          g.select(".nv-y.nv-axis")
              .attr("transform", "translate(" + availableWidth + ",0)");
      }

      //------------------------------------------------------------

      //------------------------------------------------------------
      // Legend
      if(showLegend){
          legend
            .width(availableWidth)
            .color(color)
            .updateState(false) //TODO Keep this false until you figure out how to manage the axis on state-change
            ;

          g.select('.nv-legendWrap')
            .datum(data)
            .call(legend)
            ;

          g.select('.nv-legendWrap')
            .attr('transform', 'translate(0, ' + (-legend.height()) + ')')
            ;

            //if( margin.top != legend.height()){
            //    margin.top = legend.height();
            //    //availableHeight1
            //}

      }

      //WORKING//// enable the interactive layer
      //WORKING//if(useInteractiveGuideLine){
      //WORKING//    interactiveLayer
      //WORKING//          .width(XXX)
      //WORKING//          .height(XXX)
      //WORKING//          .margin(XXX)
      //WORKING//          .svgContainer(XXX)
      //WORKING//          .xScale(XXX);

      //WORKING//    g.select().call(interactiveLayer);

      //WORKING//}
      //------------------------------------------------------------
      // Main Chart Component(s)

      discretebar
        .width(availableWidth)
        .height(availableHeight)
        .color(
            data
                .map(function(d,i){
                    return d.color || color(d,i);
                })
                .filter(function(d,i){
                    return !data[i].disabled && data[i].bar;
                })
            )
        ;

      lines
        .width(availableWidth)
        .height(availableHeight)
        .color(
            data
                .map(function(d,i){
                    return d.color || color(d,i);
                })
                .filter(function(d,i){
                    return !data[i].disabled && !data[i].bar;
                })
            )
        ;

      var barsWrap = g.select('.nv-barsWrap')
          .datum(dataBars.filter(function(d) { return !d.disabled }))

      var linesWrap = g.select('.nv-linesWrap')
          .datum(dataLines.map(function(d){
              return {
                  key : d.key,
                  values : d.values.map(function(d,i){return {x:i, y:d.value}}) 
              }
          }).filter(function(d) { 
              return !d.disabled 
          }))

      barsWrap.transition().call(discretebar);
      // Create the lines
      linesWrap.transition()
          .delay(150)
          .call(lines);

      //------------------------------------------------------------

      defsEnter.append('clipPath')
          .attr('id', 'nv-x-label-clip-' + discretebar.id())
        .append('rect');

      g.select('#nv-x-label-clip-' + discretebar.id() + ' rect')
          .attr('width', x.rangeBand() * (staggerLabels ? 2 : 1))
          .attr('height', 16)
          .attr('x', -x.rangeBand() / (staggerLabels ? 1 : 2 ));
     
      // Define the clip path for the bars 
      defsEnter.append('clipPath')
          .attr('id', 'nv-bar-clip-rect')
        .append('rect')
          .attr('width', availableWidth)
          .attr('height', availableHeight)
          .attr('x', '0')
          .attr('y', '0');
      
      //// Define the clip path for the lines
      //defsEnter.append('clipPath')
      //    .attr('id', 'nv-line-clip-rect')
      //  .append('rect')
      //    .attr('width', availableWidth)
      //    .attr('height', availableHeight)
      //    .attr('x', '0')
      //    .attr('y', '0');

      defsEnter.append('clipPath')
          .attr('id', 'new-x-clip-rect')
        .append('rect')
          .attr('width', availableWidth)
          .attr('height', availableHeight+margin.bottom)
          .attr('x', '0')
          .attr('y', '0');
      
      // Attach the clip path for the bars
      barsWrap.attr("clip-path", "url(#nv-bar-clip-rect)");
      // Attach the clip path for the lines
      linesWrap.attr("clip-path", "url(#nv-bar-clip-rect)");

      //------------------------------------------------------------
      // Setup Axes

      if (showXAxis) {
          xAxis
            .scale(x)
            //.scale(d3.scale.linear())
            .ticks( availableWidth / 100 )
            //.tickFormat(function(d){return 'T-'+d})
            .tickSize(-availableHeight, 0)
            .axisLabel(xAxisLabel)
            .rotateLabels(-90)
            ;


          g.select('.nv-x.nv-axis')
              .attr("clip-path", "url(#new-x-clip-rect)")
              ;
          //d3.transition(g.select('.nv-x.nv-axis'))
          g.select('.nv-x.nv-axis').transition()
              .call(xAxis);
         
          // This is required for clipping to work for the axis 
          g.select('.nv-x.nv-axis').select('.nv-axis')
              .attr('transform', 'translate(0,' + (y.range()[0] + ((discretebar.showValues() && y.domain()[0] < 0) ? 16 : 0)) + ')')
              ;

          var xTicks = g.select('.nv-x.nv-axis').selectAll('g');

          // Reset the position of xAxis labels to make sure they fit in the visible portion of that chart
          // The '300' is there because in axis.js there is a line xLabelMargin-300. To offset '-300' I '+300'
          var yLabelPos = g.select('.nv-x.nv-axis').select('.nv-axis').select('.nv-axislabel').attr('y');
          yLabelPos = parseInt(yLabelPos)+300;
          g.select('.nv-x.nv-axis').select('.nv-axis').select('.nv-axislabel')
                .attr('x', availableWidth/2)
                .attr('y', yLabelPos)
                //.style("font-size", "18px")
                .attr("style", xAxisLabelStyle)
                ;

          if (staggerLabels) {
            xTicks
                .selectAll('text')
                .attr('transform', function(d,i,j) { return 'translate(0,' + (j % 2 == 0 ? '5' : '17') + ')' })
          }

          //GOLD//// Try to rotate the axis labels
          //GOLD//if(rotateLabels){
          //GOLD//    xTicks
          //GOLD//          .selectAll('text')
          //GOLD//          .attr('transform', 'rotate(' + rotateLabels +')')
          //GOLD//          .style('text-anchor', rotateLabels > 0 ? 'start' : 'end')
          //GOLD//          ;
          //GOLD//}

      }

      if (showYAxis) {
          y.nice();
          yAxis
            .scale(y)
            .ticks( availableHeight / 36 )
            .axisLabel(yAxisLabel)
            .axisLabelDistance(40)
            .tickSize( -availableWidth, 0);

          g.select('.nv-y.nv-axis').transition()
              .call(yAxis);

          //======================================================================
          // Set the font size for the Primay y-axis
          //======================================================================
          g.select('.nv-y.nv-axis').select('.nv-axis').select('.nv-axislabel')
                //.style("font-size", "18px")
                .attr("style", yAxisLabelStyle)
                ;
          //======================================================================
      }

      if (showY2Axis) {
          y2.nice();
          y2Axis
            .scale(y2)
            .ticks( availableHeight / 36 )
            .axisLabel(y2AxisLabel)
            .axisLabelDistance(30)
            ;

          g.select('.nv-y2.nv-axis')
              .attr('transform', 'translate(' + availableWidth + ',0)');
          g.select('.nv-y2.nv-axis').transition()
              .call(y2Axis);
          //======================================================================
          // Set the font size for the Secondary y-axis
          //======================================================================
          g.select('.nv-y2.nv-axis').select('.nv-axis').select('.nv-axislabel')
                //.style("font-size", "18px")
                .attr("style", y2AxisLabelStyle)
                ;
          //======================================================================

      }

      // Zero line
      g.select(".nv-zeroLine line")
        .attr("x1",0)
        .attr("x2",availableWidth)
        .attr("y1", y(0))
        .attr("y2", y(0))
        // Paints the x-axis line 'BLACK'
        .attr('style', 'stroke:rgb(0,0,0);stroke-width:2')
        ;

      //------------------------------------------------------------


      //============================================================
      // Panning feature in the chart (without Zoom)
      //============================================================
      zoom
          .scaleExtent([1,1])
          .on("zoom", zoomResponse);
      
      // TODO Make sure that you can mouseclick only on the chart area and not outside it. Currently you can do outside too and drag
      var gZoom = d3.select(this.parentNode)
                   .call(zoom);

      //TESTING////GOLD//// THIS WAS THE GOLD IMPLEMENATION
      //TESTING////GOLD//var gZoom = g.select('.nv-barsWrap')
      //TESTING////GOLD//             .call(zoom);
     
      //TESTING//console.log(this.parentNode);

      //TESTING//// THIS IS JUST A TEST
      //TESTING////var gZoom = container.select('g.nvd3.nv-wrap.nv-discreteBarWithAxes')
      //TESTING////var gZoom = d3.select("#chart1 svg").select('g.nvd3.nv-wrap.nv-discreteBarWithAxes')
      //TESTING//var gZoom = d3.select(this.parentNode)
      //TESTING//             .call(zoom);
      //TESTING////WORKING//var gZoom = d3.select('#chart1')
      //TESTING////WORKING//              .call(zoom);

      //============================================================

      //============================================================
      // Event Handling/Dispatching (in chart's scope)
      //------------------------------------------------------------

      dispatch.on('tooltipShow', function(e, flag) {
          var linePoints = dataLines.map(function(d){
                        return {
                            key : d.key,
                            values : {x: e.pointIndex, y: d.values[e.pointIndex]}
                            }
                        });

        if (tooltips) showTooltip(e, that.parentNode, linePoints);
      });

      //WORKING//// Adding the interactive layer here
      //WORKING//interactiveLayer.dispatch.on('elementMouseover', function(e){
      //WORKING//    var singlePoint, pointIndex, pointXLocation, allData = [];

      //WORKING//    // Bars data
      //WORKING//    dataBars
      //WORKING//      .filter(function())
      //WORKING//      .forEach();
      //WORKING//    // Line data
      //WORKING//});

      //TEST//dispatch.on('tooltipShow', function(e, flag) {

      //TEST//    if(flag) {
      //TEST//      var linePoints = dataLines.map(function(d){
      //TEST//                    return {
      //TEST//                        key : d.key,
      //TEST//                        values : {x: e.pointIndex, y: d.values[e.pointIndex]}
      //TEST//                        }
      //TEST//                    });
      //TEST//    } else {
      //TEST//      var dataPoints = dataBars.map(function(d){
      //TEST//                    return {
      //TEST//                        key : d.key,
      //TEST//                        values : {x: e.pointIndex, y: d.values[e.pointIndex]}
      //TEST//                        }
      //TEST//                    });
      //TEST//    }


      //TEST//    //console.log('DDDD: ' + JSON.stringify(e));
      //TEST//    console.log('FLAGLLL : ' + flag);
      //TEST//    var linePoints = dataLines.map(function(d){
      //TEST//                  return {
      //TEST//                      key : d.key,
      //TEST//                      values : {x: e.pointIndex, y: d.values[e.pointIndex]}
      //TEST//                      }
      //TEST//                  });

      //TEST//  if (tooltips) showTooltip(e, that.parentNode, linePoints);
      //TEST//});

      //TODO//legend.dispatch.on('stateChange', function(newState){
      //TODO//    chart.update();
      //TODO//});
      //============================================================

      //============================================================
      // Functions
     
      // Function to respond to 'zoom' event 
      function zoomResponse(){
          // Avoid translation towards the left of the initial point
          var t = zoom.translate(),
              tx = t[0],
              ty = t[1];

          // Translation
          tx = Math.min(tx, 0);
          tx = Math.max(tx, availableWidth-plotWidth);
          zoom.translate([tx, ty]);

          // Translate the x-axis
          g.select('.nv-x.nv-axis').select('.nv-axis')
              .attr('transform', 'translate(' + tx + ',' + (y.range()[0] + ((discretebar.showValues() && y.domain()[0] < 0) ? 16 : 0)) + ')')
              ;
          
          // Translate the x-axis Label so that it pinned to the position, Notice the reference should be fixed and not variable
          g.select('.nv-x.nv-axis').select('.nv-axis').select('.nv-axislabel')
              .attr('x', availableWidth/2-tx)
              ;
         
          // Translate the bar charts 
          barsWrap.select('.nv-discretebar')
              .attr("transform", "translate(" + tx + ",0)");

          // Translate the line charts
          linesWrap.select('.nv-line')
              .attr("transform", "translate(" + tx + ",0)");
      }
      //============================================================

    });

    return chart;
  }

  //============================================================
  // Event Handling/Dispatching (out of chart's scope)
  //------------------------------------------------------------

  discretebar.dispatch.on('elementMouseover.tooltip', function(e) {
    e.pos = [e.pos[0] +  margin.left, e.pos[1] + margin.top];
    dispatch.tooltipShow(e, false);
  });

  // TODO Enable this later
  //lines.dispatch.on('elementMouseover.tooltip', function(e) {
  //  e.pos = [e.pos[0] +  margin.left, e.pos[1] + margin.top];
  //  dispatch.tooltipShow(e, true);
  //});

  discretebar.dispatch.on('elementMouseout.tooltip', function(e) {
    dispatch.tooltipHide(e, false);
  });
 
  // TODO Enable this later 
  //lines.dispatch.on('elementMouseout.tooltip', function(e) {
  //  dispatch.tooltipHide(e, true);
  //});

  dispatch.on('tooltipHide', function() {
    if (tooltips) nv.tooltip.cleanup();
  });

  //============================================================


  //============================================================
  // Expose Public Variables
  //------------------------------------------------------------

  // expose chart's sub-components
  chart.dispatch = dispatch;
  chart.discretebar = discretebar;
  chart.xAxis = xAxis;
  chart.yAxis = yAxis;
  chart.lines = lines;
  chart.y2Axis = y2Axis;
  chart.legend = legend;

  d3.rebind(chart, discretebar, lines, 'x', 'y', 'xDomain', 'yDomain', 'xRange', 'yRange', 'forceX', 'forceY', 'id', 'showValues', 'valueFormat');

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
    //discretebar.color(color);
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

  chart.showY2Axis = function(_) {
    if (!arguments.length) return showY2Axis;
    showY2Axis = _;
    return chart;
  };

  chart.xAxisLabel = function(_) {
    if (!arguments.length) return xAxisLabel;
    xAxisLabel = _;
    return chart;
  };

  chart.yAxisLabel = function(_) {
    if (!arguments.length) return yAxisLabel;
    yAxisLabel = _;
    return chart;
  };

  chart.y2AxisLabel = function(_) {
    if (!arguments.length) return y2AxisLabel;
    y2AxisLabel = _;
    return chart;
  };

  chart.xAxisLabelStyle = function(_) {
    if (!arguments.length) return xAxisLabelStyle;
    xAxisLabelStyle = _;
    return chart;
  };

  chart.yAxisLabelStyle = function(_) {
    if (!arguments.length) return yAxisLabelStyle;
    yAxisLabelStyle = _;
    return chart;
  };

  chart.y2AxisLabelStyle = function(_) {
    if (!arguments.length) return y2AxisLabelStyle;
    y2AxisLabelStyle = _;
    return chart;
  };

  chart.rightAlignYAxis = function(_) {
    if(!arguments.length) return rightAlignYAxis;
    rightAlignYAxis = _;
    yAxis.orient( (_) ? 'right' : 'left');
    return chart;
  };

  chart.staggerLabels = function(_) {
    if (!arguments.length) return staggerLabels;
    staggerLabels = _;
    return chart;
  };

  chart.rotateLabels = function(_) {
    if (!arguments.length) return rotateLabels;
    rotateLabels = _;
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

  chart.plotWidth = function(_) {
    if (!arguments.length) return plotWidth;
    plotWidth = _;
    return chart;
  };

  //============================================================


  return chart;
}
