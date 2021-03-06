nv.models.vxLegend = function() {
  "use strict";
  //============================================================
  // Public Variables with Default Settings
  //------------------------------------------------------------

  var margin = {top: 5, right: 0, bottom: 5, left: 0},
      width = 400,
      height = 20,
      getKey = function(d) { return d.key; },
      color = nv.utils.defaultColor(),
      align = true,
      orientation = 'top',
      rightAlign = true,
      updateState = true,   //If true, legend will update data.disabled and trigger a 'stateChange' dispatch.,
      radioButtonMode = false,   //If true, clicking legend items will cause it to behave like a radio button. (only one can be selected at a time),
      dispatch = d3.dispatch('legendClick', 'legendDblclick', 'legendMouseover', 'legendMouseout', 'stateChange'),
      defaultStyle = 1,
      getLegendStyle = function(d){ return d.legendStyle || defaultStyle; },
      legendPosY = null
    ;

  //============================================================

  var vSeparation = 20, maxLength=20;
  // Word-wrap function
  function wordwrap(text, max){
      var regex = new RegExp(".{0,"+max+"}(?:\\s|$)","g");
      var lines = [];

      var line;
      //GOLD//while((line = regex.exec(text))!=""){
      //GOLD//    lines.push(line);
      //GOLD//}
      while((line = regex.exec(text))){
          if(line[0].length === 0) break;
          lines.push(line);
      }
      return lines;
  }

  function chart(selection) {
    selection.each(function(data) {
      var availableWidth = width - margin.left - margin.right,
          availableHeight = height - margin.top - margin.bottom,
          container = d3.select(this);


      //------------------------------------------------------------
      // Setup containers and skeleton of chart

      var wrap = container.selectAll('g.nv-legend').data([data]);
      var gEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-legend').append('g');
      var g = wrap.select('g');

      wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      //------------------------------------------------------------

      var series = g.selectAll('.nv-series')
          .data(function(d) { return d; });
      var seriesEnter = series.enter().append('g').attr('class', function(d,i){ return 'nv-series nv-legendStyle-'+getLegendStyle(d);})
          .on('mouseover', function(d,i) {
            dispatch.legendMouseover(d,i);  //TODO: Make consistent with other event objects
          })
          .on('mouseout', function(d,i) {
            dispatch.legendMouseout(d,i);
          })
          .on('click', function(d,i) {
            dispatch.legendClick(d,i);
            if (updateState) {
               if (radioButtonMode) {
                   //Radio button mode: set every series to disabled,
                   //  and enable the clicked series.
                   data.forEach(function(series) { series.disabled = true; });
                   d.disabled = false;
               }
               else {
                   d.disabled = !d.disabled;
                   if (data.every(function(series) { return series.disabled; })) {
                       //the default behavior of NVD3 legends is, if every single series
                       // is disabled, turn all series' back on.
                       data.forEach(function(series) { series.disabled = false; });
                   }
               }
               dispatch.stateChange({
                  disabled: data.map(function(d) { return !!d.disabled; })
               });
            }
          })
          .on('dblclick', function(d,i) {
            dispatch.legendDblclick(d,i);
            if (updateState) {
                //the default behavior of NVD3 legends, when double clicking one,
                // is to set all other series' to false, and make the double clicked series enabled.
                data.forEach(function(series) {
                   series.disabled = true;
                });
                d.disabled = false; 
                dispatch.stateChange({
                    disabled: data.map(function(d) { return !!d.disabled; })
                });
            }
          });

      // Legend Style 1
      seriesEnter.filter('.nv-legendStyle-1')
          .append('rect')
          .attr('width', 20)
          .attr('height', 12)
          .attr('x', 0)
          .attr('y', -6)
          .attr('rx', 1)
          .attr('ry', 1)
          .style('stroke-width', 2)
          .attr('class','nv-legend-symbol')
          ;
      seriesEnter.filter('.nv-legendStyle-1')
          .append('text')
          .attr('text-anchor', 'start')
          .attr('class','nv-legend-text')
          .attr('dy', '.32em')
          .attr('dx', '30')
          ;

      // Legend Style 2
      seriesEnter.filter('.nv-legendStyle-2')
          .append('circle')
          .style('stroke-width', 2)
          .attr('class','nv-legend-symbol')
          .attr('cx', 8)
          .attr('r', 8);
      seriesEnter.filter('.nv-legendStyle-2')
          .append('text')
          .attr('text-anchor', 'start')
          .attr('class','nv-legend-text')
          .attr('dy', '.32em')
          .attr('dx', '25')
          ;

      // Legend Style 3
      seriesEnter.filter('.nv-legendStyle-3')
          .append('path')
          // Assuming Area of circle = Area of polygon (6.3 = Math.sqrt(Math.PI*5*5/2))
          .attr('d', function(d,i){return "M0,0 l9,-9 l9,9 l-9,9 l-9,-9";})
          .attr('style', "fill-rule: nonzero;")
          .style('stroke-width', 2)
          .attr('class','nv-legend-symbol');
      seriesEnter.filter('.nv-legendStyle-3')
          .append('text')
          .attr('text-anchor', 'start')
          .attr('class','nv-legend-text')
          .attr('dy', '.32em')
          .attr('dx', '25')
          ;

      // Legend Style 3
      seriesEnter.filter('.nv-legendStyle-4')
          .append('circle')
          .style('stroke-width', 2)
          .attr('class','nv-legend-symbol')
          .attr('cx', 15)
          .attr('r', 7);
      seriesEnter.filter('.nv-legendStyle-4')
          .append('line')
          .attr('x1', 0)
          .attr('x2', 30)
          .attr('y1', 0)
          .attr('y2', 0)
          .style('stroke-width', 2)
          .attr('class','nv-legend-symbol');
      seriesEnter.filter('.nv-legendStyle-4')
          .append('text')
          .attr('text-anchor', 'start')
          .attr('class','nv-legend-text')
          .attr('dy', '.32em')
          .attr('dx', '38')
          ;

      // Legend Style 5
      seriesEnter.filter('.nv-legendStyle-5')
          .append('rect')
          .attr('width', 20)
          .attr('height', 12)
          .attr('x', 0)
          .attr('y', -6)
          .attr('rx', 1)
          .attr('ry', 1)
          .style('stroke-width', 2)
          .attr('class','nv-legend-symbol')
          ;
      seriesEnter.filter('.nv-legendStyle-5')
          .append('text')
          .attr('text-anchor', 'middle')
          .attr('class','nv-legend-text')
          //GOLD//.attr('dy', '.32em')
          //GOLD//.attr('dx', '30')
          //.attr('dy', '25')
          //.attr('dx', '30')
          //.attr('x', 10)
          .attr('y', 4)
          ;

      series.classed('disabled', function(d) { return d.disabled; });
      series.exit().remove();
      series.select('circle')
          .style('fill', function(d,i) { return d.color || color(d,i); })
          .style('stroke', function(d,i) { return d.color || color(d, i); });
      series.select('line')
          .style('fill', function(d,i) { return d.color || color(d,i); })
          .style('stroke', function(d,i) { return d.color || color(d, i); });
      series.select('rect')
          .style('fill', function(d,i) { return d.color || color(d,i); })
          .style('stroke', function(d,i) { return d.color || color(d, i); });
      series.select('path')
          .style('fill', function(d,i) { return d.color || color(d,i); })
          .style('stroke', function(d,i) { return d.color || color(d, i); });
      //GOLD//series.select('text').text(getKey);

      // TODO : Currently this is just a hack
      if (orientation === 'bottom'){
          series.select('text').each(function(d){
              //var lines = wordwrap('this is a test in the rain and its going to snow later', maxLength);
              var lines = wordwrap(getKey(d), maxLength);
              d3.select(this).selectAll('tspan').data(lines)
                .enter()
                .append('tspan')
                .attr('x', 10)
                .attr('dy', vSeparation)
                .text(function(d){ return d; });

          });
      } else {
          series.select('text').text(getKey);
      }
      
      //TODO: implement fixed-width and max-width options (max-width is especially useful with the align option)

      // NEW ALIGNING CODE, TODO: clean up
      var seriesWidths = [];
      var seriesHeights = [];
      var seriesPerRow = 0;
      var legendWidth = 0;
      var columnWidths = [];
      var rowHeights = [];
      var rowOffsets = [];
      var seriesPerColumn = 0;
      var legendHeight = 0;
      var columnHeights = [];
      var columnOffsets = [];
      var xPositions = [];
      var yPositions = [];
      var k, i;
      var curX, curY;
      var cwr = function(prev, cur, index, array){
          return prev + cur;
      };


      if (align && (orientation === 'top')) {

        series.each(function(d,i) {
              var legendText = d3.select(this).select('text');
              var nodeTextLength;
              try {
                nodeTextLength = legendText.node().getComputedTextLength();
              }
              catch(e) {
                nodeTextLength = nv.utils.calcApproxTextWidth(legendText);
              }
           
              var padding;
              switch(getLegendStyle(d)){
                  case 1:
                      padding = 40;
                      break;
                  case 2:
                      padding = 35;
                      break;
                  case 3:
                      padding = 35;
                      break;
                  case 4:
                      padding = 48;
                      break;
                  default:
                      padding = 35;
                      break;
              }
              seriesWidths.push(nodeTextLength + padding); // padding is based on the style of the legend
            });

        while ( legendWidth < availableWidth && seriesPerRow < seriesWidths.length) {
          columnWidths[seriesPerRow] = seriesWidths[seriesPerRow];
          legendWidth += seriesWidths[seriesPerRow++];
        }
        if (seriesPerRow === 0) seriesPerRow = 1; //minimum of one series per row

        while ( legendWidth > availableWidth && seriesPerRow > 1 ) {
          columnWidths = [];
          seriesPerRow--;

          for (k = 0; k < seriesWidths.length; k++) {
            if (seriesWidths[k] > (columnWidths[k % seriesPerRow] || 0) )
              columnWidths[k % seriesPerRow] = seriesWidths[k];
          }

          legendWidth = columnWidths.reduce(cwr);
        }

        for (i = 0, curX = 0; i < seriesPerRow; i++) {
            xPositions[i] = curX;
            curX += columnWidths[i];
        }

        series
            .attr('transform', function(d, i) {
              return 'translate(' + xPositions[i % seriesPerRow] + ',' + (5 + Math.floor(i / seriesPerRow) * 20) + ')';
            });

        //position legend as far right as possible within the total width
        if (rightAlign) {
           g.attr('transform', 'translate(' + (width - margin.right - legendWidth) + ',' + margin.top + ')');
        }
        else {
           g.attr('transform', 'translate(0' + ',' + margin.top + ')');
        }

        height = margin.top + margin.bottom + (Math.ceil(seriesWidths.length / seriesPerRow) * 20);

      } else if (align && (orientation === 'bottom')) {

          // BOTTOM ORIENTATION //
        series.each(function(d,i) {
              var legendText = d3.select(this).select('text');
              var nodeTextLength;
              var nodeTextHeight;
              try {
                //GOLD//nodeTextLength = legendText.node().getComputedTextLength();
                nodeTextLength = legendText.node().getBBox().width;
                nodeTextHeight = legendText.node().getBBox().height;
              }
              catch(e) {
                nodeTextLength = nv.utils.calcApproxTextWidth(legendText);
                // TODO : Change this default
                nodeTextHeight = 10;
              }
           
              var padding;
              switch(getLegendStyle(d)){
                  case 1:
                      padding = 40;
                      break;
                  case 2:
                      padding = 35;
                      break;
                  case 3:
                      padding = 35;
                      break;
                  case 4:
                      padding = 48;
                      break;
                  default:
                      padding = 35;
                      break;
              }
              //GOLD//seriesWidths.push(nodeTextLength + padding); // padding is based on the style of the legend
              // TODO : Not using the horizontal padding for the text
              seriesWidths.push(nodeTextLength); // padding is based on the style of the legend
              seriesHeights.push(nodeTextHeight); // TODO There is no padding in height
            });

        while ( legendWidth < availableWidth && seriesPerRow < seriesWidths.length) {
          columnWidths[seriesPerRow] = seriesWidths[seriesPerRow];
          legendWidth += seriesWidths[seriesPerRow++];
        }
        if (seriesPerRow === 0) seriesPerRow = 1; //minimum of one series per row

        while ( legendWidth > availableWidth && seriesPerRow > 1 ) {
          columnWidths = [];
          seriesPerRow--;

          for (k = 0; k < seriesWidths.length; k++) {
            if (seriesWidths[k] > (columnWidths[k % seriesPerRow] || 0) )
              columnWidths[k % seriesPerRow] = seriesWidths[k];
          }

          legendWidth = columnWidths.reduce(cwr);
        }

        // Compute each row max height/offset
        for(i=0; i<(seriesHeights.length/seriesPerRow); i++){
            rowHeights[i] = 0;
        }
        for(i=0; i<seriesHeights.length; i++){
            if (rowHeights[i/seriesPerRow] < seriesHeights[i]){
                rowHeights[i/seriesPerRow] = seriesHeights[i];
            }

        }
        // Compute the row offsets
        rowOffsets[0] = 0;
        for(i=1; i<(seriesHeights.length/seriesPerRow); i++){
            //rowOffsets[i] = rowHeights[i-1] + rowOffsets[i-1] + 12 + 4 + 14;
            rowOffsets[i] = rowHeights[i-1] + rowOffsets[i-1] + 12 + 18;
        }
        // DONE

        var temp = (availableWidth-margin.left-margin.right)/seriesPerRow;
        for (i = 0; i < seriesPerRow; i++) {
            // TODO : This is restrictive to Style= 5, i.e., a rectangle as '10' is '20/2'
            xPositions[i] = i*temp + temp/2 - 10;
        }

        series
            .attr('transform', function(d, i) {
              return 'translate(' + xPositions[i % seriesPerRow] + ',' + (rowOffsets[parseInt(i/seriesPerRow, 10)]) + ')';
            });

        //position legend as far right as possible within the total width
        if (rightAlign) {
            // height of the legend will be rowOffsets[rowOffsets.length-1] + 30. '30' is the extra which is added as padding to every height
            var y_pos = legendPosY || height - margin.bottom - rowOffsets[rowOffsets.length-1] + 30; 
            g.attr('transform', 'translate(' + (margin.left) + ',' + y_pos + ')');
        }
        else {
           g.attr('transform', 'translate(0' + ',' + margin.top + ')');
        }

        //height = margin.top + margin.bottom + (Math.ceil(seriesWidths.length / seriesPerRow) * 20) + 40;
        //GOLD//height = margin.top + margin.bottom + (rowOffsets[rowOffsets.length-1]-30);
        height = legendPosY ? (height-legendPosY) : margin.top + margin.bottom + (rowOffsets[rowOffsets.length-1]-30);

      } else if (align && (orientation === 'right')) {

        // THIS IS A TEST CODE TO VERTICALLY ALIGN ALONG THE RIGHT SIDE
        series.each(function(d,i) {
              var legendText = d3.select(this).select('text');
              var nodeTextLength;
              try {
                nodeTextLength = legendText.node().getComputedTextLength();
              }
              catch(e) {
                nodeTextLength = nv.utils.calcApproxTextWidth(legendText);
              }
           
              var padding;
              switch(getLegendStyle(d)){
                  case 1:
                      padding = 40;
                      break;
                  case 2:
                      padding = 35;
                      break;
                  case 3:
                      padding = 35;
                      break;
                  case 4:
                      padding = 48;
                      break;
                  default:
                      padding = 35;
                      break;
              }
              seriesWidths.push(nodeTextLength + padding); // padding is based on the style of the legend
            });

        // PK: Initialize with each series in its own row!!!
        while ( legendHeight < availableHeight && seriesPerColumn < seriesWidths.length) {
          columnHeights[seriesPerColumn] = 30;
          legendHeight += 30;
          seriesPerColumn++;
        }
        if (seriesPerColumn === 0) seriesPerColumn = 1; //minimum of one series per column

        // Code for vertical alignment
        columnOffsets[0] = 0;
        legendWidth = d3.max(seriesWidths);
        if(legendHeight > availableHeight){
            seriesPerColumn = Math.floor(availableHeight/30);
            legendHeight = 30*seriesPerColumn;
            legendWidth = 0;
            
            columnOffsets[0] = 0;
            var loop_count = seriesWidths.length/seriesPerColumn;
            if(seriesWidths.length%seriesPerColumn === 0) loop_count++;
            for(k=0; k<loop_count; k++){
                var curColumnWidth = d3.max(seriesWidths.slice(k*seriesPerColumn, (k+1)*seriesPerColumn-1));
                columnOffsets[k+1] = columnOffsets[k]+curColumnWidth;
                legendWidth += curColumnWidth;
            }
        }

        for (i = 0, curY = 0; i < seriesPerColumn; i++) {
            yPositions[i] = curY;
            curY += 30;
        }

        series
            .attr('transform', function(d, i) {
              var xOffset;
              switch(getLegendStyle(d)){
                  case 1:
                      xOffset = -10;
                      break;
                  case 2:
                      xOffset = -8;
                      break;
                  case 3:
                      xOffset = -9;
                      break;
                  case 4:
                      xOffset = -15;
                      break;
                  default:
                      xOffset = -8;
                      break;
              }
              return 'translate(' + (xOffset + columnOffsets[Math.floor(i / seriesPerColumn)]) + ',' + yPositions[i % seriesPerColumn] + ')';
            });

        //position legend as far right as possible within the total width
        if (rightAlign) {
           g.attr('transform', 'translate(' + (width - margin.right - legendWidth) + ',' + (margin.top+20) + ')');
        }
        else {
           g.attr('transform', 'translate(0' + ',' + margin.top + ')');
        }

        // TODO: Not sure of this!!!
        //height = margin.top + margin.bottom + (Math.ceil(seriesWidths.length / seriesPerColumn) * 20);
        height = margin.top + margin.bottom + 20;
        width = legendWidth + 40; // Some padding

      } else {

        var ypos = 5,
            newxpos = 5,
            maxwidth = 0,
            xpos;
        series
            .attr('transform', function(d, i) {
              var length = d3.select(this).select('text').node().getComputedTextLength() + 28;
              xpos = newxpos;

              if (width < margin.left + margin.right + xpos + length) {
                newxpos = xpos = 5;
                ypos += 20;
              }

              newxpos += length;
              if (newxpos > maxwidth) maxwidth = newxpos;

              return 'translate(' + xpos + ',' + ypos + ')';
            });

        //position legend as far right as possible within the total width
        g.attr('transform', 'translate(' + (width - margin.right - maxwidth) + ',' + margin.top + ')');

        height = margin.top + margin.bottom + ypos + 15;

      }


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

  chart.align = function(_) {
    if (!arguments.length) return align;
    align = _;
    return chart;
  };

  chart.orientation = function(_) {
    if (!arguments.length) return orientation;
    orientation = _;
    return chart;
  };

  chart.rightAlign = function(_) {
    if (!arguments.length) return rightAlign;
    rightAlign = _;
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

  chart.defaultStyle = function(_) {
    if (!arguments.length) return defaultStyle;
    defaultStyle = _;
    return chart;
  };

  chart.legendPosY = function(_) {
    if (!arguments.length) return legendPosY;
    legendPosY = _;
    return chart;
  };

  //============================================================


  return chart;
}
