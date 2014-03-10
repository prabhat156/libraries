nv.models.vxMarker = function() {
  "use strict";
  //============================================================
  // Public Variables with Default Settings
  //------------------------------------------------------------

  var margin = {top: 0, right: 0, bottom: 0, left: 0},
      width = 400,
      height = 20,
      getX = function(d) {return d.x},
      getY = function(d) {return d.y},
      getKey = function(d) { return d.key },
      color = nv.utils.defaultColor(),
      updateState = true   //If true, legend will update data.disabled and trigger a 'stateChange' dispatch.,
      radioButtonMode = false   //If true, clicking legend items will cause it to behave like a radio button. (only one can be selected at a time),
      dispatch = d3.dispatch('markerClick', 'markerDblclick', 'markerMouseover', 'markerMouseout', 'stateChange'),
      x,
      y,
      pointKey = null,
      defaultStyle = 2,
      getMarkerStyle = function(d){ return d.markerStyle || defaultStyle; }
    ;

  //============================================================

  var x0, y0,
      needsUpdate = false;

  function chart(selection) {
    selection.each(function(data) {

      //TODO: Trying to fix a hack
      data.forEach(function(d,i){
          d.values.forEach(function(point){
              point.series = i;
          });
      });

      var availableWidth = width - margin.left - margin.right,
          //availableHeight = height - margin.top - margin.bottom,
          availableHeight = height,
          container = d3.select(this);

      //------------------------------------------------------------
      // Setup containers and skeleton of chart

      var wrap = container.selectAll('g.nv-marker').data([data]);
      var wrapEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-marker');
      var defsEnter = wrapEnter.append('defs');
      var gEnter = wrapEnter.append('g');
      var g = wrap.select('g');

      gEnter.append('g').attr('class', 'nv-groups');

      wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      //------------------------------------------------------------

      x0 = x0 || x;
      y0 = y0 || y;

      var groups = wrap.select('.nv-groups').selectAll('.nv-group')
            .data(function(d){ return d }, getKey);

      groups.enter().append('g')
            .style('stroke', function(d){ return d3.rgb(d.color).darker(0.22); })
            .style('fill', function(d){ return d.color; })
            ;
      groups.exit()
            .remove();

      groups
          .attr('class', function(d,i){ return 'nv-group nv-series-' + i + ' nv-markerStyle-'+getMarkerStyle(d);})
          .classed('hover', function(d){ return d.hover });

      // Notice the difference from vxLegend.js
      // Code for Marker Style 1, the diamond, 'bottom to top' marker
      var points = groups.filter('.nv-markerStyle-1').selectAll('g.nv-marker-point')
          .data(function(d){ return d.values; }, pointKey);

      // Enter only if there is something in the selection
      if(points.length != 0){
          var pointsEnter = points.enter().append('g');

          pointsEnter.append('line')
              .attr('x1', function(d,i){ return x0(getX(d,i))})
              .attr('x2', function(d,i){ return x0(getX(d,i))})
              .attr('y1', function(d,i){ return y0.range()[0]})
              .attr('y2', function(d,i){ return y0.range()[1]})
              //.style('stroke', '#677070')
              .style('stroke-width', '2px')
              .style('stroke-dasharray', '5,5')
              ;
          pointsEnter.append('path').attr('class', 'marker-point-top-diamond')
              .attr('d', function(d,i){ return "M"+x0(getX(d,i))+","+(y0.range()[1]-8)+" l8,8 l-8,8 l-8,-8 l8,-8";})
              .attr('style', "fill-rule: nonzero;")
              //.style('fill', '#677070')
              //.style('stroke', '#677070')
              ;
          pointsEnter.append('path').attr('class', 'marker-point-bottom-diamond')
              .attr('d', function(d,i){ return "M"+x0(getX(d,i))+","+(y0.range()[0]-8)+" l8,8 l-8,8 l-8,-8 l8,-8";})
              .attr('style', "fill-rule: nonzero;")
              //.style('fill', '#677070')
              //.style('stroke', '#677070')
              ;
          points.exit().remove();
          
          points.each(function(d,i){
              d3.select(this)
                .classed('nv-marker-point', true)
                .classed('nv-marker-point-'+i, true)
                .classed('hover', false)
                ;
          });
          points.selectAll('line')
              .transition()
              .attr('x1', function(d,i){ return x(getX(d,i))})
              .attr('x2', function(d,i){ return x(getX(d,i))})
              .attr('y1', function(d,i){ return y.range()[0]})
              .attr('y2', function(d,i){ return y.range()[1]})
          points.selectAll('.marker-point-top-diamond')
              .transition()
              .attr('d', function(d,i){ return "M"+x(getX(d,i))+","+(y.range()[1]-8)+" l8,8 l-8,8 l-8,-8 l8,-8";});
          points.selectAll('.marker-point-bottom-diamond')
              .transition()
              .attr('d', function(d,i){ return "M"+x(getX(d,i))+","+(y.range()[0]-8)+" l8,8 l-8,8 l-8,-8 l8,-8";});

          // Event Handling
          points
              .on('mouseover', function(d, i){
                  if(needsUpdate || !data[d.series]) return 0;
                  var series = data[d.series],
                      point = series.values[i];
        
                  // Do not define the event if the tooltip doesnt need to be displayed 
                  if(series.tooltipFormat == -1) return 0;

                  dispatch.markerMouseover({
                      point: point,
                      series: series,
                      pos: [x(getX(point, i)) + margin.left, y.range()[0] + margin.top],
                      seriesIndex: d.series,
                      pointIndex: i
                  });
              })
              .on('mouseout', function(d, i){
                  if(needsUpdate || !data[d.series]) return 0;
                  var series = data[d.series],
                      point = series.values[i];
          
                  // Do not define the event if the tooltip doesnt need to be displayed 
                  if(series.tooltipFormat == -1) return 0;

                  dispatch.markerMouseout({
                      point: point,
                      series: series,
                      seriesIndex: d.series,
                      pointIndex: i
                  });
              });
      }

      // Code for Marker Style 2, the original 'flag' marker
      points = groups.filter('.nv-markerStyle-2').selectAll('g.nv-marker-point')
          .data(function(d){ return d.values}, pointKey);

      // Enter only if somthing is there in the selection
      if(points.length != 0){
          var pointsEnter = points.enter().append('g');
     
          pointsEnter.append('line')
              .attr('x1', function(d,i){ return x0(getX(d,i))})
              .attr('x2', function(d,i){ return x0(getX(d,i))})
              .attr('y1', function(d,i){ return y0(getY(d,i))})
              .attr('y2', function(d,i){ return y0(getY(d,i))-40})
              .attr('style', "stroke-width:2;")
              ;
          pointsEnter.append('rect')
              .attr('x', function(d,i){ return x0(getX(d,i))})
              .attr('y', function(d,i){ return y0(getY(d,i))-20-40})
              .attr('width', 60)
              .attr('height', 20)
              .attr('style', "fill-opacity:0.5;stroke-width:2;")
              ;
          pointsEnter.append('text')
              .attr('x', function(d,i){ return x0(getX(d,i))+30})
              .attr('y', function(d,i){ return y0(getY(d,i))-10-40})
              .attr('dy', '.32em')
              .attr('text-anchor', 'middle')
              //.text(function(d,j){ return series.key + ' Ad'})
              .text(function(d,j){ return ' Ad'})
              ;
          points.exit().remove();
          
          points.each(function(d,i){
              d3.select(this)
                .classed('nv-marker-point', true)
                .classed('nv-marker-point-'+i, true)
                .classed('hover', false)
                ;
          });

          points.selectAll('line')
              .transition()
              .attr('x1', function(d,i){ return x(getX(d,i))})
              .attr('x2', function(d,i){ return x(getX(d,i))})
              .attr('y1', function(d,i){ return y(getY(d,i))})
              .attr('y2', function(d,i){ return y(getY(d,i))-40});
          points.selectAll('rect')
              .transition()
              .attr('x', function(d,i){ return x(getX(d,i))})
              .attr('y', function(d,i){ return y(getY(d,i))-20-40});
          points.selectAll('text')
              .transition()
              .attr('x', function(d,i){ return x(getX(d,i))+30})
              .attr('y', function(d,i){ return y(getY(d,i))-10-40});

          // Event Handling
          points
              .on('mouseover', function(d, i){
                  if(needsUpdate || !data[d.series]) return 0;
                  var series = data[d.series],
                      point = series.values[i];
        
                  // Do not define the event if the tooltip doesnt need to be displayed 
                  if(series.tooltipFormat == -1) return 0;

                  dispatch.markerMouseover({
                      point: point,
                      series: series,
                      pos: [x(getX(point, i)) + margin.left, y(getY(point, i)) + margin.top],
                      seriesIndex: d.series,
                      pointIndex: i
                  });
              })
              .on('mouseout', function(d, i){
                  if(needsUpdate || !data[d.series]) return 0;
                  var series = data[d.series],
                      point = series.values[i];
          
                  // Do not define the event if the tooltip doesnt need to be displayed 
                  if(series.tooltipFormat == -1) return 0;

                  dispatch.markerMouseout({
                      point: point,
                      series: series,
                      seriesIndex: d.series,
                      pointIndex: i
                  });
              });
      }

      // Code for Marker Style 3, the 'hollow circle with number' marker
      points = groups.filter('.nv-markerStyle-3').selectAll('g.nv-marker-point')
          .data(function(d){ return d.values}, pointKey);

      // Enter only if somthing is there in the selection
      if(points.length != 0){
          var pointsEnter = points.enter().append('g');

          pointsEnter.append('circle')
                .attr('cx', function(d,i){ return x0(getX(d,i)) })
                .attr('cy', function(d,i){ return y0(getY(d,i)) })
                .attr('r', 10)
                .attr('style', "stroke-width:2;")
                //.style('stroke', '#000000')
                .style('fill', '#ffffff')
                ;
          pointsEnter.append('text')
                .attr('x', function(d,i){ return x0(getX(d,i))})
                .attr('y', function(d,i){ return y0(getY(d,i))})
                .attr('style', 'stroke:#000000;')
                .attr('dy', '.32em')
                .attr('text-anchor', 'middle')
                //GOLD//.text(function(d,j){
                //GOLD//    // TODO you coule use the pointKey or something? Not sure
                //GOLD//   if(typeof d.y0 === 'undefined'){
                //GOLD//       return j+1;
                //GOLD//   } else {
                //GOLD//       return d.y0;
                //GOLD//   } 
                //GOLD//})
                .text(pointKey)
                ;
          points.exit().remove();
          
          points.each(function(d,i){
              d3.select(this)
                .classed('nv-marker-point', true)
                .classed('nv-marker-point-'+i, true)
                .classed('hover', false)
                ;
          });

          points.selectAll('circle')
              .transition()
              .attr('cx', function(d,i){ return x(getX(d,i)) })
              .attr('cy', function(d,i){ return y(getY(d,i)) });
          points.selectAll('text')
              .transition()
              .attr('x', function(d,i){ return x(getX(d,i)) })
              .attr('y', function(d,i){ return y(getY(d,i)) });

          // Event Handling
          points
              .on('mouseover', function(d, i){
                  if(needsUpdate || !data[d.series]) return 0;
                  var series = data[d.series],
                      point = series.values[i];
        
                  // Do not define the event if the tooltip doesnt need to be displayed 
                  if(series.tooltipFormat == -1) return 0;

                  dispatch.markerMouseover({
                      point: point,
                      series: series,
                      pos: [x(getX(point, i)) + margin.left, y(getY(point, i)) + margin.top],
                      seriesIndex: d.series,
                      pointIndex: i
                  });
              })
              .on('mouseout', function(d, i){
                  if(needsUpdate || !data[d.series]) return 0;
                  var series = data[d.series],
                      point = series.values[i];
          
                  // Do not define the event if the tooltip doesnt need to be displayed 
                  if(series.tooltipFormat == -1) return 0;

                  dispatch.markerMouseout({
                      point: point,
                      series: series,
                      seriesIndex: d.series,
                      pointIndex: i
                  });
              });
      }


      // Code for Marker Style 4, the 'outlier (big circle around the given point)' marker
      points = groups.filter('.nv-markerStyle-4').selectAll('g.nv-marker-point')
          .data(function(d){ return d.values}, pointKey);

      // Enter only if somthing is there in the selection
      if(points.length != 0){
          var pointsEnter = points.enter().append('g');

          // Define clip-path for this case. For others, its not really required
          defsEnter.append('clipPath')
                .attr('id', 'nv-marker-edge-clip')
            .append('rect');
          wrap.select('#nv-marker-edge-clip rect')
            .attr('width', availableWidth)
            .attr('height', availableHeight);

          // Only add the clip-path to this group
          groups.filter('.nv-markerStyle-4').attr('clip-path', 'url(#nv-marker-edge-clip)');

          pointsEnter.append('circle')
                .attr('cx', function(d,i){ return x0(getX(d,i)) })
                .attr('cy', function(d,i){ return y0(getY(d,i)) })
                .attr('r', 18)
                .attr('style', "stroke-width:0.5;")
                .style('fill-opacity', 0.5)
                ;
          points.exit().remove();
          
          points.each(function(d,i){
              d3.select(this)
                .classed('nv-marker-point', true)
                .classed('nv-marker-point-'+i, true)
                .classed('hover', false)
                ;
          });

          points.selectAll('circle')
              .transition()
              .attr('cx', function(d,i){ return x(getX(d,i)) })
              .attr('cy', function(d,i){ return y(getY(d,i)) });

          // Event Handling
          points
              .on('mouseover', function(d, i){
                  if(needsUpdate || !data[d.series]) return 0;
                  var series = data[d.series],
                      point = series.values[i];
      
                  // Do not define the event if the tooltip doesnt need to be displayed 
                  if(series.tooltipFormat == -1) return 0;

                  dispatch.markerMouseover({
                      point: point,
                      series: series,
                      pos: [x(getX(point, i)) + margin.left, y(getY(point, i)) + margin.top],
                      seriesIndex: d.series,
                      pointIndex: i
                  });
              })
              .on('mouseout', function(d, i){
                  if(needsUpdate || !data[d.series]) return 0;
                  var series = data[d.series],
                      point = series.values[i];
          
                  // Do not define the event if the tooltip doesnt need to be displayed 
                  if(series.tooltipFormat == -1) return 0;

                  dispatch.markerMouseout({
                      point: point,
                      series: series,
                      seriesIndex: d.series,
                      pointIndex: i
                  });
              });
      }

      //store old series
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

  chart.key = function(_) {
    if (!arguments.length) return getKey;
    getKey = _;
    return chart;
  };

  chart.color = function(_) {
    if (!arguments.length) return color;
    color = nv.utils.getColor(_);
    return chart;
  };

  chart.updateState = function(_) {
    if (!arguments.length) return updateState;
    updateState = _;
    return chart;
  };

  chart.radioButtonMode = function(_) {
    if (!arguments.length) return radioButtonMode;
    radioButtonMode = _;
    return chart;
  };

  chart.xScale = function(_){
      if(!arguments.length) return x;
      x = _;
      return chart;
  }

  chart.yScale = function(_){
      if(!arguments.length) return y;
      y = _;
      return chart;
  }

  chart.defaultStyle = function(_){
      if(!arguments.length) return defaultStyle;
      defaultStyle = _;
      return chart;
  }

  chart.defaultStyle = function(_){
      if(!arguments.length) return defaultStyle;
      defaultStyle = _;
      return chart;
  }

  chart.pointKey = function(_){
      if(!arguments.length) return pointKey;
      pointKey = _;
      return chart;
  }
  //============================================================


  return chart;
}
