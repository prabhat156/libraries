nv.models.timelineAndSentimentChart = function() {
  "use strict";
  //============================================================
  // Public Variables with Default Settings
  //------------------------------------------------------------

  var lines = nv.models.line()
    , lines2 = nv.models.line()
    , lines3 = nv.models.line()
    , xAxis = nv.models.axis()
    , yAxis = nv.models.axis()
    , x2Axis = nv.models.axis()
    , y2Axis = nv.models.axis()
    , x3Axis = nv.models.axis()
    , y3Axis = nv.models.axis()
    , legend = nv.models.legend()
    , controls = nv.models.legend()
    , brush = d3.svg.brush()
    , interactiveLayer = nv.interactiveGuideline()
    ;

  var margin = {top: 60, right: 30, bottom: 20, left: 80}
    , margin2 = {top: 30, right: 30, bottom: 20, left: 60}
    , margin3 = {top: 30, right: 30, bottom: 20, left: 60}
    , dist12 = 20
    , dist23 = 30
    , color = nv.utils.defaultColor()
    , showControls = false
    , controlsData = null
    , width = null
    , height = null
    , height2 = 80
    , height3 = 140
    , heightSentiment = 100
    , heightContext = 60
    , x
    , y
    , x2
    , y2
    , x3
    , y3
    , showLegend = true
    , brushExtent = null
    , tooltips = true
    , tooltip = function(key, x, y, e, graph) {
        return '<h3>' + key + '</h3>' +
               '<p>' +  y + ' at ' + x + '</p>'
      }
    , controlCB = function() {
        alert('This is from callback');
      }
    , noData = "No Data Available."
    , dispatch = d3.dispatch('tooltipShow', 'tooltipHide', 'brush', 'stateChange')
    , controlWidth = function() {return showControls ? 180 : 0 }
    , transitionDuration = 250
    , controlState = true
    , chartTitle = "Chart"
    , chartTitleStyle = "font-size:24px"
    , yAxisLabel = "y-Axis Label"
    , yAxisLabelStyle = "text-anchor:middle;font-size:18px"
    , y3AxisLabel = "y3-Axis Label"
    , y3AxisLabelStyle = "text-anchor:middle;font-size:16px"
    // 1m ~ 58750, Default is 5 min
    , extentThreshold = 58750*5
    , useInteractiveGuideLine = true
    ;

  lines
    .clipEdge(true)
    ;
  lines2
    .interactive(false)
    ;
  lines3
    .interactive(false)
    .clipEdge(true)
    ;
  xAxis
    .orient('bottom')
    .tickPadding(5)
    .tickFormat(d3.time.scale().tickFormat())
    ;
  yAxis
    .orient('left')
    ;
  x2Axis
    .orient('bottom')
    .tickPadding(5)
    .tickFormat(d3.time.scale().tickFormat())
    ;
  y2Axis
    .orient('left')
    ;
  x3Axis
    .orient('bottom')
    .tickPadding(5)
    .tickFormat(function(d,i){return '';})
    ;
  y3Axis
    .orient('left')
    ;

  controls.updateState(false);
  //============================================================

  // Setting the scale as d3.time.scale() for all the x-axis
  lines.scatter.xScale(d3.time.scale());
  lines2.scatter.xScale(d3.time.scale());
  lines3.scatter.xScale(d3.time.scale());

  // Set the y-axis to have [min,max] to be [0,1]
  lines3.scatter.yDomain([0,1]);

  //============================================================
  // Private Variables
  //------------------------------------------------------------

  var showTooltip = function(e, offsetElement) {
    var left = e.pos[0] + ( offsetElement.offsetLeft || 0 ),
        top = e.pos[1] + ( offsetElement.offsetTop || 0),
        x = xAxis.tickFormat()(lines.x()(e.point, e.pointIndex)),
        y = yAxis.tickFormat()(lines.y()(e.point, e.pointIndex)),
        content = tooltip(e.series.key, x, y, e, chart);

    nv.tooltip.show([left, top], content, null, null, offsetElement);
  };

  //============================================================


  function chart(selection) {
    selection.each(function(data) {
     
      // This is the sentiment data
      var sentimentData = data.filter(function(d){return d.sentiment});
      // This is the timeline data 
      var timelineData = data.filter(function(d){return !d.sentiment});
      
      var container = d3.select(this),
          that = this;

      var availableWidth = (width  || parseInt(container.style('width')) || 960)
                             - margin.left - margin.right,
          availableHeight = (width  || parseInt(container.style('height')) || 600)
                                - margin.top - margin.bottom,
         // TODO Resize the sentiment and focus chart if necessary. Not sure though
         heightFocus = availableHeight - heightSentiment - heightContext - dist12 - dist23;

      chart.update = function() { container.transition().duration(transitionDuration).call(chart) };
      chart.container = this;


      //------------------------------------------------------------
      // Display No Data message if there's nothing to show.

      if (!timelineData || !timelineData.length || !timelineData.filter(function(d) { return d.values.length }).length) {
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

      x = lines.xScale();
      y = lines.yScale();
      x2 = lines2.xScale();
      y2 = lines2.yScale();
      x3 = lines3.xScale();
      y3 = lines3.yScale();

      //------------------------------------------------------------


      //------------------------------------------------------------
      // Setup containers and skeleton of chart

      var wrap = container.selectAll('g.nv-wrap.nv-lineWithFocusChartAndSentiment').data([timelineData]);
      var gEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-lineWithFocusChartAndSentiment').append('g');
      var g = wrap.select('g');

      gEnter.append('g').attr('class', 'nv-legendWrap');
      gEnter.append('g').attr('class', 'nv-controlsWrap');

      var focusEnter = gEnter.append('g').attr('class', 'nv-focus');
      focusEnter.append('g').attr('class', 'nv-x nv-axis');
      focusEnter.append('g').attr('class', 'nv-y nv-axis')
          .append('g').attr('class', 'nv-zeroLine')
          .append('line');
          ;
      focusEnter.append('g').attr('class', 'nv-linesWrap');
      focusEnter.append('g').attr('class', 'nv-interactive');
      
      var sentiEnter = gEnter.append('g').attr('class', 'nv-senti');
      sentiEnter.append('g').attr('class', 'nv-x nv-axis');
      sentiEnter.append('g').attr('class', 'nv-y nv-axis')
          .append('g').attr('class', 'nv-zeroLine2')
          .append('line');
          ;
      sentiEnter.append('g').attr('class', 'nv-linesWrap');

      var contextEnter = gEnter.append('g').attr('class', 'nv-context');
      contextEnter.append('g').attr('class', 'nv-x nv-axis');
      contextEnter.append('g').attr('class', 'nv-y nv-axis')
          .append('g').attr('class', 'nv-zeroLine1')
          .append('line');
          ;
      contextEnter.append('g').attr('class', 'nv-linesWrap');
      contextEnter.append('g').attr('class', 'nv-brushBackground');
      contextEnter.append('g').attr('class', 'nv-x nv-brush');
      var contextDefs = contextEnter.append('defs');

      //------------------------------------------------------------


      //------------------------------------------------------------
      // Legend

      if (showLegend) {
        legend.width(availableWidth - controlWidth());

        g.select('.nv-legendWrap')
            .datum(timelineData)
            .call(legend);

        // PK Commenting this out to make sure the chart title fits nicely
        //GOLD//if ( margin.top != legend.height()) {
        //GOLD//  margin.top = legend.height();
        //GOLD//  availableHeight1 = (height || parseInt(container.style('height')) || 500)
        //GOLD//                     - margin.top - margin.bottom - height2;
        //GOLD//}

        g.select('.nv-legendWrap')
            .attr('transform', 'translate(' + controlWidth() + ',' + (-legend.height()) +')');
      }

      //------------------------------------------------------------

      //------------------------------------------------------------
      // Controls

      if (showControls) {
        controls.width(controlWidth()).color(['#444', '#444', '#444']);
        g.select('.nv-controlsWrap')
            .datum(controlsData)
            .call(controls);

        // controle.height() is modified after the previous line from 20 to 30
        g.select('.nv-controlsWrap')
            .attr('transform', 'translate(0,' + (-controls.height()) +')');
      }

      //------------------------------------------------------------


      // Element containing all the three charts below
      wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      //------------------------------------------------------------
      // Main Chart Component(s)
      //
      // -----------------------------------------------------------
      // Set up interactive layer
      if(useInteractiveGuideLine){
          interactiveLayer
                .width(availableWidth)
                //.height(availableHeight)
                .height(heightFocus)
                // TODO The margin doesnt perform as I expect
                .margin({left: margin.left, top: (margin.top+dist12+heightSentiment)})
                .svgContainer(container)
                .xScale(x);

          g.select('.nv-focus .nv-interactive').call(interactiveLayer);
          //wrap.select('.nv-focus .nv-interactive').call(interactiveLayer);
      }
      

      // -----------------------------------------------------------
      // Sentiment
      lines3
        .defined(lines.defined())
        .width(availableWidth)
        .height(heightSentiment)
        .color(
          sentimentData
            .map(function(d,i) {
              return d.color || color(d, i);
            })
            .filter(function(d,i) {
              // Select based on what timeline is enabled/disabled
              return !timelineData[i].disabled;
          })
        );

      var sentiLinesWrap = g.select('.nv-senti .nv-linesWrap')
          .datum(sentimentData.filter(function(d,i) { return !timelineData[i].disabled }))

      d3.transition(sentiLinesWrap).call(lines3);

      lines
        .width(availableWidth)
        .height(heightFocus)
        .color(
          //data
          timelineData
            .map(function(d,i) {
              return d.color || color(d, i);
            })
            .filter(function(d,i) {
              return !timelineData[i].disabled;
          })
        );

      g.select('.nv-focus')
          .attr('transform', 'translate(0,' + (heightSentiment + dist12) + ')')
      
      lines2
        .defined(lines.defined())
        .width(availableWidth)
        .height(heightContext)
        .color(
          //data
          timelineData
            .map(function(d,i) {
              return d.color || color(d, i);
            })
            .filter(function(d,i) {
              return !timelineData[i].disabled;
          })
        );

      g.select('.nv-context')
          .attr('transform', 'translate(0,' + (heightSentiment + dist12 + heightFocus + dist23) + ')')

      var contextLinesWrap = g.select('.nv-context .nv-linesWrap')
          .datum(timelineData.filter(function(d) { return !d.disabled }))

      d3.transition(contextLinesWrap).call(lines2);

      //------------------------------------------------------------


      /*
      var focusLinesWrap = g.select('.nv-focus .nv-linesWrap')
          .datum(data.filter(function(d) { return !d.disabled }))

      d3.transition(focusLinesWrap).call(lines);
     */


      //------------------------------------------------------------
      // Setup Main (Focus) Axes

      xAxis
        .scale(x)
        .ticks( availableWidth / 100 )
        .tickSize(-heightFocus, 0);

      yAxis
        .scale(y)
        .ticks( heightFocus / 36 )
        .axisLabel(yAxisLabel)
        .axisLabelDistance(30)
        .tickSize( -availableWidth, 0);
      
      g.select('.nv-focus .nv-x.nv-axis')
          .attr('transform', 'translate(0,' + heightFocus + ')');

      g.select('.nv-zeroLine line')
        .attr("x1", 0)
        .attr("x2", availableWidth)
        .attr("y1", heightFocus)
        .attr("y2", heightFocus)
        .attr('style', 'stroke:rgb(0,0,0);stroke-width:2')
        ;
      //------------------------------------------------------------


      //------------------------------------------------------------
      // Setup Brush

      brush
        .x(x2)
        .on('brush', function() {
            //When brushing, turn off transitions because chart needs to change immediately.
            var oldTransition = chart.transitionDuration();
            chart.transitionDuration(0); 
            onBrush();
            chart.transitionDuration(oldTransition);
        });

      if (brushExtent) brush.extent(brushExtent);

      var brushBG = g.select('.nv-brushBackground').selectAll('g')
          .data([brushExtent || brush.extent()])

      var brushBGenter = brushBG.enter()
          .append('g');

      brushBGenter.append('rect')
          .attr('class', 'left')
          .attr('x', 0)
          .attr('y', 0)
          .attr('height', heightContext);

      brushBGenter.append('rect')
          .attr('class', 'right')
          .attr('x', 0)
          .attr('y', 0)
          .attr('height', heightContext);


      var gBrush = g.select('.nv-x.nv-brush')
          .call(brush);
      gBrush.selectAll('rect')
          //.attr('y', -5)
          .attr('height', heightContext);
      gBrush.selectAll('.resize').append('path').attr('d', resizePath);

      // Change brush background visibity and color
      g.select('.nv-x.nv-brush').selectAll('.background')
          .style("fill", "rgb(0,0,0)")
          .style("fill-opacity", "0.1")
          .style("visibility", "visible")
          ;
      // Change the color and opacity of the extent
      g.select('.nv-x.nv-brush').selectAll('.extent')
          .attr("style", "fill:rgb(0,0,0);fill-opacity:0.15 !important")
          .style("cursor", "move");
          ;

      onBrush();

      //------------------------------------------------------------


      //------------------------------------------------------------
      // Setup Secondary (Context) Axes

      x2Axis
        .scale(x2)
        .ticks( availableWidth / 100 )
        .tickSize(-heightContext, 0);

      g.select('.nv-context .nv-x.nv-axis')
          .attr('transform', 'translate(0,' + y2.range()[0] + ')');
      d3.transition(g.select('.nv-context .nv-x.nv-axis'))
          .call(x2Axis);


      y2.nice();
      y2Axis
        .scale(y2)
        .ticks( heightContext / 36 )
        .tickSize( -availableWidth, 0)
        .tickFormat(function(d,i){return '';})
        ;

      g.select('.nv-context .nv-x.nv-axis')
          .attr('transform', 'translate(0,' + y2.range()[0] + ')');

      g.select('.nv-zeroLine1 line')
        .attr("x1", 0)
        .attr("x2", availableWidth)
        .attr("y1", heightContext)
        .attr("y2", heightContext)
        .attr('style', 'stroke:rgb(0,0,0);stroke-width:2')
        ;
      //------------------------------------------------------------

      //------------------------------------------------------------
      // Setup Third (Sentiment) Axes

      x3Axis
        .scale(x3)
        .ticks( availableWidth / 100 )
        .tickSize(-heightSentiment, 0);

      g.select('.nv-senti .nv-x.nv-axis')
          .attr('transform', 'translate(0,' + y3.range()[0] + ')');
      d3.transition(g.select('.nv-senti .nv-x.nv-axis'))
          .call(x3Axis);

      y3Axis
        .scale(y3)
        .ticks( heightSentiment / 36 )
        .axisLabel(y3AxisLabel)
        .axisLabelDistance(30)
        .tickSize( -availableWidth, 0);

      d3.transition(g.select('.nv-senti .nv-y.nv-axis'))
          .call(y3Axis);

      g.select('.nv-senti .nv-x.nv-axis')
          .attr('transform', 'translate(0,' + y3.range()[0] + ')');

      //======================================================================
      // Set the font size for the Secondary y-axis
      //======================================================================
      g.select('.nv-senti .nv-y.nv-axis').select('.nv-axis').select('.nv-axislabel')
          .attr("style", y3AxisLabelStyle);

      g.select('.nv-zeroLine2 line')
        .attr("x1", 0)
        .attr("x2", availableWidth)
        .attr("y1", heightSentiment/2)
        .attr("y2", heightSentiment/2)
        .attr('style', 'stroke:rgb(0,0,0);stroke-width:2')
        ;
      //------------------------------------------------------------


      //============================================================
      // Event Handling/Dispatching (in chart's scope)
      //------------------------------------------------------------

      legend.dispatch.on('stateChange', function(newState) { 
        chart.update();
      });

      // Control Handling
      controls.dispatch.on('legendClick', function(d,i) {
        if (!d.disabled) return;
        controlsData = controlsData.map(function(s) {
          s.disabled = true;
          return s;
        });
        d.disabled = false;

        // Run the callback function if present
        if ("onClick" in d) {
            d.onClick();
        } else {
            console.log('[WARNING] : No callback function defined. ');
        }

        controlState = !controlState;
        dispatch.stateChange(controlState);

        chart.update();
      });
      // End Control Handling

      dispatch.on('tooltipShow', function(e) {
        if (tooltips) showTooltip(e, that.parentNode);
      });

      // Interactive layer handling
      interactiveLayer.dispatch.on('elementMousemove', function(e){
          var singlePoint, pointIndex, pointXLocation, allData = [];

          // Timeline Data
          timelineData
            .filter(function(series, i){
                series.seriesIndex = i;
                return !series.disabled;
            })
            .forEach(function(series, i){
                pointIndex = nv.interactiveBisect(series.values, e.pointXValue, lines.x());

                var point = series.values[pointIndex];

                if(typeof point === 'undefined') return;
                if(typeof singlePoint === 'undefined') singlePoint = point;
                if(typeof pointXLocation === 'undefined') pointXLocation = lines.xScale()(lines.x()(point, pointIndex));

                var tooptipValue = lines.y()(point, pointIndex);

                allData.push({
                    key: series.key,
                    value: tooptipValue,
                    color: color(series,series.seriesIndex),
                    
                }); 

            });

          // Sentiment Data
          sentimentData
            .filter(function(series, i){
                series.seriesIndex = i;
                //return !series.disabled;
                return !timelineData[i].disabled;
            })
            .forEach(function(series, i){
                pointIndex = nv.interactiveBisect(series.values, e.pointXValue, lines3.x());

                var point = series.values[pointIndex];

                if(typeof point === 'undefined') return;
                if(typeof singlePoint === 'undefined') singlePoint = point;
                if(typeof pointXLocation === 'undefined') pointXLocation = lines3.xScale()(lines.x()(point, pointIndex));

                var tooptipValue = lines3.y()(point, pointIndex);

                allData.push({
                    key: series.key+'_sentiment',
                    value: tooptipValue,
                    color: color(series,series.seriesIndex),
                    
                }); 

            });
            // TODO
            //if(allData.length > 2){
            //    var yValue = lines.yScale().invert(e.mouseY);
            //    var yDisMax = Infinity, indexToHighlight = null;

            //    console.log('RRRR: ' + yValue);
            //    //allData.forEach(function(series, i){
            //    //    yValue = Math.abs(yValue);
            //    //    var 
            //    //});
            //}
            //allData[0].highlight = true;

            var xValue = d3.time.format('%c')(lines.x()(singlePoint, pointIndex));

            var valueFormatter = function(d, i){return yAxis.tickFormat()(d);};

            interactiveLayer.tooltip
                .position({left: pointXLocation+margin.left, top:e.mouseY+margin.top})
                .chartContainer(that.parentNode)
                .enabled(tooltips)
                .valueFormatter(valueFormatter)
                //.contentGenerator(function(){return 'DUMMY';})
                .data({
                    value: xValue,
                    series: allData
                })();

            interactiveLayer.renderGuideLine(pointXLocation);
      });

      interactiveLayer.dispatch.on("elementMouseout", function(e){
          dispatch.tooltipHide();
      });
      //============================================================


      //============================================================
      // Functions
      //------------------------------------------------------------

      // Taken from crossfilter (http://square.github.com/crossfilter/)
      function resizePath(d) {
        var e = +(d == 'e'),
            x = e ? 1 : -1,
            y = heightContext / 3;
        return 'M' + (.5 * x) + ',' + y
            + 'A6,6 0 0 ' + e + ' ' + (6.5 * x) + ',' + (y + 6)
            + 'V' + (2 * y - 6)
            + 'A6,6 0 0 ' + e + ' ' + (.5 * x) + ',' + (2 * y)
            + 'Z'
            + 'M' + (2.5 * x) + ',' + (y + 8)
            + 'V' + (2 * y - 8)
            + 'M' + (4.5 * x) + ',' + (y + 8)
            + 'V' + (2 * y - 8);
      }


      function updateBrushBG() {
        if (!brush.empty()) brush.extent(brushExtent);
        brushBG
            .data([brush.empty() ? x2.domain() : brushExtent])
            .each(function(d,i) {
              var leftWidth = x2(d[0]) - x.range()[0],
                  rightWidth = x.range()[1] - x2(d[1]);
              d3.select(this).select('.left')
                .attr('width',  leftWidth < 0 ? 0 : leftWidth);

              d3.select(this).select('.right')
                .attr('x', x2(d[1]))
                .attr('width', rightWidth < 0 ? 0 : rightWidth);
            });
      }


      function onBrush() {
        brushExtent = brush.empty() ? null : brush.extent();
        var extent = brush.empty() ? x2.domain() : brush.extent();

        //The brush extent cannot be less than one (thousand).  If it is, don't update the line chart.
        // changing 1 -> 1000, 58750 ~ 1 min
        // TODO Consider this again. Putting 1 gives the error : Problem parsing d="", Putting larger value doesnt 
        if (Math.abs(extent[0] - extent[1]) <= extentThreshold) {
          // Update the brush background just to make the chart more responsive. 
          updateBrushBG();
          return;
        }

        dispatch.brush({extent: extent, brush: brush});

        updateBrushBG();

        // Update Main (Focus)
        var focusLinesWrap = g.select('.nv-focus .nv-linesWrap')
            .datum(
              timelineData
                .filter(function(d) { return !d.disabled })
                .map(function(d,i) {
                  return {
                    key: d.key,
                    values: d.values.filter(function(d,i) {
                      return lines.x()(d,i) >= extent[0] && lines.x()(d,i) <= extent[1];
                    })
                  }
                })
            );

        focusLinesWrap.transition().duration(transitionDuration).call(lines);

        // Update Main (Focus) Axes
        g.select('.nv-focus .nv-x.nv-axis').transition().duration(transitionDuration)
            .call(xAxis);
        // Make sure that that y-axis is nicely set.
        y.nice();
        g.select('.nv-focus .nv-y.nv-axis').transition().duration(transitionDuration)
            .call(yAxis);

        //======================================================================
        // Set the font size for the Primay y-axis
        //======================================================================
        g.select('.nv-focus .nv-y.nv-axis').select('.nv-axis').select('.nv-axislabel')
              .attr("style", yAxisLabelStyle)
              ;

        // Update Sentiment (Senti)
        var sentiLinesWrap = g.select('.nv-senti .nv-linesWrap')
            .datum(
              sentimentData
                .filter(function(d,i) { return !timelineData[i].disabled })
                .map(function(d,i) {
                  return {
                    key: d.key,
                    values: d.values.filter(function(d,i) {
                      return lines3.x()(d,i) >= extent[0] && lines3.x()(d,i) <= extent[1];
                    })
                  }
                })
            );
        sentiLinesWrap.transition().duration(transitionDuration).call(lines3);
        // Update Sentiment (Senti) Axes
        g.select('.nv-senti .nv-x.nv-axis').transition().duration(transitionDuration)
            .call(x3Axis);
        g.select('.nv-senti .nv-y.nv-axis').transition().duration(transitionDuration)
            .call(y3Axis);
      }

      //============================================================


    });

    return chart;
  }


  //============================================================
  // Event Handling/Dispatching (out of chart's scope)
  //------------------------------------------------------------

  // TODO : Currently disabled to avoid interactive layer and tooltip overlap
  //lines.dispatch.on('elementMouseover.tooltip', function(e) {
  //  e.pos = [e.pos[0] +  margin.left, e.pos[1] + margin.top];
  //  dispatch.tooltipShow(e);
  //});

  //lines.dispatch.on('elementMouseout.tooltip', function(e) {
  //  dispatch.tooltipHide(e);
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
  chart.legend = legend;
  chart.lines = lines;
  chart.lines2 = lines2;
  chart.lines3 = lines3;
  chart.xAxis = xAxis;
  chart.yAxis = yAxis;
  chart.x2Axis = x2Axis;
  chart.y2Axis = y2Axis;
  chart.x3Axis = x3Axis;
  chart.y3Axis = y3Axis;

  d3.rebind(chart, lines, 'defined', 'isArea', 'size', 'xDomain', 'yDomain', 'xRange', 'yRange', 'forceX', 'forceY', 'interactive', 'clipEdge', 'clipVoronoi', 'id');

  chart.options = nv.utils.optionsFunc.bind(chart);
  
  chart.x = function(_) {
    if (!arguments.length) return lines.x;
    lines.x(_);
    lines2.x(_);
    lines3.x(_);
    return chart;
  };

  chart.y = function(_) {
    if (!arguments.length) return lines.y;
    lines.y(_);
    lines2.y(_);
    lines3.y(_);
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

  chart.margin2 = function(_) {
    if (!arguments.length) return margin2;
    margin2 = _;
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

  chart.height2 = function(_) {
    if (!arguments.length) return height2;
    height2 = _;
    return chart;
  };

  chart.color = function(_) {
    if (!arguments.length) return color;
    color =nv.utils.getColor(_);
    legend.color(color);
    return chart;
  };

  // PK Modifications
  chart.showControls = function(_) {
    if (!arguments.length) return showControls;
    showControls = _;
    return chart;
  };
  
  chart.controlCB = function(_) {
    if (!arguments.length) return controlCB;
    controlCB = _;
    return chart;
  };

  chart.controlsData = function(_) {
    if (!arguments.length) return controlsData;
    controlsData = _;
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

  chart.y3AxisLabel = function(_) {
    if (!arguments.length) return y3AxisLabel;
    y3AxisLabel = _;
    return chart;
  };

  chart.y3AxisLabelStyle = function(_) {
    if (!arguments.length) return y3AxisLabelStyle;
    y3AxisLabelStyle = _;
    return chart;
  };
  // PK End Modifications

  chart.showLegend = function(_) {
    if (!arguments.length) return showLegend;
    showLegend = _;
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

  chart.interpolate = function(_) {
    if (!arguments.length) return lines.interpolate();
    lines.interpolate(_);
    lines2.interpolate(_);
    return chart;
  };

  chart.noData = function(_) {
    if (!arguments.length) return noData;
    noData = _;
    return chart;
  };

  // Chart has multiple similar Axes, to prevent code duplication, probably need to link all axis functions manually like below
  chart.xTickFormat = function(_) {
    if (!arguments.length) return xAxis.tickFormat();
    xAxis.tickFormat(_);
    x2Axis.tickFormat(_);
    return chart;
  };

  chart.yTickFormat = function(_) {
    if (!arguments.length) return yAxis.tickFormat();
    yAxis.tickFormat(_);
    y2Axis.tickFormat(_);
    y3Axis.tickFormat(_);
    return chart;
  };
  
  chart.brushExtent = function(_) {
    if (!arguments.length) return brushExtent;
    brushExtent = _;
    return chart;
  };

  chart.transitionDuration = function(_) {
    if (!arguments.length) return transitionDuration;
    transitionDuration = _;
    return chart;
  };

  chart.extentThreshold = function(_) {
    if (!arguments.length) return extentThreshold;
    extentThreshold = _;
    return chart;
  };

  //============================================================


  return chart;
}
