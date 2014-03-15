
nv.models.discreteBarPlusLineChartPan = function() {
  "use strict";
  //============================================================
  // Public Variables with Default Settings
  //------------------------------------------------------------

  var discretebar = nv.models.discreteBar(),
      xAxis = nv.models.axis(),
      xAxisTicks = nv.models.axis(),
      yAxis = nv.models.axis(),
      lines = nv.models.line(),
      //y2Axis = nv.models.axis().showMaxMin(false),
      y2Axis = nv.models.axis(),
      zoom = d3.behavior.zoom(),
      legend = nv.models.legend(),
      interactiveLayer = nv.interactiveGuideline()
    ;

  var margin = {top: 60, right: 10, bottom: 60, left: 60},
      width = null,
      height = null,
      color = nv.utils.getColor(),
      showXAxis = true,
      showYAxis = true,
      showY2Axis = true,
      rightAlignYAxis = false,
      staggerLabels = false,
      tooltips = true,
      rotateLabels = 0,
      tooltip = function(key, x, y, y2, e, graph) {
        return '<h3>' + x + '</h3>' +
               '<p>' +  y + '</p>' +
               '<p>' +  y2 + '</p>'
      },
      x,
      y,
      y2,
      noData = "No Data Available.",
      dispatch = d3.dispatch('tooltipShow', 'tooltipHide', 'beforeUpdate', 'zoom'),
      transitionDuration = 250,
      plotWidth = 4000,
      chartTitle = "Chart",
      chartTitleStyle = "font-size:24px",
      showLegend = true,
      current_tx = 0,
      xAxisLabel = "Label on x-axis",
      yAxisLabel = "Label on y-axis",
      y2AxisLabel = "Label on y2-axis",
      xAxisLabelStyle = "font-size:18px",
      yAxisLabelStyle = "text-anchor:middle;font-size:18px;",
      y2AxisLabelStyle = "text-anchor:middle;font-size:18px",
      //TODO: Currentl wouldnt work without dataLines,
      useInteractiveGuideLine = false,
      zoomXTranslate=0,
      barWidthThreshold = 30,
      tick_scale = d3.scale.linear(),
      displayXImageLabel = false
    ;

  xAxis
    .tickPadding(10)
    .orient('bottom')
    .highlightZero(false)
    .showMaxMin(false)
    .tickFormat(function(d) { return d })
    ;
  xAxisTicks
    .orient('bottom')
    .highlightZero(false)
    .showMaxMin(false)
    .tickFormat(function(d) { return '' })
    ;
  yAxis
    .tickPadding(10)
    .orient((rightAlignYAxis) ? 'right' : 'left')
    // This is to make sure lots of '0's are not visible
    .tickFormat( function(d){ return d3.format('s')(d); })
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

  // This is now handled by interactive layer, the this function is not required now
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

      //===================================================================
      // Add Chart Title
      //===================================================================
      container.selectAll('text')
          .data([chartTitle])
          .enter()
          .append('text')
          .attr('class', 'nvd3 nv-charttitle')
          .attr('x', availableWidth/2)
          .attr('y', 30)
          .attr("text-anchor", "middle")
          .text(function(d){return d});
      //===================================================================


      //------------------------------------------------------------
      // Setup Scales

      // Insert a series index to pick the correct color.
      data.forEach(function(series, i){
          series.seriesIndex = i
      });
      var dataBars = data.filter(function(d){ return !d.disabled && d.bar});
      var dataLines = data.filter(function(d){ return !d.disabled && !d.bar});

      //------------------------------------------------------------
      // Setting up the correct scale
      // Also make sure whether Panning is required or not
      plotWidth = availableWidth;
      var barWidth = (1-0.1)*plotWidth/(data[0].values.length+0.1);
      if(barWidth < barWidthThreshold){
          plotWidth = (data[0].values.length+0.1)*barWidthThreshold/(1-0.1);
          plotWidth = Math.round(plotWidth);
          console.log('Inside id');
      }

      // TODO: You cant pass this way, xRange in discreteBar will take only the first value, i.e., the array and not .2 or .1
      discretebar
          .xRange([0, plotWidth])
          .padding(0.2, 0.1);
      if(dataLines.length){
        //OLD//var tempPadding = lines.scatter.padDataOuter();
        //OLD//lines.scatter.xRange([(plotWidth * tempPadding +  plotWidth) / (2 *data[0].values.length), plotWidth - plotWidth * (1 + tempPadding) / (2 * data[0].values.length)  ]);
        // IMP: FORMULA : 
        // x1 = PlotWidth * (2*outerPadding+1-innerPadding)/(2*(length - innerPadding + 2*outerPadding))
        // x2 = PlotWidth - x1
        // The below comes when outerPadding = innerPadding/2
        lines.scatter.xRange([(plotWidth) / (2 *data[0].values.length), plotWidth - plotWidth/(2 * data[0].values.length)  ]);
      }
      //------------------------------------------------------------

      x = discretebar.xScale();
      y = discretebar.yScale()
          .clamp(true)
          ;
      // Define only if line is present
      if(dataLines.length){
        y2 = lines.yScale();
      }

      //------------------------------------------------------------


      //------------------------------------------------------------
      // Setup containers and skeleton of chart

      var wrap = container.selectAll('g.nv-wrap.nv-discreteBarWithAxes').data([data]);
      var gEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-discreteBarWithAxes').append('g');
      var defsEnter = gEnter.append('defs');
      var g = wrap.select('g');

      gEnter.append('g').attr('class', 'nv-x nv-axis');
      gEnter.append('g').attr('class', 'nv-x-ticks nv-axis');
      gEnter.append('g').attr('class', 'nv-y nv-axis')
            .append('g').attr('class', 'nv-zeroLine')
            .append('line');
        
      gEnter.append('g').attr('class', 'nv-barsWrap');
      gEnter.append('g').attr('class', 'nv-y2 nv-axis');
      gEnter.append('g').attr('class', 'nv-linesWrap');
      gEnter.append('g').attr('class', 'nv-interactive');
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

      // enable the interactive layer
      if(useInteractiveGuideLine){
          interactiveLayer
                .width(availableWidth)
                .height(availableHeight)
                .margin({left:margin.left, top:margin.top})
                .svgContainer(container)
                //.xScale(x);
                .xScale(lines.xScale());

          g.select('.nv-interactive').call(interactiveLayer);

      }
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

      if(dataLines.length){
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
      }

      var barsWrap = g.select('.nv-barsWrap')
          .datum(dataBars.filter(function(d) { return !d.disabled }))
      barsWrap.transition().call(discretebar);

      var linesWrap;
      if(dataLines.length){
        linesWrap = g.select('.nv-linesWrap')
            .datum(dataLines.map(function(d){
                return {
                    key : d.key,
                    values : d.values.map(function(d,i){return {x:i, y:d.value}}) 
                }
            }).filter(function(d) { 
                return !d.disabled 
            }))
        // Create the lines
        linesWrap.transition()
            .delay(150)
            .call(lines);
      }

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
      
      defsEnter.append('clipPath')
          .attr('id', 'new-x-clip-rect')
        .append('rect')
          .attr('width', availableWidth)
          .attr('height', availableHeight+margin.bottom)
          .attr('x', '0')
          .attr('y', '0');
      
      // Attach the clip path for the bars
      barsWrap.attr("clip-path", "url(#nv-bar-clip-rect)");

      if(dataLines.length){
        // Attach the clip path for the lines
        linesWrap.attr("clip-path", "url(#nv-bar-clip-rect)");
      }

      //------------------------------------------------------------
      // Setup Axes

      if (showXAxis) {
          xAxis
            .scale(x)
            .ticks( availableWidth / 100 )
            .tickSize(0)
            .axisLabelDistance(50)
            .axisLabel(xAxisLabel)
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

          //// Reset the position of xAxis labels to make sure they fit in the visible portion of that chart
          //// The '300' is there because in axis.js there is a line xLabelMargin-300. To offset '-300' I '+300'
          //var yLabelPos = g.select('.nv-x.nv-axis').select('.nv-axis').select('.nv-axislabel').attr('y');
          //yLabelPos = parseInt(yLabelPos)+300;
          //g.select('.nv-x.nv-axis').select('.nv-axis').select('.nv-axislabel')
          //      .attr('x', availableWidth/2)
          //      .attr('y', yLabelPos)
          //      //.style("font-size", "18px")
          //      //.attr("style", xAxisLabelStyle)
          //      ;

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

          // PK:  Display the ticks seperately
          var numTicks = dataBars[0].values.length;
          tick_scale.domain([0, numTicks]);
          //tick_scale.range([0, availableWidth]);
          tick_scale.range([0, plotWidth]);
          xAxisTicks
            .scale(tick_scale)
            .tickValues( tick_scale.ticks(numTicks).slice(1,-1))
            .tickSize(7)
            ;

          g.select('.nv-x-ticks.nv-axis')
              .attr("clip-path", "url(#new-x-clip-rect)")
              ;
          g.select('.nv-x-ticks.nv-axis').transition()
              .call(xAxisTicks);
          g.select('.nv-x-ticks.nv-axis').select('.nv-axis')
              .attr('transform', 'translate(0,' + (y.range()[0] + ((discretebar.showValues() && y.domain()[0] < 0) ? 16 : 0)) + ')')
              ;

        // Adding image to the x-axis label, Currently deleting the text
        if(displayXImageLabel){
            // Remove the text label
            g.select('.nv-x.nv-axis').selectAll('.tick.major').selectAll('text').remove();
            // Add the image label
            g.select('.nv-x.nv-axis').selectAll('.tick.major').selectAll('image')
                  .data(function(d, i){
                      return [ dataBars[0].values[i].image ];
                  })
                  .enter()
                  .append('svg:image')
                  .attr("xlink:href", function(d){ return d; })
                  .attr("width", 80)
                  .attr("height", 60)
                  .attr("x", "-40");
                  ;
        }
      }

      if (showYAxis) {
          // y.nice() here will have issues. I noticed that in timelinecharts
          //y.nice();
          yAxis
            .scale(y)
            .ticks( availableHeight / 36 )
            .axisLabel(yAxisLabel)
            .axisLabelDistance(20)
            .tickSize( -availableWidth, 0);

          g.select('.nv-y.nv-axis').transition()
              .call(yAxis);

          //CSS////======================================================================
          //CSS//// Set the font size for the Primay y-axis
          //CSS////======================================================================
          //CSS//g.select('.nv-y.nv-axis').select('.nv-axis').select('.nv-axislabel')
          //CSS//      //.style("font-size", "18px")
          //CSS//      .attr("style", yAxisLabelStyle)
          //CSS//      ;
          //CSS////======================================================================
      }

      if (dataLines.length && showY2Axis) {
          //y2.nice();
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
          //CSS////======================================================================
          //CSS//// Set the font size for the Secondary y-axis
          //CSS////======================================================================
          //CSS//g.select('.nv-y2.nv-axis').select('.nv-axis').select('.nv-axislabel')
          //CSS//      //.style("font-size", "18px")
          //CSS//      .attr("style", y2AxisLabelStyle)
          //CSS//      ;
          //CSS////======================================================================

      }

      // Zero line
      g.select(".nv-zeroLine line")
        .attr("x1",0)
        .attr("x2",availableWidth)
        .attr("y1", y(0))
        .attr("y2", y(0))
        // Paints the x-axis line 'BLACK'
        //CSS//.attr('style', 'stroke:rgb(0,0,0);stroke-width:2')
        ;

      //------------------------------------------------------------

      //============================================================
      // Panning feature in the chart (without Zoom)
      //============================================================
      zoom
          // Disable 'zoom' feature, just use the 'pan' feature
          .scaleExtent([1,1])
          .on("zoom", zoomResponse);
      
      // TODO Make sure that you can mouseclick only on the chart area and not outside it. Currently you can do outside too and drag
      var gZoom = d3.select(this.parentNode)
                   .call(zoom);

      //TESTING////GOLD//// THIS WAS THE GOLD IMPLEMENATION
      //TESTING////GOLD//var gZoom = g.select('.nv-barsWrap')
      //TESTING////GOLD//             .call(zoom);
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

      // Add an interactive layer to display y-values for both the 'bar' and 'line'
      interactiveLayer.dispatch.on('elementMousemove', function(e){
          var singlePoint, pointIndex, pointXLocation, allData = [];

          // Compensate for the Panning feature of the chart
          var tx = zoom.translate()[0];
          tx = Math.min(tx, 0);
          // 'lines' range doesnt start with 0, so the following line will compensate for that offset
          var lines_os = lines.scatter.xRange()[0];
          tx += lines_os;

          // Line data
          dataLines
            .filter(function(series, i){
                return !series.disabled
            })
            .map(function(series, i){
                return {
                    key: series.key,
                    seriesIndex: series.seriesIndex,
                    values: series.values.map(function(d,i){ return {x:i, y:d.value} })
                }
            })
            .forEach(function(series, i){
                pointIndex = nv.interactiveBisect(series.values, e.pointXValue-lines.xScale().invert(tx), lines.x());

                var point = series.values[pointIndex];

                if(typeof point === 'undefined') return;
                if(typeof singlePoint === 'undefined') singlePoint = point;
                if(typeof pointXLocation == 'undefined') pointXLocation = lines.xScale()(lines.x()(point, pointIndex));

                var tooltipValue = lines.y()(point, pointIndex);
                allData.push({
                    key: series.key,
                    value: y2Axis.tickFormat()(tooltipValue),
                    color: color(series, series.seriesIndex)
                });
            });

          // Bars data, This is kind-of dependent on the above call
          dataBars
            .filter(function(series, i){
                return !series.disabled
            })
            .forEach(function(series, i){
                // if the point was 'undefined' the function would have returned above. It wont even reach here
                var point = series.values[pointIndex];
                singlePoint = point;

                var tooltipValue = discretebar.y()(point, pointIndex);
                allData.push({
                    key: series.key,
                    value: d3.format('f')(tooltipValue),
                    color: color(series, series.seriesIndex)
                });
            });
         
          var xValue = discretebar.x()(singlePoint, pointIndex);
          //DONT NEED THIS//var valueFormatter = function(d, i){ return y2Axis.tickFormat()(d)};

          // Reverse the order of 'allData' to make sure bars are displayed first
          allData.reverse();
          interactiveLayer.tooltip
              .position({left: (pointXLocation+tx-lines_os)+margin.left, top:e.mouseY+margin.top})
              .chartContainer(that.parentNode)
              .enabled(tooltips)
              //DONT NEET THIS//.valueFormatter(valueFormatter)
              .data({
                  value: xValue,
                  series: allData
              })();

          interactiveLayer.renderGuideLine(pointXLocation+tx-lines_os);
      });

      interactiveLayer.dispatch.on("elementMouseout", function(e){
          dispatch.tooltipHide();
      });

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

          if(dataLines.length){
            // Translate the line charts
            linesWrap.select('.nv-line')
                .attr("transform", "translate(" + tx + ",0)");
          }
      }
      //============================================================

    });

    return chart;
  }

  //============================================================
  // Event Handling/Dispatching (out of chart's scope)
  //------------------------------------------------------------

  //NEW CODE ABOVE//discretebar.dispatch.on('elementMouseover.tooltip', function(e) {
  //NEW CODE ABOVE//  e.pos = [e.pos[0] +  margin.left, e.pos[1] + margin.top];
  //NEW CODE ABOVE//  dispatch.tooltipShow(e, false);
  //NEW CODE ABOVE//});

  //NEW CODE ABOVE//// TODO Enable this later
  //NEW CODE ABOVE////lines.dispatch.on('elementMouseover.tooltip', function(e) {
  //NEW CODE ABOVE////  e.pos = [e.pos[0] +  margin.left, e.pos[1] + margin.top];
  //NEW CODE ABOVE////  dispatch.tooltipShow(e, true);
  //NEW CODE ABOVE////});

  //NEW CODE ABOVE//discretebar.dispatch.on('elementMouseout.tooltip', function(e) {
  //NEW CODE ABOVE//  dispatch.tooltipHide(e, false);
  //NEW CODE ABOVE//});
 
  //NEW CODE ABOVE//// TODO Enable this later 
  //NEW CODE ABOVE////lines.dispatch.on('elementMouseout.tooltip', function(e) {
  //NEW CODE ABOVE////  dispatch.tooltipHide(e, true);
  //NEW CODE ABOVE////});

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

  d3.rebind(chart, discretebar, 'x', 'y', 'xDomain', 'yDomain', 'xRange', 'yRange', 'forceX', 'forceY', 'id', 'showValues', 'valueFormat');

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

  chart.displayXImageLabel = function(_) {
    if (!arguments.length) return displayXImageLabel;
    displayXImageLabel = _;
    return chart;
  };

  chart.barWidthThreshold = function(_) {
    if (!arguments.length) return barWidthThreshold;
    barWidthThreshold = _;
    return chart;
  };

  //============================================================


  return chart;
}
