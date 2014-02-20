
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
    , tooltip = function(key, x, y, e, graph) {
        return '<h3>' + x + '</h3>' +
               '<p>' +  y + '</p>'
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

  var showTooltip = function(e, offsetElement) {
    var left = e.pos[0] + ( offsetElement.offsetLeft || 0 ),
        top = e.pos[1] + ( offsetElement.offsetTop || 0),
        x = xAxis.tickFormat()(discretebar.x()(e.point, e.pointIndex)),
        y = yAxis.tickFormat()(discretebar.y()(e.point, e.pointIndex)),
        content = tooltip(e.series.key, x, y, e, chart);

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


      ////================== TESTING ==============================
      //defsEnter.append('clipPath')
      //    //.attr('id', 'nv-x-label-clip-' + discretebar.id())
      //    .attr('id', 'testclip')
      //  .append('rect');

      ////GOLD//g.select('#nv-x-label-clip-' + discretebar.id() + ' rect')
      ////GOLD//    .attr('width', x.rangeBand() * (staggerLabels ? 2 : 1))
      ////GOLD//    .attr('height', 16)
      ////GOLD//    .attr('x', -x.rangeBand() / (staggerLabels ? 1 : 2 ));
      ////var clip = g.select('#nv-x-label-clip-' + discretebar.id() + ' rect')
      //var clip = g.select('#testclip')
      //    .attr('width', availableWidth)
      //    .attr('height', availableHeight)
      //    .attr('x', '0')
      //    .attr('y', '0');
      ////g.attr("clip-path", "url(#clip)");
      ////================== TESTING ==============================


      gEnter.append('g').attr('class', 'nv-x nv-axis');
      gEnter.append('g').attr('class', 'nv-y nv-axis')
            .append('g').attr('class', 'nv-zeroLine')
            .append('line');
        
      gEnter.append('g').attr('class', 'nv-barsWrap');
      gEnter.append('g').attr('class', 'nv-y2 nv-axis');
      gEnter.append('g').attr('class', 'nv-linesWrap');
      
      g.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
      //var tt1 = margin.left;
      //var tt2 = margin.top;
      //g.attr('transform', 'translate(' + tt1 + ',' + tt2 + ')');

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

          console.log(g.select('rect').select('.nv-barsWrap'));

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
      //TEST//defsEnter.append('clipPath')
      //TEST//    .attr('id', 'nv-bar-clip-rect')
      //TEST//  .append('rect')
      //TEST//    .attr('width', availableWidth-60)
      //TEST//    .attr('height', availableHeight-60)
      //TEST//    .attr('x', '40')
      //TEST//    .attr('y', '-40');
      
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
      //TEST//barsWrap
      //TEST//    .attr('transform','translate(100,-40)')
      //TEST//    .attr("clip-path", "url(#nv-bar-clip-rect)");
      
      //barsWrap.select('.nv-discretebar')
      //          .attr("clip-path", "url(#nv-bar-clip-rect)");

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
          
          //g.select('.nv-x.nv-axis')
          //    .attr("clip-path", "url(#new-x-clip-rect)");

          //g.select('.nv-x.nv-axis').select('.nv-xaxis');
          //    .attr('transform', 'translate(0,' + (y.range()[0] + ((discretebar.showValues() && y.domain()[0] < 0) ? 16 : 0)) + ')')
          //    ;
          g.select('.nv-x.nv-axis').select('.nv-axis')
              //.attr('transform', 'translate(0,100)')
              .attr('transform', 'translate(0,' + (y.range()[0] + ((discretebar.showValues() && y.domain()[0] < 0) ? 16 : 0)) + ')')
              ;

          console.log(xAxis.tickValues());

          var xTicks = g.select('.nv-x.nv-axis').selectAll('g');

          if (staggerLabels) {
            xTicks
                .selectAll('text')
                .attr('transform', function(d,i,j) { return 'translate(0,' + (j % 2 == 0 ? '5' : '17') + ')' })
          }

          // Keep a copy of the original domain to be used when required
          domain_gold = x.domain();
          
          //g.select('.nv-x.nv-axis')
          //    .attr("clip-path", "url(#new-x-clip-rect)")

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

      // Zero line
      g.select(".nv-zeroLine line")
        .attr("x1",0)
        .attr("x2",availableWidth)
        .attr("y1", y(0))
        .attr("y2", y(0))
        ;

      //------------------------------------------------------------


        //================ ZOOM AND PAN
        zoom
            .scaleExtent([1,1])
            //.x(x)
            .x(d3.scale.linear().domain([0,1000]).range([0,1000]))
            .y(y)
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
        if (tooltips) showTooltip(e, that.parentNode);
      });

      //============================================================

      //============================================================
      // Functions
      
        function zoomResponse(){

            // Avoid translation towards the left of the initial point
            var t = zoom.translate(),
                tx = t[0],
                ty = t[1];

            //L//console.log('tx: ' + tx + ' ty: ' + ty);
            tx = Math.min(tx, 0);
            // TODO Currently this is a fixed value from hit-and-trial. Valid only when total data has 100 elements
            //tx = Math.max(tx, -500);
            //tx = Math.max(tx, availableWidth-6950); // 71, 5729
            //tx = Math.max(tx, -8000); // 8549 to be precise i guess
            //tx = Math.max(tx, -4310); // works perfectly with 6000
            tx = Math.max(tx, availableWidth-plotWidth); // Trying with 6000
            zoom.translate([tx, ty]);

            var numberFormat = d3.format("f");
            var curZoomDomain = zoom.x().domain()
                                .map(function(d){
                                    return numberFormat(d);
                                });

            //console.log('DDDD: '+d3.event.translate[0]);
          
            //console.log(curZoomDomain);  
            var newXDomain = domain_gold.filter(function(d,i){return i>= Math.abs(curZoomDomain[0])/100});
            var temp = domain_gold.length - newXDomain.length;
            newXDomain = newXDomain.concat(d3.range(temp).map(function(d){return 'DUMMY'+d}));
            x.domain(newXDomain);
            
            
            //WORK////g.select('.nv-focus .nv-x.nv-axis')
            //WORK//g.select('.nv-x.nv-axis')
            //WORK//    .transition()
            //WORK//    .call(xAxis);
            //WORK////console.log(xAxis.scale().domain());
            //WORK////console.log(xAxis.scale().range());


            var tempVal = d3.range(10).map(function(d){ return {label: 'AAAA'+d, value: 10*Math.random()}});
            //console.log(JSON.stringify(tempVal));

            // Testing data filtering
            //console.log(JSON.stringify(dataBars));
            var temp = dataBars.filter(function(d){return !d.disabled})
                                .map(function(d,i){
                                    return {
                                        key : d.key,
                                        //values : tempVal
                                        values: d.values.filter(function(d,i){
                                            //console.log('KKK: ' + d + ' idx: ' + i);
                                            //return discretebar.xIdx(d,i) >= 4;
                                            //console.log('LLL: ' + numberFormat(temp[0]));
                                            //return i >= (0-numberFormat(temp[0]));
                                            return i >= Math.abs(curZoomDomain[0])/100;
                                        })
                                    }
                                });

            //var newTemp = temp.map(function(d){
            //    console.log(d.values.length);
            //    //d.values = d.values.concat(d3.range(4).map(function(d){return {label: 'YYY'+d, value: 15}}));
            //    d.values.concat(d3.range(4).map(function(d){return {label: 'YYY'+d, value: 15}}));
            //    console.log('FFF: '+d.values.length);
            //    return d;
            //});
            temp.map(function(d){
                //console.log(d.values.length);
                var len = x.domain().length - d.values.length
                d.values = d.values.concat(d3.range(len).map(function(d){return {label: 'YYY'+d, value: 15}}));
                //console.log('FFF: '+d.values.length);
                return d;
            });

            //console.log(x.domain().length);
            //console.log('HHH : '+JSON.stringify(temp));
            //console.log(JSON.stringify(temp[0].values));
            //console.log('TTT : '+JSON.stringify(newTemp));


            //WORK////console.log(JSON.stringify(temp));
            //WORK//var barsWrapUpdate = g.select('.nv-barsWrap')
            //WORK//    .datum(temp);
            //WORK//barsWrapUpdate.transition().call(discretebar);


            ////
            //console.log(g.select('.nv-barsWrap'));
            //g.select('.nv-barsWrap.nv-discretebar')
            //    .attr("transform(" + d3.event.translate[0] + ",0)")
            //    ;

            //console.log('RRRR: ' + d3.event.translate);

            // Translate the x-axis
            //GOLD//g.select('.nv-x.nv-axis')
            //GOLD//    .attr('transform', 'translate(' + tx + ',' + (y.range()[0] + ((discretebar.showValues() && y.domain()[0] < 0) ? 16 : 0)) + ')');
            g.select('.nv-x.nv-axis').select('.nv-axis')
                .attr('transform', 'translate(' + tx + ',' + (y.range()[0] + ((discretebar.showValues() && y.domain()[0] < 0) ? 16 : 0)) + ')')
                //.attr('transform', 'translate(' + tx + ',0)')
                ;
         
            //console.log(g.select('.nv-x.nv-axis').select('.nv-axis')); 

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
    dispatch.tooltipShow(e);
  });

  discretebar.dispatch.on('elementMouseout.tooltip', function(e) {
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
