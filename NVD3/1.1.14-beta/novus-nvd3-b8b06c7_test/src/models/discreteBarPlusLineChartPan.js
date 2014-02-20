
nv.models.discreteBarPlusLineChartPan = function() {
  "use strict";
  //============================================================
  // Public Variables with Default Settings
  //------------------------------------------------------------

  var discretebar = nv.models.discreteBar()
    , xAxis = nv.models.axis()
    , yAxis = nv.models.axis()
    ;

  //discretebar.xRange([0, 9000], .1);

  var lines = nv.models.line()
      , y2Axis = nv.models.axis().showMaxMin(false)
      //, y2Axis = nv.models.axis()
      ;

  var zoom = d3.behavior.zoom();

  var margin = {top: 15, right: 10, bottom: 50, left: 60}
    , width = null
    , height = null
    , color = nv.utils.getColor()
    , showXAxis = true
    , showYAxis = true
    , rightAlignYAxis = false
    , staggerLabels = false
    , tooltips = true
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
    ;

  var domain_gold;

  xAxis
    .orient('bottom')
    .highlightZero(false)
    .showMaxMin(false)
    .tickFormat(function(d) { return d })
    ;
  yAxis
    .orient((rightAlignYAxis) ? 'right' : 'left')
    .tickFormat(d3.format(',.1f'))
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
      //console.log('FFFF: ' + JSON.stringify(e.point));
    var left = e.pos[0] + ( offsetElement.offsetLeft || 0 ),
        top = e.pos[1] + ( offsetElement.offsetTop || 0),
        x = xAxis.tickFormat()(discretebar.x()(e.point, e.pointIndex)),
        y = yAxis.tickFormat()(discretebar.y()(e.point, e.pointIndex)),
       
        //y2 = y2Axis.tickFormat()(lines.y()(e.point, e.pointIndex)),
        y2 = y2Axis.tickFormat()(lines.y()(linePoints[0])),
        content = tooltip(e.series.key, x, y, y2, e, chart);

        //console.log('YYYY: ' + JSON.stringify(linePoints)); 
    nv.tooltip.show([left, top], content, e.value < 0 ? 'n' : 's', null, offsetElement);
  };

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
        var plotWidth = 4000;
        discretebar.xRange([0, plotWidth], .1);
        console.log(discretebar.xRange());
        var tempPadding = lines.scatter.padDataOuter();
        lines.scatter.xRange([(plotWidth * tempPadding +  plotWidth) / (2 *data[0].values.length), plotWidth - plotWidth * (1 + tempPadding) / (2 * data[0].values.length)  ]);
        console.log('AW: ' + availableWidth + ' AH: ' + availableHeight);
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


      //------------------------------------------------------------
      // Setup Scales

      var dataBars = data.filter(function(d){ return !d.disabled && d.bar});
      var dataLines = data.filter(function(d){ return !d.bar});

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
      
      g.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      if (rightAlignYAxis) {
          g.select(".nv-y.nv-axis")
              .attr("transform", "translate(" + availableWidth + ",0)");
      }

      //------------------------------------------------------------


      //------------------------------------------------------------
      // Main Chart Component(s)

      discretebar
        .width(availableWidth)
        .height(availableHeight);

      lines
        .width(availableWidth)
        .height(availableHeight)
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
            .tickSize(-availableHeight, 0);


          g.select('.nv-x.nv-axis')
              .attr("clip-path", "url(#new-x-clip-rect)")
              //.attr('transform', 'translate(0,' + (y.range()[0] + ((discretebar.showValues() && y.domain()[0] < 0) ? 16 : 0)) + ')')
              ;
          //d3.transition(g.select('.nv-x.nv-axis'))
          g.select('.nv-x.nv-axis').transition()
              .call(xAxis);
         
          // This is required for clipping to work for the axis 
          g.select('.nv-x.nv-axis').select('.nv-axis')
              .attr('transform', 'translate(0,' + (y.range()[0] + ((discretebar.showValues() && y.domain()[0] < 0) ? 16 : 0)) + ')')
              ;

          console.log(xAxis.tickValues());

          var xTicks = g.select('.nv-x.nv-axis').selectAll('g');

          if (staggerLabels) {
            xTicks
                .selectAll('text')
                .attr('transform', function(d,i,j) { return 'translate(0,' + (j % 2 == 0 ? '5' : '17') + ')' })
          }

      }

      if (showYAxis) {
          y.nice();
          yAxis
            .scale(y)
            .ticks( availableHeight / 36 )
            .tickSize( -availableWidth, 0);

          g.select('.nv-y.nv-axis').transition()
              .call(yAxis);

          y2.nice();
          y2Axis
            .scale(y2)
            .ticks( availableHeight / 36 )
            ;

          g.select('.nv-y2.nv-axis')
              .attr('transform', 'translate(' + availableWidth + ',0)');
          g.select('.nv-y2.nv-axis').transition()
              .call(y2Axis);

      }

      console.log(g.select(".nv-zeroLine line"));

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


        //================ ZOOM AND PAN
        zoom
            .scaleExtent([1,1])
            .on("zoom", zoomResponse);

        // THIS WAS THE GOLD IMPLEMENATION
        //var gZoom = g.select('.nv-barsWrap')
        // THIS IS JUST A TEST
        //var gZoom = container.select('g.nv-wrap.nv-discreteBarWithAxes')
        var gZoom = d3.select('#chart1')
            .call(zoom);

        //================ ZOOM AND PAN

      //============================================================
      // Event Handling/Dispatching (in chart's scope)
      //------------------------------------------------------------

      dispatch.on('tooltipShow', function(e) {
          var linePoints = dataLines.map(function(d){
                        return {
                            key : d.key,
                            values : {x: e.pointIndex, y: d.values[e.pointIndex]}
                            }
                        });

        if (tooltips) showTooltip(e, that.parentNode, linePoints);
      });

      //============================================================

      //============================================================
      // Functions
      
        function zoomResponse(){

            // Avoid translation towards the left of the initial point
            var t = zoom.translate(),
                tx = t[0],
                ty = t[1];

            // Tranlation
            tx = Math.min(tx, 0);
            tx = Math.max(tx, availableWidth-plotWidth); // Trying with 6000
            zoom.translate([tx, ty]);

            // Translate the x-axis
            g.select('.nv-x.nv-axis').select('.nv-axis')
                .attr('transform', 'translate(' + tx + ',' + (y.range()[0] + ((discretebar.showValues() && y.domain()[0] < 0) ? 16 : 0)) + ')')
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
      console.log('FIRST...');
    e.pos = [e.pos[0] +  margin.left, e.pos[1] + margin.top];
    dispatch.tooltipShow(e);
  });

  lines.dispatch.on('elementMouseover.tooltip', function(e) {
      console.log('UUU: '+ Object.keys(e) + 'PPPP: ' + JSON.stringify(e.seriesIndex));
    e.pos = [e.pos[0] +  margin.left, e.pos[1] + margin.top];
    dispatch.tooltipShow(e);
  });

  discretebar.dispatch.on('elementMouseout.tooltip', function(e) {
    dispatch.tooltipHide(e);
  });
  
  lines.dispatch.on('elementMouseout.tooltip', function(e) {
    dispatch.tooltipHide(e);
  });

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
    discretebar.color(color);
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
