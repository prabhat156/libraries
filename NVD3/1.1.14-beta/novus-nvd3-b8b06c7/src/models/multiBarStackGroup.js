
nv.models.multiBarStackGroup = function() {
  "use strict";
  //============================================================
  // Public Variables with Default Settings
  //------------------------------------------------------------

  var margin = {top: 0, right: 0, bottom: 0, left: 0}
    , width = 960
    , height = 500
    , id = Math.floor(Math.random() * 10000) //Create semi-unique ID in case user doesn't select one
    , x = d3.scale.ordinal()
    , y = d3.scale.linear()
    , getX = function(d) { return d.x }
    , getY = function(d) { return d.y }
    , forceY = [0] // 0 is forced by default.. this makes sense for the majority of bar graphs... user can always do chart.forceY([]) to remove
    , color = nv.utils.defaultColor()
    , barColor = null // adding the ability to set the color for each rather than the whole group
    , disabled // used in conjunction with barColor to communicate from multiBarHorizontalChart what series are disabled
    , stacked = false
    , showValues = false
    , showValuesSeries = null
    , showBarLabels = false
    , valuePadding = 60
    , valueFormat = d3.format(',.2f')
    , delay = 1200
    , xDomain
    , yDomain
    , xRange
    , yRange
    , dispatch = d3.dispatch('chartClick', 'elementClick', 'elementDblClick', 'elementMouseover', 'elementMouseout')
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

        // TEST CODE, messy but works
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext("2d");
        ctx.font = "12px Arial";        
        var width1 = ctx.measureText("Group D").width;
        console.log('Computed Width: ' + width1);
        //alert(width1);
        // END TEST CODE, messy but works



      var availableWidth = width - margin.left - margin.right,
          availableHeight = height - margin.top - margin.bottom,
          container = d3.select(this);

      //TEST//if(showValues){
      //TEST//  // Check if you want to enable ot disable the 'text' value
      //TEST//  data.forEach(function(series){
      //TEST//      //console.log('JJ:: ' + series.enabletext);
      //TEST//      if(typeof series.enabletext == 'undefined') {
      //TEST//          series.enabletext = false;
      //TEST//      }

      //TEST//      series.values.forEach(function(point){ 
      //TEST//          point.enabletext = series.enabletext});
      //TEST//  });
      //TEST//}

      // Get all the unique stacks
      var stacks = d3.scale.ordinal()
                    .domain(data.map(function(series){
                        return series.stack;}))
                    .domain();

      // PK This is for getting the original order back
      data.forEach(function(series, i){
          series.index = i;
      });

      // Creating the dataset to get the stacked and grouped data
      var data = stacks.map(function(d){
          var temp = d3.layout.stack()
                    .offset('zero')
                    .values(function(d){return d.values})
                    .y(getY)
                    (data.filter(function(series){return series.stack === d}));
          // Code to offset a rect in stack so that the 'stroke' dont overlap
          temp.forEach(function(series,i){ 
              series.values.forEach(function(point){ 
                  point.localID = i});
          });
          return temp;
      });

      // PK Merge all the series and them sort them to the original order
      data = d3.merge(data);
      data.sort(function(a,b){ return (a.index > b.index) });

      data.forEach(function(series){
          series.values.forEach(function(point){
              point.sID = stacks.indexOf(series.stack);
          });
      });

      //add series index to each data point for reference
      data.forEach(function(series, i) {
        series.values.forEach(function(point) {
          point.series = i;
        });
      });
     
      //GOLD////------------------------------------------------------------
      //GOLD//// HACK for negative value stacking
      //GOLD//if (stacked)
      //GOLD//  data[0].values.map(function(d,i) {
      //GOLD//    var posBase = 0, negBase = 0;
      //GOLD//    data.map(function(d) {
      //GOLD//      var f = d.values[i]
      //GOLD//      f.size = Math.abs(f.y);
      //GOLD//      if (f.y<0)  {
      //GOLD//        f.y1 = negBase - f.size;
      //GOLD//        negBase = negBase - f.size;
      //GOLD//      } else
      //GOLD//      {
      //GOLD//        f.y1 = posBase;
      //GOLD//        posBase = posBase + f.size;
      //GOLD//      }
      //GOLD//    });
      //GOLD//  });

      // TODO PK Check this, you have to set the scales correctly, but we can skip for now
      //------------------------------------------------------------
      // Setup Scales

      // remap and flatten the data for use in calculating the scales' domains
      var seriesData = (xDomain && yDomain) ? [] : // if we know xDomain and yDomain, no need to calculate
            data.map(function(d) {
              return d.values.map(function(d,i) {
                return { x: getX(d,i), y: getY(d,i), y0: d.y0, y1: d.y1, sID: d.sID, localID: d.localID }
              })
            });

      x   .domain(xDomain || d3.merge(seriesData).map(function(d) { return d.x }))
          .rangeBands(xRange || [0, availableHeight], .25);

      // [NEW] This new domain takes care of partial stacking of the series
      y   .domain(yDomain || d3.extent(d3.merge(seriesData).map(function(d) { return (d.y+d.y0) }).concat(forceY)))

      if (showValues && !stacked)
        //GOLD//y.range(yRange || [(y.domain()[0] < 0 ? valuePadding : 0), availableWidth - (y.domain()[1] > 0 ? valuePadding : 0) ]);
        y.range(yRange || [0, availableWidth - valuePadding ]);
      else
        y.range(yRange || [0, availableWidth]);

      x0 = x0 || x;
      y0 = y0 || d3.scale.linear().domain(y.domain()).range([y(0),y(0)]);

      //------------------------------------------------------------

      //------------------------------------------------------------
      // Setup containers and skeleton of chart

      var wrap = d3.select(this).selectAll('g.nv-wrap.nv-multibarStackGroup').data([data]);
      var wrapEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-multibarStackGroup');
      var defsEnter = wrapEnter.append('defs');
      var gEnter = wrapEnter.append('g');
      var g = wrap.select('g');

      gEnter.append('g').attr('class', 'nv-groups');

      wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      //------------------------------------------------------------


      // PK Create groups here
      var groups = wrap.select('.nv-groups').selectAll('.nv-group')
          .data(function(d) { return d }, function(d,i) { return i });
      groups.enter().append('g')
          .style('stroke-opacity', 1e-6)
          .style('fill-opacity', 1e-6);
      groups.exit().transition()
          .style('stroke-opacity', 1e-6)
          .style('fill-opacity', 1e-6)
          .remove();
      groups
          .attr('class', function(d,i) { return 'nv-group nv-series-' + i })
          .classed('hover', function(d) { return d.hover })
          .style('fill', function(d,i){ return color(d, i) })
          .style('stroke', function(d,i){ return color(d, i) });
      groups.transition()
          .style('stroke-opacity', 1)
          .style('fill-opacity', .75);


      // PK Create bars here, I guess for each group
      var bars = groups.selectAll('g.nv-bar')
          .data(function(d) { return d.values });

      bars.exit().remove();

      var barsEnter = bars.enter().append('g')
          .attr('transform', function(d,i,j) {
              return 'translate(' + y0(d.y0) + ',' + ((d.sID * x.rangeBand() / stacks.length ) + d.sID*3 + x(getX(d,i))) + ')'
          });

      barsEnter.append('rect')
          .attr('width', 0)
          .attr('height', x.rangeBand() / (stacks.length) )

      bars
          .on('mouseover', function(d,i) { //TODO: figure out why j works above, but not here
            d3.select(this).classed('hover', true);
            dispatch.elementMouseover({
              value: getY(d,i),
              point: d,
              series: data[d.series],
              //GOLD//pos: [ y(getY(d,i) + (stacked ? d.y0 : 0)), x(getX(d,i)) + (x.rangeBand() * (stacked ? data.length / 2 : d.series + .5) / data.length) ],
              pos: [ y(getY(d,i) + d.y0), x(getX(d,i)) + d.sID*3 + (x.rangeBand() * (d.sID+0.5) / stacks.length) ],
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
              //GOLD//pos: [x(getX(d,i)) + (x.rangeBand() * (stacked ? data.length / 2 : d.series + .5) / data.length), y(getY(d,i) + (stacked ? d.y0 : 0))],  // TODO: Figure out why the value appears to be shifted
              pos: [x(getX(d,i)) + d.sID*3 + (x.rangeBand() * (d.sID + .5) / stacks.length), y(getY(d,i) + d.y0)],  // TODO: Figure out why the value appears to be shifted
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
              //GOLD//pos: [x(getX(d,i)) + (x.rangeBand() * (stacked ? data.length / 2 : d.series + .5) / data.length), y(getY(d,i) + (stacked ? d.y0 : 0))],  // TODO: Figure out why the value appears to be shifted
              pos: [x(getX(d,i)) + d.sID*3 + (x.rangeBand() * (d.sID + .5) / stacks.length), y(getY(d,i) + d.y0)],  // TODO: Figure out why the value appears to be shifted
              pointIndex: i,
              seriesIndex: d.series,
              e: d3.event
            });
            d3.event.stopPropagation();
          });


      barsEnter.append('text');

      if (showValues) {
        // Check if you want to enable or disable the 'text' value
        data.forEach(function(series){
            //console.log('JJ:: ' + series.enabletext);
            if(typeof series.enabletext == 'undefined') {
                series.enabletext = false;
            }

            series.values.forEach(function(point){ 
                point.enabletext = series.enabletext;
            });
        });

        // Show values for all the bars by default
        if(!showValuesSeries) showValuesSeries = d3.range(data.length);
        bars.select('text')
            .attr('text-anchor', function(d,i) { return getY(d,i) < 0 ? 'end' : 'start' })
            .attr('y', x.rangeBand() / (data.length * 2))
            .attr('dy', '.46em')
            //GOLD//.text(function(d,i) { return valueFormat(getY(d,i)) })
            .text(function(d,i) {
                if (d.enabletext)
                    return valueFormat(getY(d,i))
                else
                    return '' })
        bars.transition()
          .select('text')
            .attr('x', function(d,i) { return getY(d,i) < 0 ? -4 : y(getY(d,i)) - y(0) + 4 })
      } else {
        bars.selectAll('text').text('');
      }

      bars
          .attr('class', function(d,i) { return getY(d,i) < 0 ? 'nv-bar negative' : 'nv-bar positive'})

      if (barColor) {
        if (!disabled) disabled = data.map(function() { return true });
        bars
          .style('fill', function(d,i,j) { return d3.rgb(barColor(d,i)).darker(  disabled.map(function(d,i) { return i }).filter(function(d,i){ return !disabled[i]  })[j]   ).toString(); })
          .style('stroke', function(d,i,j) { return d3.rgb(barColor(d,i)).darker(  disabled.map(function(d,i) { return i }).filter(function(d,i){ return !disabled[i]  })[j]   ).toString(); });
      }

      // Create Stacked and Grouped Bars
      bars.transition()
          .attr('transform', function(d,i,j) {
            //TODO: stacked must be all positive or all negative, not both?
            return 'translate(' +
            (y(d.y0) + d.localID*1)
            + ',' +
            (d.sID * x.rangeBand() / stacks.length
            +
            d.sID*3
            +
            x(getX(d,i)) )
            + ')'
          })
        .select('rect')
          .attr('height', x.rangeBand() / stacks.length )
          .attr('width', function(d,i) {
            return Math.max(Math.abs(y(getY(d,i)) - y(0)),1)
          });


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

  chart.showValuesSeries = function(_) {
    if (!arguments.length) return showValuesSeries;
    showValuesSeries = _;
    return chart;
  };

  chart.showBarLabels = function(_) {
    if (!arguments.length) return showBarLabels;
    showBarLabels = _;
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
