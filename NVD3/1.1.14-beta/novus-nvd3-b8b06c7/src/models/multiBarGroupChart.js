nv.models.multiBarGroupChart = function() {
  "use strict";
  //============================================================
  // Public Variables with Default Settings
  //------------------------------------------------------------

  var multibar = nv.models.multiBarGroup(),
      xAxis = nv.models.axis(),
      xAxisTicks = nv.models.axis(),
      yAxis = nv.models.axis(),
      legend = nv.models.vxLegend(),
      controls = nv.models.legend();

  var margin = {top: 60, right: 20, bottom: 50, left: 70},
      width = null,
      height = null,
      color = nv.utils.defaultColor(),
      showControls = true,
      showLegend = true,
      showXAxis = true,
      showYAxis = true,
      rightAlignYAxis = false,
      reduceXTicks = true, // if false a tick will show for every data point
      staggerLabels = false,
      rotateLabels = 0,
      tooltips = true,
      tooltip = function(key, x, y, e, graph) {
        return '<h3>' + key + '</h3>' +
               '<p>' +  y + ' on ' + x + '</p>';
      },
      x, //can be accessed via chart.xScale()
      y, //can be accessed via chart.yScale()
      tick_scale = d3.scale.linear(),
      state = { stacked: false },
      defaultState = null,
      noData = "No Data Available.",
      dispatch = d3.dispatch('tooltipShow', 'tooltipHide', 'stateChange', 'changeState'),
      controlWidth = function() { return showControls ? 180 : 0; },
      transitionDuration = 250,
      chartTitle = "Chart",
      chartTitleStyle = "font-size:24px",
      xAxisLabel = "x-Axis Label",
      yAxisLabel = "y-Axis Label",
      yAxisLabelStyle = "text-anchor:middle;font-size:18px",
      tooltipValueFormat = d3.format(',.2f');

  multibar
    .stacked(true)
    ;
  xAxis
    .orient('bottom')
    .tickPadding(10)
    .showMaxMin(false)
    .tickFormat(function(d) { return d; })
    ;
  xAxisTicks
    .orient('bottom')
    .tickPadding(7)
    .showMaxMin(false)
    .tickFormat(function(d) { return ''; })
    ;
  yAxis
    .tickPadding(5)
    .showMaxMin(false)
    .orient((rightAlignYAxis) ? 'right' : 'left')
    .tickFormat(d3.format(',.1f'))
    ;

  controls.updateState(false);
  //============================================================

  //============================================================
  // Private Variables
  //------------------------------------------------------------

  var newTooltipContent = function(columns, data){
      var tableContainer = d3.select(document.createElement("div"));

      var table = tableContainer.append("table"),
          thead = table.append("thead"),
          tbody = table.append("tbody");

      // Append the header row
      thead.append("tr")
          .selectAll("th")
          .data(columns)
          .enter()
          .append("th")
          .style('color', function(column, i){ return column.color || color(column, i);})
          .text(function(column){ return column; });

      // Create a for for each object in the data
      var rows = tbody.selectAll("tr")
          .data(data)
          .enter()
          .append("tr");

      // Create a cell for each row in each column
      var cells = rows.selectAll("td")
          .data(function(row){
              return columns.map(function(column, i){
                  return {
                      column: column,
                      //value: d3.format(',.2f')(row[i])
                      value: tooltipValueFormat(row[i])
                  };
              });
          })
          .enter()
          .append("td")
          .style('color', function(d,i){ return d.color || color(d,i); })
          .text(function(d){ return d.value; });

      var tableContent = tableContainer.html();

      return tableContent;
  };

  var showTooltip = function(e, offsetElement) {
    var left = e.pos[0] + ( offsetElement.offsetLeft || 0 ),
        top = e.pos[1] + ( offsetElement.offsetTop || 0),
        x = xAxis.tickFormat()(multibar.x()(e.point, e.pointIndex)),
        y = yAxis.tickFormat()(multibar.y()(e.point, e.pointIndex)),
        content = null;

    // Tooltip content style will depend on  whether the chart is grouped or stacked
    if(multibar.stacked()){
        content = newTooltipContent(e.values.map(function(d){ return d.key; }),
                d3.range(1).map(function(d){
                    return e.values.map(function(dd){
                        return dd.value;
                    });
                })
                );
    } else {
        content = tooltip(e.series.key, x, y, e, chart);
    }

    nv.tooltip.show([left, top], content, e.value < 0 ? 'n' : 's', null, offsetElement);
  };

  //============================================================


  function chart(selection) {
    selection.each(function(data) {
      var container = d3.select(this),
          that = this;

      var availableWidth = (width  || parseInt(container.style('width'), 10) || 960) - margin.left - margin.right,
          availableHeight = (height || parseInt(container.style('height'), 10) || 400) - margin.top - margin.bottom;

      chart.update = function() { container.transition().duration(transitionDuration).call(chart); };
      chart.container = this;

      //set state.disabled
      state.disabled = data.map(function(d) { return !!d.disabled; });

      if (!defaultState) {
        var key;
        defaultState = {};
        for (key in state) {
          if (state[key] instanceof Array)
            defaultState[key] = state[key].slice(0);
          else
            defaultState[key] = state[key];
        }
      }
      //------------------------------------------------------------
      // Display noData message if there's nothing to show.

      if (!data || !data.length || !data.filter(function(d) { return d.values.length; }).length) {
        var noDataText = container.selectAll('.nv-noData').data([noData]);

        noDataText.enter().append('text')
          .attr('class', 'nvd3 nv-noData')
          .attr('dy', '-.7em')
          .style('text-anchor', 'middle');

        noDataText
          .attr('x', margin.left + availableWidth / 2)
          .attr('y', margin.top + availableHeight / 2)
          .text(function(d) { return d; });

        return chart;
      } else {
        container.selectAll('.nv-noData').remove();
      }

      //------------------------------------------------------------
      
      //------------------------------------------------------------
      // Chart Title
      container.selectAll('text')
          .data([chartTitle])
          .enter()
          .append('text')
          .attr('class', 'nvd3 nv-charttitle')
          .attr('x', availableWidth/2)
          .attr('y', 30)
          .attr("text-anchor", "middle")
          // Handled by CSS now
          //.attr("style", chartTitleStyle)
          .text(function(d){return d; });


      //------------------------------------------------------------
      // Setup Scales

      x = multibar.xScale();
      y = multibar.yScale();
      //------------------------------------------------------------


      //------------------------------------------------------------
      // Setup containers and skeleton of chart

      var wrap = container.selectAll('g.nv-wrap.nv-multiBarWithLegend').data([data]);
      var gEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-multiBarWithLegend').append('g');
      var g = wrap.select('g');

      gEnter.append('g').attr('class', 'nv-x nv-axis');
      //gEnter.append('g').attr('class', 'nv-y nv-axis');
      gEnter.append('g').attr('class', 'nv-y nv-axis')
          .append('g').attr('class', 'nv-zeroLine')
          .append('line');
      gEnter.append('g').attr('class', 'nv-barsWrap');
      gEnter.append('g').attr('class', 'nv-legendWrap');
      gEnter.append('g').attr('class', 'nv-controlsWrap');
      gEnter.append('g').attr('class', 'nv-x-ticks nv-axis');

      //------------------------------------------------------------


      //------------------------------------------------------------
      // Legend

      if (showLegend) {
        legend.width(availableWidth - controlWidth());

        if (multibar.barColor())
          data.forEach(function(series,i) {
            series.color = d3.rgb('#ccc').darker(i * 1.5).toString();
          });

        g.select('.nv-legendWrap')
            .datum(data)
            .call(legend);

        //if ( margin.top != legend.height()) {
        //  margin.top = legend.height();
        //  availableHeight = (height || parseInt(container.style('height')) || 400)
        //                     - margin.top - margin.bottom;
        //}

        g.select('.nv-legendWrap')
            //GOLD//.attr('transform', 'translate(' + controlWidth() + ',' + (-margin.top) +')');
            .attr('transform', 'translate(' + controlWidth() + ',' + (-legend.height()) +')');
      }

      //------------------------------------------------------------


      //------------------------------------------------------------
      // Controls

      if (showControls) {
        var controlsData = [
          { key: 'Grouped', disabled: multibar.stacked() },
          { key: 'Stacked', disabled: !multibar.stacked() }
        ];

        controls.width(controlWidth()).color(['#444', '#444', '#444']);
        g.select('.nv-controlsWrap')
            .datum(controlsData)
            //GOLD//.attr('transform', 'translate(0,' + (-margin.top) +')')
            .attr('transform', 'translate(0,' + (-legend.height()) +')')
            .call(controls);
      }

      //------------------------------------------------------------


      wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      if (rightAlignYAxis) {
          g.select(".nv-y.nv-axis")
              .attr("transform", "translate(" + availableWidth + ",0)");
      }

      //------------------------------------------------------------
      // Main Chart Component(s)

      multibar
        .disabled(data.map(function(series) { return series.disabled; }))
        .width(availableWidth)
        .height(availableHeight)
        .color(data.map(function(d,i) {
          return d.color || color(d, i);
        }).filter(function(d,i) { return !data[i].disabled; }));


      var barsWrap = g.select('.nv-barsWrap')
          .datum(data.filter(function(d) { return !d.disabled; }));

      barsWrap.transition().call(multibar.numYTicks(availableHeight/60));

      //------------------------------------------------------------


      //------------------------------------------------------------
      // Setup Axes

      if (showXAxis) {
          xAxis
            .scale(x)
            .ticks( availableWidth / 100 )
            //.tickSize(-availableHeight, 0)
            .tickSize(0)
            .axisLabel(xAxisLabel)
            .axisLabelDistance(60)
            ;

          g.select('.nv-x.nv-axis')
              .attr('transform', 'translate(0,' + y.range()[0] + ')');
          g.select('.nv-x.nv-axis').transition()
              .call(xAxis);

          var xTicks = g.select('.nv-x.nv-axis > g').selectAll('g');

          xTicks
              .selectAll('line, text')
              .style('opacity', 1);

          if (staggerLabels) {
              var getTranslate = function(x,y) {
                  return "translate(" + x + "," + y + ")";
              };

              var staggerUp = 5, staggerDown = 17;  //pixels to stagger by
              // Issue #140
              xTicks
                .selectAll("text")
                .attr('transform', function(d,i,j) { 
                    return  getTranslate(0, (j % 2 === 0 ? staggerUp : staggerDown));
                  });

              var totalInBetweenTicks = d3.selectAll(".nv-x.nv-axis .nv-wrap g g text")[0].length;
              g.selectAll(".nv-x.nv-axis .nv-axisMaxMin text")
                .attr("transform", function(d,i) {
                    return getTranslate(0, (i === 0 || totalInBetweenTicks % 2 !== 0) ? staggerDown : staggerUp);
                });
          }

          if (reduceXTicks)
            xTicks
              .filter(function(d,i) {
                  return i % Math.ceil(data[0].values.length / (availableWidth / 100)) !== 0;
                })
              .selectAll('text, line')
              .style('opacity', 0);

          if(rotateLabels)
            xTicks
              .selectAll('.tick text')
              .attr('transform', 'rotate(' + rotateLabels + ' 0,0)')
              .style('text-anchor', rotateLabels > 0 ? 'start' : 'end');
          
          g.select('.nv-x.nv-axis').selectAll('g.nv-axisMaxMin text')
              .style('opacity', 1);
      }

      // Display the ticks
      var maxGroupSize = d3.max(data.map(function(d){ return d.values.length; }));
      tick_scale.domain([0, maxGroupSize]);
      tick_scale.range([0, availableWidth]);
      xAxisTicks
        .scale(tick_scale)
        .tickValues(tick_scale.ticks(maxGroupSize).slice(1,-1))
        .tickSize(7)
        ;

      g.select('.nv-x-ticks.nv-axis')
          .attr('transform', 'translate(0,' + y.range()[0] + ')');
      g.select('.nv-x-ticks.nv-axis').transition()
          .call(xAxisTicks);
      // End Display the ticks

      if (showYAxis) {
          yAxis
            .scale(y)
            .ticks( availableHeight / 60 )
            .axisLabel(yAxisLabel)
            .axisLabelDistance(30)
            .tickSize( -availableWidth, 0);

          g.select('.nv-y.nv-axis').transition()
              .call(yAxis);
          
          //g.select('.nv-y.nv-axis').select('.nv-axis').select('.nv-axislabel')
          //    .attr("style", yAxisLabelStyle);

          g.select('.nv-zeroLine line')
            .attr("x1", 0)
            .attr("x2", availableWidth)
            .attr("y1", availableHeight)
            .attr("y2", availableHeight)
            // UPDATE: Handled by CSS now
            //.attr('style', 'stroke:#6bc1c1; stroke-width:2px')
            ;
      }


      //------------------------------------------------------------



      //============================================================
      // Event Handling/Dispatching (in chart's scope)
      //------------------------------------------------------------

      legend.dispatch.on('stateChange', function(newState) { 
        state = newState;
        dispatch.stateChange(state);
        chart.update();
      });

      controls.dispatch.on('legendClick', function(d,i) {
        if (!d.disabled) return;
        controlsData = controlsData.map(function(s) {
          s.disabled = true;
          return s;
        });
        d.disabled = false;

        switch (d.key) {
          case 'Grouped':
            multibar.stacked(false);
            break;
          case 'Stacked':
            multibar.stacked(true);
            break;
        }

        state.stacked = multibar.stacked();
        dispatch.stateChange(state);

        chart.update();
      });

      dispatch.on('tooltipShow', function(e) {

          if(multibar.stacked()){
            // PK : modification to tooltip
            var tooltip_series = data.filter(function(d) { return !d.disabled; });
            var num_tooltip_series = tooltip_series.length;
            
            // Setting tooltip to appear at one location for a column
            e.pos[1] = y(tooltip_series[num_tooltip_series-1].values[e.pointIndex].y + tooltip_series[num_tooltip_series-1].values[e.pointIndex].y0) + margin.top+8;

            // Array of values to be displayed in tabular form
            e.values = tooltip_series.map(function(series){
                return {
                    key : series.key,
                    value : series.values[e.pointIndex].y
                };
            });
          }

        if (tooltips) showTooltip(e, that.parentNode);
      });

      // Update chart from a state object passed to event handler
      dispatch.on('changeState', function(e) {

        if (typeof e.disabled !== 'undefined') {
          data.forEach(function(series,i) {
            series.disabled = e.disabled[i];
          });

          state.disabled = e.disabled;
        }

        if (typeof e.stacked !== 'undefined') {
          multibar.stacked(e.stacked);
          state.stacked = e.stacked;
        }

        chart.update();
      });

      //============================================================

    });

    return chart;
  }


  //============================================================
  // Event Handling/Dispatching (out of chart's scope)
  //------------------------------------------------------------

  multibar.dispatch.on('elementMouseover.tooltip', function(e) {
    e.pos = [e.pos[0] +  margin.left, e.pos[1] + margin.top];
    dispatch.tooltipShow(e);

  });

  multibar.dispatch.on('elementMouseout.tooltip', function(e) {
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
  chart.multibar = multibar;
  chart.legend = legend;
  chart.xAxis = xAxis;
  chart.yAxis = yAxis;

  d3.rebind(chart, multibar, 'x', 'y', 'xDomain', 'yDomain', 'xRange', 'yRange', 'forceX', 'forceY', 'clipEdge',
   'id', 'stacked', 'stackOffset', 'delay', 'barColor','groupInnerPadding', 'groupOuterPadding', 'barSpacing', 'numYTicks', 'valueFormat', 'getY0');

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
    legend.color(color);
    return chart;
  };

  chart.showControls = function(_) {
    if (!arguments.length) return showControls;
    showControls = _;
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

  chart.yAxisLabelStyle = function(_) {
    if (!arguments.length) return yAxisLabelStyle;
    yAxisLabelStyle = _;
    return chart;
  };

  chart.rightAlignYAxis = function(_) {
    if(!arguments.length) return rightAlignYAxis;
    rightAlignYAxis = _;
    yAxis.orient( (_) ? 'right' : 'left');
    return chart;
  };

  chart.reduceXTicks= function(_) {
    if (!arguments.length) return reduceXTicks;
    reduceXTicks = _;
    return chart;
  };

  chart.rotateLabels = function(_) {
    if (!arguments.length) return rotateLabels;
    rotateLabels = _;
    return chart;
  };

  chart.staggerLabels = function(_) {
    if (!arguments.length) return staggerLabels;
    staggerLabels = _;
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

  chart.tooltipValueFormat = function(_) {
    if (!arguments.length) return tooltipValueFormat;
    tooltipValueFormat = _;
    return chart;
  };

  //============================================================


  return chart;
}
