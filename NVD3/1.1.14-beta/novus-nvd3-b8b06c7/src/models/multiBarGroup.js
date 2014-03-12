
nv.models.multiBarGroup = function() {
  "use strict";
  //============================================================
  // Public Variables with Default Settings
  //------------------------------------------------------------

  var margin = {top: 0, right: 0, bottom: 0, left: 0}
    , width = 960
    , height = 500
    , x = d3.scale.ordinal()
    , y = d3.scale.linear()
    , id = Math.floor(Math.random() * 10000) //Create semi-unique ID in case user doesn't select one
    , getX = function(d) { return d.x }
    , getY = function(d) { return d.y }
    , getLabel = function(d) { return d.label }
    , forceY = [0] // 0 is forced by default.. this makes sense for the majority of bar graphs... user can always do chart.forceY([]) to remove
    , clipEdge = true
    , stacked = false
    , stackOffset = 'zero' // options include 'silhouette', 'wiggle', 'expand', 'zero', or a custom function
    , color = nv.utils.defaultColor()
    , hideable = false
    , showValues = true
    , valueFormat = d3.format(',.2f')
    , barColor = null // adding the ability to set the color for each rather than the whole group
    , disabled // used in conjunction with barColor to communicate from multiBarHorizontalChart what series are disabled
    , delay = 1200
    , xDomain
    , yDomain
    , xRange
    , yRange
    , groupInnerPadding = 0.4
    , groupOuterPadding = 0.2
    // barSpacing represents the spacing between consecutive bars, and it a fraction of the width of the bars [0, 1)
    , barSpacing = 0.1
    , dispatch = d3.dispatch('chartClick', 'elementClick', 'elementDblClick', 'elementMouseover', 'elementMouseout')
    , numYTicks = null
    ;

  //============================================================


  //============================================================
  // Private Variables
  //------------------------------------------------------------

  var x0, y0, //used to store previous scales
      barWidth
      ;

  //============================================================


  function chart(selection) {
    selection.each(function(data) {
      var availableWidth = width - margin.left - margin.right,
          availableHeight = height - margin.top - margin.bottom,
          container = d3.select(this);

      if(hideable && data.length) hideable = [{
        values: data[0].values.map(function(d) {
        return {
          x: d.x,
          y: 0,
          series: d.series,
          size: 0.01
        };}
      )}];

      // This would populate 'd.y0'
      if (stacked)
        data = d3.layout.stack()
                 .offset(stackOffset)
                 .values(function(d){ return d.values })
                 .y(getY)
                 (!data.length && hideable ? hideable : data);


      //add series index to each data point for reference
      data.forEach(function(series, i) {
        series.values.forEach(function(point) {
          point.series = i;
        });
      });


      //------------------------------------------------------------
      // HACK for negative value stacking
      if (stacked)
        data[0].values.map(function(d,i) {
          var posBase = 0, negBase = 0;
          data.map(function(d) {
            var f = d.values[i]
            f.size = Math.abs(f.y);
            if (f.y<0)  {
              f.y1 = negBase;
              negBase = negBase - f.size;
            } else
            {
              f.y1 = f.size + posBase;
              posBase = posBase + f.size;
            }
          });
        });

      //------------------------------------------------------------
      // Setup Scales

      // remap and flatten the data for use in calculating the scales' domains
      var seriesData = (xDomain && yDomain) ? [] : // if we know xDomain and yDomain, no need to calculate
            data.map(function(d) {
              return d.values.map(function(d,i) {
                return { x: getX(d,i), y: getY(d,i), y0: d.y0, y1: d.y1, label: d.label}
              })
            });

      x   .domain(xDomain || d3.merge(seriesData).map(function(d) { return d.x }))
          .rangeBands(xRange || [0, availableWidth], groupInnerPadding, groupOuterPadding);

      //y   .domain(yDomain || d3.extent(d3.merge(seriesData).map(function(d) { return d.y + (stacked ? d.y1 : 0) }).concat(forceY)))
      //y   .domain(yDomain || d3.extent(d3.merge(seriesData).map(function(d) { console.log(d.y1); return stacked ? (d.y > 0 ? d.y1 : d.y1 + d.y ) : d.y }).concat(forceY)))
      y   .domain(yDomain || d3.extent(d3.merge(seriesData).map(function(d) { return stacked ? (d.y0+d.y) : d.y }).concat(forceY)))
          .range(yRange || [availableHeight, 0]);
      y.nice();

      // PK : Code to extend the y-range
      if(numYTicks){
          var tickValues = y.ticks(numYTicks);

          if(tickValues.slice(-1)[0] < d3.extent(d3.merge(seriesData).map(function(d) { return stacked ? (d.y0+d.y) : d.y }))[1]){
              if(tickValues.length > 1){
                  forceY.push(tickValues.slice(-1)[0] + (tickValues[1]-tickValues[0]));

                  //Recompute the y-scale
                  y   .domain(yDomain || d3.extent(d3.merge(seriesData).map(function(d) { return stacked ? (d.y0+d.y) : d.y }).concat(forceY)))
                      .range(yRange || [availableHeight, 0]);
                  y.nice();

              }
          }
      }

      // If scale's domain don't have a range, slightly adjust to make one... so a chart can show a single data point
      if (x.domain()[0] === x.domain()[1])
        x.domain()[0] ?
            x.domain([x.domain()[0] - x.domain()[0] * 0.01, x.domain()[1] + x.domain()[1] * 0.01])
          : x.domain([-1,1]);

      if (y.domain()[0] === y.domain()[1])
        y.domain()[0] ?
            y.domain([y.domain()[0] + y.domain()[0] * 0.01, y.domain()[1] - y.domain()[1] * 0.01])
          : y.domain([-1,1]);


      x0 = x0 || x;
      y0 = y0 || y;

      //------------------------------------------------------------


      //------------------------------------------------------------
      // Setup containers and skeleton of chart

      var wrap = container.selectAll('g.nv-wrap.nv-multibar').data([data]);
      var wrapEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-multibar');
      var defsEnter = wrapEnter.append('defs');
      var gEnter = wrapEnter.append('g');
      var g = wrap.select('g')

      gEnter.append('g').attr('class', 'nv-groups');

      wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      //------------------------------------------------------------

      defsEnter.append('clipPath')
          .attr('id', 'nv-edge-clip-' + id)
        .append('rect');
      wrap.select('#nv-edge-clip-' + id + ' rect')
          .attr('width', availableWidth)
          .attr('height', availableHeight);

      g   .attr('clip-path', clipEdge ? 'url(#nv-edge-clip-' + id + ')' : '');



      var groups = wrap.select('.nv-groups').selectAll('.nv-group')
          .data(function(d) { return d }, function(d,i) { return i });
      groups.enter().append('g')
          .style('stroke-opacity', 1e-6)
          .style('fill-opacity', 1e-6);
      groups.exit()
        .transition()
        .style('stroke-opacity', 1e-6)
        .style('fill-opacity', 1e-6)
        .remove();
      groups
          .attr('class', function(d,i) { return 'nv-group nv-series-' + i })
          .classed('hover', function(d) { return d.hover })
          .style('fill', function(d,i){ return color(d, i) })
          //.style('stroke', function(d,i){ return color(d, i) });
          .style('stroke', function(d,i){ return d3.rgb(color(d,i)).darker(0.22) });
      groups
          .transition()
          .style('stroke-opacity', 1)
          //.style('fill-opacity', .75);
          // UPDATED: Changed the opacity to 1 from 0.75
          .style('fill-opacity', 1);


      var bars = groups.selectAll('g.nv-bar')
          .data(function(d) { return (hideable && !data.length) ? hideable.values : d.values });

      bars.exit().remove();

      var barsEnter = bars.enter().append('g')
          .attr('transform', function(d,i) { return 'translate(' + x(getX(d,i)) + ',0)'; })

      barsEnter.append('rect')
          .attr('height', 0)
          .attr('width', x.rangeBand() / (stacked ? 1 : data.length) )
          ;

      bars
          .style('fill', function(d,i,j){ return color(d, j, i);  })
          .style('stroke', function(d,i,j){ return color(d, j, i); })
          .on('mouseover', function(d,i) { //TODO: figure out why j works above, but not here
            d3.select(this).classed('hover', true);
            dispatch.elementMouseover({
              value: getY(d,i),
              point: d,
              series: data[d.series],
              pos: [x(getX(d,i)) + (x.rangeBand() * (stacked ? data.length / 2 : d.series + .5) / data.length), y(getY(d,i) + (stacked ? d.y0 : 0))],  // TODO: Figure out why the value appears to be shifted
              pointIndex: i,
              seriesIndex: d.series,
              e: d3.event
            });
          })
          .on('mouseout', function(d,i) {
            d3.select(this).classed('hover', false);
            dispatch.elementMouseout({
              value: getY(d,i),
              point: d,
              series: data[d.series],
              pointIndex: i,
              seriesIndex: d.series,
              e: d3.event
            });
          })
          .on('click', function(d,i) {
            dispatch.elementClick({
              value: getY(d,i),
              point: d,
              series: data[d.series],
              pos: [x(getX(d,i)) + (x.rangeBand() * (stacked ? data.length / 2 : d.series + .5) / data.length), y(getY(d,i) + (stacked ? d.y0 : 0))],  // TODO: Figure out why the value appears to be shifted
              pointIndex: i,
              seriesIndex: d.series,
              e: d3.event
            });
            d3.event.stopPropagation();
          })
          .on('dblclick', function(d,i) {
            dispatch.elementDblClick({
              value: getY(d,i),
              point: d,
              series: data[d.series],
              pos: [x(getX(d,i)) + (x.rangeBand() * (stacked ? data.length / 2 : d.series + .5) / data.length), y(getY(d,i) + (stacked ? d.y0 : 0))],  // TODO: Figure out why the value appears to be shifted
              pointIndex: i,
              seriesIndex: d.series,
              e: d3.event
            });
            d3.event.stopPropagation();
          });
      bars
          .attr('class', function(d,i) { return getY(d,i) < 0 ? 'nv-bar negative' : 'nv-bar positive'})
          .transition()
          ;

      if (barColor) {
        if (!disabled) disabled = data.map(function() { return true });
        bars
          .style('fill', function(d,i,j) { return d3.rgb(barColor(d,i)).darker(  disabled.map(function(d,i) { return i }).filter(function(d,i){ return !disabled[i]  })[j]   ).toString(); })
          .style('stroke', function(d,i,j) { return d3.rgb(barColor(d,i)).darker(  disabled.map(function(d,i) { return i }).filter(function(d,i){ return !disabled[i]  })[j]   ).toString(); });
      }

      if (stacked) {
          barWidth = x.rangeBand(); 
          bars.transition()
            .delay(function(d,i) {
                return i * delay/ data[0].values.length;
            })
            .select('rect')
            .attr('x', function(d,i) {
                return 0;
            })
            .attr('width', barWidth)
            //GOLD//.attr('y', function(d,i) {
            //GOLD//    return getY(d,i) < 0 ?
            //GOLD//            y(0) :
            //GOLD//            y(0) - y(getY(d,i)) < 1 ?
            //GOLD//              y(0) - 1 :
            //GOLD//            y(getY(d,i)) || 0;
            //GOLD//})
            // TODO : Doesnt handle negative values currently
            .attr('y', function(d,i, j) {
                return y(getY(d,i)) + (y(d.y0)-y(0) - j*0.5);
            })
            .attr('height', function(d,i) {
                return Math.max(Math.abs(y(getY(d,i)) - y(0)),1) || 0;
            });
      } else {
          // Compute the barWidth as it will be same for all the bars
          barWidth = x.rangeBand()/(data.length + (data.length-1)*barSpacing);
          bars.transition()
            .delay(function(d,i) {
                return i * delay/ data[0].values.length;
            })
            .select('rect')
            .attr('x', function(d,i) {
                if(d.series > 0){
                    return d.series*barWidth*(1 + barSpacing);
                } else {
                    return 0;
                }
              //return d.series * x.rangeBand() / data.length + d.series*20;
            })
            .attr('width', barWidth)
            .attr('y', function(d,i) {
                return getY(d,i) < 0 ?
                        y(0) :
                        y(0) - y(getY(d,i)) < 1 ?
                          y(0) - 1 :
                        y(getY(d,i)) || 0;
            })
            .attr('height', function(d,i) {
                return Math.max(Math.abs(y(getY(d,i)) - y(0)),1) || 0;
            });
      }

      // TODO : Show values only if it is not stacked

      if(!stacked){
      // Create the text if its supplied in the data. the field should be 'y0'
      barsEnter.append('text')
          .attr('style', 'fill-opacity:0;');

      if(showValues){

        // Check if you want to enable or disable the 'text' value
        data.forEach(function(series){
            if(typeof series.enabletext == 'undefined'){
                series.enabletext = false;
            }

            series.values.forEach(function(point){
                point.enabletext = series.enabletext;
            });
        });

        bars
            .transition().delay(function(d,i){return 50;})
            .select('text')
            .attr('text-anchor', function(d,i){ return 'middle'})
            //GOLD//.attr('x', function(d,i){
            //GOLD//    console.log('GGG: ' + d.series + '  ' + d.x);
            //GOLD//    return d.series*x.rangeBand()/data.length + x.rangeBand()/(2*data.length);
            //GOLD//})
            .attr('x', function(d,i){
                if(d.series > 0){
                    return d.series*barWidth*(1+barSpacing) + barWidth/2;
                } else {
                    return barWidth/2;
                }
            })
            .attr('y', function(d,i){
                return y(0) - y(getY(d,i)) < 1 ?
                          y(0) - 1 -10 :
                        y(getY(d,i))-10 || 0;
            })
            .attr('dy', '.46em')
            .text(function(d,i){
                if(d.enabletext)
                    return valueFormat(getLabel(d,i));
                else
                    return '';
            });

      } else {
          bars.selectAll('text').remove();
      }
      }

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

  chart.stacked = function(_) {
    if (!arguments.length) return stacked;
    stacked = _;
    return chart;
  };

  chart.stackOffset = function(_) {
    if (!arguments.length) return stackOffset;
    stackOffset = _;
    return chart;
  };

  chart.clipEdge = function(_) {
    if (!arguments.length) return clipEdge;
    clipEdge = _;
    return chart;
  };

  chart.color = function(_) {
    if (!arguments.length) return color;
    color = nv.utils.getColor(_);
    return chart;
  };

  chart.barColor = function(_) {
    if (!arguments.length) return barColor;
    barColor = nv.utils.getColor(_);
    return chart;
  };

  chart.disabled = function(_) {
    if (!arguments.length) return disabled;
    disabled = _;
    return chart;
  };

  chart.id = function(_) {
    if (!arguments.length) return id;
    id = _;
    return chart;
  };

  chart.hideable = function(_) {
    if (!arguments.length) return hideable;
    hideable = _;
    return chart;
  };

  chart.delay = function(_) {
    if (!arguments.length) return delay;
    delay = _;
    return chart;
  };

  chart.groupInnerPadding = function(_) {
    if (!arguments.length) return groupInnerPadding;
    groupInnerPadding = _;
    return chart;
  };

  chart.groupOuterPadding = function(_) {
    if (!arguments.length) return groupOuterPadding;
    groupOuterPadding = _;
    return chart;
  };

  chart.barSpacing = function(_) {
    if (!arguments.length) return barSpacing;
    barSpacing = _;
    return chart;
  };

  chart.valueFormat = function(_) {
    if (!arguments.length) return valueFormat;
    valueFormat = _;
    return chart;
  };

  chart.getY0 = function(_) {
    if (!arguments.length) return getY0;
    getY0 = _;
    return chart;
  };

  chart.numYTicks = function(_) {
    if (!arguments.length) return numYTicks;
    numYTicks = _;
    return chart;
  };

  //============================================================


  return chart;
}
