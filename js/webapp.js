var app = function (d3, $) {
  "use strict";

  /*
    Common variables and constants
  */
  var fullData, maxAge, minAge;

  var isSexBarsClickable = false,
    isPclassBarsClickable = false,
    interactionInitialized = false;

  var survivalLabels = ["Survived", "Perished"];

  var sexLabels = ["Female", "Male"];

  var pclassMap = {
    1: "Upper",
    2: "Middle",
    3: "Lower"
  };

  var chartSvgs = {
    survivalChart: {},
    survivalStack: {},
    ageHistogram: {},
    sexChart: {},
    pclassChart: {},
    stackedAgeHistogram: {},
    stackedSexBarChart: {},
    stackedPclassBarChart: {}
  };

  var dataFilters = {
    ageRange: [],
    sex: [],
    pclass: []
  };

  /*
    Common calculation functions
  */

  function getSurvivalCount(data) {
    var survived = d3.sum(data, function (d) {
      return d.Survived;
    });
    return [{
      category: "Survived",
      count: survived
    }, {
        category: "Perished",
        count: data.length - survived
      }];
  }

  function getSexCount(data) {
    var male = d3.sum(data, function (d) {
      return +(d.Sex === "male");
    });
    return [{
      category: "Male",
      count: male
    }, {
        category: "Female",
        count: data.length - male
      }];
  }

  function getPclassCount(data) {
    var upper = 0,
      middle = 0,
      lower = 0;
    data.forEach(function (d) {
      if (d.Pclass === 1) {
        upper++;
      } else if (d.Pclass === 2) {
        middle++;
      } else {
        lower++;
      }
    });
    return [{
      category: "Lower",
      count: lower
    }, {
        category: "Middle",
        count: middle
      }, {
        category: "Upper",
        count: upper
      }];
  }

  /**
   * Draw the survival chart
   * - isRedraw flag to minimize opeartions in very redraw
   */
  function drawSurvivalChart(survivalData, isRedraw) {

    // Chart Properties
    var margin = {
      top: 0,
      left: 50,
      bottom: 32,
      right: 35
    },
      width = 800,
      height = 60;

    // Main SVG group
    var svg = isRedraw ?
      chartSvgs.survivalChart.svg :
      d3.select("div#survival")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr({
          transform: "translate(" + margin.left + "," +
          margin.top + ")",
          class: 'main-group'
        });

    // Build the  Scales
    // xScale and yScale stays the same on purpose in every redraw
    var xScale = isRedraw ? chartSvgs.survivalChart.xScale : d3.scale
      .linear()
      .domain([0, d3.max(survivalData, function (d) {
        return d.count;
      })])
      .range([0, width]);

    var yScale = isRedraw ? chartSvgs.survivalChart.yScale : d3.scale.ordinal()
      .domain(survivalData.map(function (d) {
        return d.category;
      }))
      .rangeRoundBands([0, height], 0.2);

    // Bar Groups - one group per survival result
    var barGroups = svg.selectAll("g.bar-group")
      .data(survivalData, function (d) {
        return d.category;
      });
    barGroups
      .enter()
      .append("g")
      .attr("class", function (d) {
        return d.category.toLowerCase() + " bar-group";
      });
    barGroups.attr("transform", function (d) {
      return "translate(" + 0 + "," + yScale(d.category) + ")";
    });

    // Draw the rect in every bar group
    var barGroupsRect = isRedraw ? barGroups.select("rect.survival-data") :
      barGroups
        .append("rect")
        .attr("class", "survival-data")
        .attr("height", function (d) {
          return yScale.rangeBand();
        });
    barGroupsRect
      .attr("width", function (d) {
        return xScale(d.count);
      });

    // Draw the text to show the count
    var barGroupsText = isRedraw ? barGroups.select("text.bar.text") :
      barGroups.append('text').attr({
        "class": "bar text",
        'alignment-baseline': 'middle'
      });
    barGroupsText.text(function (d) {
        return d.count;
      })
      .attr("transform", function (d) {
        return "translate(" + (xScale(d.count) + 5) + ", " + (yScale.rangeBand() / 2) + ")";
      });

    // Draw Axes
    if (!isRedraw) {

      // x axis
      var xAxis = d3.svg.axis()
        .orient('bottom')
        .scale(xScale)
        .ticks(20);

      svg.append('g')
        .attr({
          transform: 'translate(0,' + height + ')'
        })
        .attr("class", "x axis")
        .call(xAxis);

      // y axis
      var yAxis = d3.svg.axis()
        .orient('left')
        .scale(yScale);

      svg.append('g')
        .attr("class", "y axis")
        .call(yAxis);

      // x axis label
      svg.append('g')
        .attr({
          class: "x axis-label",
          transform: "translate(" + (width / 2 - 30) + ", " + (height + 30) + ")"
        })
        .append('text')
        .text('Count');
    }

    // Store the object
    chartSvgs.survivalChart.svg = svg;
    chartSvgs.survivalChart.xScale = xScale;
    chartSvgs.survivalChart.yScale = yScale;
    chartSvgs.survivalChart.margin = margin;
    chartSvgs.survivalChart.height = height;
    chartSvgs.survivalChart.width = width;
  }

  /**
   *  Draw the survival percentage bar
   */
  function drawSurvivalStack(survivalData, isRedraw) {

    // Chart Properties
    var margin = {
      top: 8,
      left: 20,
      bottom: 8,
      right: 2
    },
      axisPadding = 0,
      width = 80,
      barWidth = 20,
      height = 70;

    // Calculate total count
    var totalCount = d3.sum(survivalData, function (d) {
      return d.count;
    });
    if (totalCount <= 0) {
      // It should not draw this graph if both counts are zero's.
      return;
    }

    // Layered Data
    var layer = d3.layout.stack()(survivalData.map(function (d) {
      return [{
        x: d.category,
        y: d.count
      }];
    }));

    // Main SVG group
    var svg = isRedraw ? chartSvgs.survivalStack.svg : d3.select("div#survival-ratio")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr({
        transform: "translate(" + margin.left + "," +
        margin.top + ")",
        class: 'main-group'
      });

    // Build the y scale
    var yScale = isRedraw ? chartSvgs.survivalStack.yScale : d3.scale.linear()
      .range([0, height]);
    yScale.domain([0, d3.max(layer, function (layer) {
      return layer[0].y0 + layer[0].y;
    })]);

    // Bar Groups
    var barGroups = svg.selectAll("g.bar-group")
      .data(layer, function (d, i) {
        return i;
      });
    barGroups.enter()
      .append("g")
      .attr("class", function (d) {
        return d[0].x.toLowerCase() + " bar-group";
      });

    // Draw the Rects to each bar group
    var barGroupRects =
      barGroups
        .selectAll("rect.survival-data")
        .data(function (d) {
          return d;
        }, function (d) {
          return d.x;
        });
    barGroupRects
      .enter()
      .append("rect")
      .attr({
        class: "survival-data",
        x: 0,
        width: barWidth
      });
    barGroupRects.attr("y", function (d, i) {
      return yScale(d.y0);
    })
    .attr("height", function (d) {
      return yScale(d.y);
    });

    // Draw the text to show the percentage
    var barGroupTexts = barGroups
      .selectAll("text.bar.text")
      .data(function (d) {
        return d;
      }, function (d) {
        return d.x;
      });
    if (!isRedraw) {
      barGroupTexts
        .enter()
        .append('text')
        .attr({
          "class": "bar text",
          'alignment-baseline': 'middle'
        });
    }
    barGroupTexts.text(function (d) {
      return Math.round(survivalData.find(function (sd) {
        return sd.category === d.x;
      }).count / totalCount * 1000) / 10 + "%";
    })
    .attr("transform", function (d) {
      return "translate(" + (barWidth + 5) + ", " + (yScale(d.y0) + yScale(d.y) / 2) + ")";
    });

    // Store the object for later use
    chartSvgs.survivalStack.svg = svg;
    chartSvgs.survivalStack.xScale = null;
    chartSvgs.survivalStack.yScale = yScale;
    chartSvgs.survivalStack.margin = margin;
    chartSvgs.survivalStack.height = height;
    chartSvgs.survivalStack.width = width;
  }

  /**
   * Draw the stacked age histogram
   */
  function drawStackedAgeHistogram(data, isRedraw) {

    // Chart Properties
    var margin = {
      top: 15,
      left: 35,
      bottom: 40,
      right: 90
    },
    axisPadding = 0,
    width = 1000,
    barMargin = 1,
    barWidth = 20,
    height = 130;

    // Prepare the data for the d3 stack function
    var dataRows = [];
    dataRows = data.filter(function (d) {
      return d.Age !== null;
    });
    var survivalData = {};
    survivalData.Survived = dataRows.filter(function (d) {
      return d.Survived === 1;
    });
    survivalData.Perished = dataRows.filter(function (d) {
      return d.Survived === 0;
    });

    var layeredData = [];
    survivalLabels.forEach(function (group) {
      layeredData.push({
        name: group,
        values: d3.range(maxAge + 1).map(function (age) {
          return {
            x: age,
            y: d3.sum(survivalData[group], function (d) {
              return d.Age >= age && d.Age < age + 1 ? 1 : 0;
            })
          };
        })
      });
    });

    // Build the stacked data
    var stack = d3.layout.stack().values(function (d) { return d.values; });
    var stackedData = stack(layeredData);

    // Main SVG group
    var svg = isRedraw ? chartSvgs.stackedAgeHistogram.svg :
      d3.select('div#stacked-age-chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append("g")
        .attr({
          transform: "translate(" + margin.left + "," + margin.top + ")",
          class: 'main-group'
        });

    // Build the scales
    var xScale = isRedraw ? chartSvgs.stackedAgeHistogram.xScale : d3.scale.linear()
      .domain([0, stackedData[0].values.length])
      .range([0, width]);

    var yScale = isRedraw ? chartSvgs.stackedAgeHistogram.yScale : d3.scale.linear()
      .range([height, 0]);

    yScale.domain([0, d3.max(stackedData[stackedData.length - 1].values, function (topStack) {
      return topStack.y0 + topStack.y;
    })]);

    // Bar Group for each survival group
    var barGroups = svg.selectAll("g.bar-group")
      .data(stackedData, function (d) {
        return d.name;
      });
    barGroups.enter()
      .append("g")
      .attr("class", function (d) {
        return d.name.toLowerCase() + " bar-group";
      });

    // Draw rects in each bar groups
    var barGroupRects =
      barGroups
        .selectAll("rect.survival-per-age")
        .data(function (d) {
          return d.values;
        }, function (d) {
          return d.x;
        });

    barGroupRects
      .enter()
      .append("rect")
      .attr({
        class: "survival-per-age",
        width: xScale(1) - xScale(0) - barMargin * 2
      });

    barGroupRects.attr("x", function (d) {
        return xScale(d.x) + barMargin;
      })
      .attr("y", function (d) {
        return yScale(d.y0) - (height - yScale(d.y));
      })
      .attr("height", function (d) {
        return height - yScale(d.y);
      })
      .classed("dimmed", function (d) {
        // Dim the age group if it is filtered out
        var ageRange = dataFilters.ageRange;
        return !$.isEmptyObject(ageRange) &&
          (d.x < ageRange[0] || d.x >= ageRange[1]);
      });

    // Draw the Axes
    if (!isRedraw) {

      // x-axis not needed to redraw everytime
      var xAxis = d3.svg.axis()
        .orient("bottom")
        .ticks(16)
        .scale(xScale);
      svg.append("g")
        .attr({
          class: "x axis",
          transform: "translate(" + axisPadding + ", " + height + ")"
        })
        .call(xAxis);

      // Axis labels
      svg.append('g')
        .attr({
          class: "x axis-label",
          transform: "translate(" + (width / 2 - 60) + ", " + (height + 30) + ")"
        })
        .append('text')
        .text('Age (Class width = 1 year)');
      svg.append("g")
        .attr({
          class: "y axis-label",
          transform: "translate(-25, " + (height / 2 + 18) + ") rotate(-90)"
        })
        .append('text')
        .text('Count');
    }

    // Draw the y axis. Need to redraw with the data change everytime
    var yAxis = d3.svg.axis()
      .scale(yScale)
      .orient("left");
    var yAxisGroup = isRedraw ? svg.select("g.y.axis") :
      svg.append("g")
        .attr({
          class: "y axis",
          transform: "translate(" + (-axisPadding) + ", 0)"
        });
    yAxisGroup.call(yAxis);

    // Draw the legend
    if (!isRedraw) {
      var legendWidth = 87, legendHeight = 45;

      var legendMainGroup = svg.append('g')
        .attr({
          width: legendWidth,
          height: legendHeight
        })
        .attr('transform', 'translate(' + (width + margin.right - legendWidth - 1) + ',' + (-margin.top + 1) + ')');

      // Draw the outline border
      legendMainGroup.append('rect').attr({
        width: legendWidth,
        height: legendHeight,
        class: 'legend-box'
      });

      // Draw two labels
      var legendGroups = legendMainGroup.selectAll('g')
        .data(stackedData.map(function (d) { return d.name; }))
        .enter()
        .append('g')
        .attr('transform', function (d, i) { return 'translate(0, ' + (i * (legendHeight / 2 - 3)) + ')'; });

      // A small rect to show color
      legendGroups.append('rect')
        .attr({
          width: 12,
          height: 12,
          transform: 'translate(7, 7)'
        })
        .attr('class', function (d) {
          return d.toLowerCase() + ' legend-color';
        });

      // Text to show label
      legendGroups.append('text')
        .attr({
          transform: 'translate(24, 5)',
          class: 'legend-text',
          'alignment-baseline': 'before-edge'
        })
        .text(function (d) { return d; });
    }

    // Store the object for later use
    chartSvgs.stackedAgeHistogram.svg = svg;
    chartSvgs.stackedAgeHistogram.xScale = xScale;
    chartSvgs.stackedAgeHistogram.yScale = yScale;
    chartSvgs.stackedAgeHistogram.margin = margin;
    chartSvgs.stackedAgeHistogram.height = height;
    chartSvgs.stackedAgeHistogram.width = width;
  }

  /**
   * Draw the stacked sex bar chart
   */
  function drawStackedSexBarChart(data, isRedraw) {

    // Chart properties
    var margin = {
      top: 5,
      left: 50,
      bottom: 30,
      right: 30
    },
      width = 450,
      barHeight = 20,
      height = 40;

    // Prepare the data for d3 stack function
    var survivalData = {};
    survivalData.Survived = data.filter(function (d) {
      return d.Survived === 1;
    });
    survivalData.Perished = data.filter(function (d) {
      return d.Survived === 0;
    });
    var layeredData = [];
    survivalLabels.forEach(function (group) {
      layeredData.push({
        name: group,
        values: sexLabels.map(function (sexLabel) {
          return {
            x: sexLabel,
            y: d3.sum(survivalData[group], function (d) {
              return d.Sex === sexLabel.toLowerCase() ? 1 : 0;
            })
          };
        })
      });
    });

    // Stack the data
    var stack = d3.layout.stack().values(function (d) { return d.values; });
    var stackedData = stack(layeredData);

    // Main SVG Group
    var svg = isRedraw ? chartSvgs.stackedSexBarChart.svg :
      d3.select('div#stacked-sex-chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append("g")
        .attr({
          transform: "translate(" + margin.left + "," + margin.top + ")",
          class: 'main-group'
        });


    // Build the scales
    // x scale will change based on data change
    var xScale = isRedraw ? chartSvgs.stackedSexBarChart.xScale : d3.scale.linear()
      .range([0, width]);

    xScale.domain([0, d3.max(stackedData[stackedData.length - 1].values, function (topStack) {
      return topStack.y0 + topStack.y;
    })]);

    // y scale will not change in every redraw
    var yScale = isRedraw ? chartSvgs.stackedSexBarChart.yScale : d3.scale.ordinal()
      .domain(stackedData[0].values.map(function (d) { return d.x; }))
      .rangeRoundBands([0, height], 0.2);

    // Bar Groups for each survival data
    var barGroups = svg.selectAll("g.bar-group")
      .data(stackedData, function (d) {
        return d.name;
      });
    barGroups.enter()
      .append("g")
      .attr("class", function (d) {
        return d.name.toLowerCase() + " bar-group";
      });

    // Draw rects for each Bar Group
    var barGroupRects =
      barGroups
        .selectAll("rect.survival-per-sex")
        .data(function (d) {
          return d.values;
        }, function (d) {
          return d.x;
        });

    barGroupRects
      .enter()
      .append("rect")
      .attr({
        class: "survival-per-sex clickable",
        height: yScale.rangeBand()
      });

    barGroupRects
      .attr("x", function (d) {
        return xScale(d.y0);
      })
      .attr("width", function (d) {
        return xScale(d.y);
      })
      .attr("y", function (d) {
        return yScale(d.x);
      })
      .classed("dimmed", function (d) {
        // Dim the group if it is filtered out
        var selectedSex = dataFilters.sex;
        return !$.isEmptyObject(selectedSex) &&
          (selectedSex.indexOf(d.x.toLowerCase()) < 0);
      })
      .on('click', function (d) {
        // click event to filter the data
        if (isSexBarsClickable) {
          var sex = d.x.toLowerCase();
          if ($.isEmptyObject(dataFilters.sex)) {
            dataFilters.sex.push(sex);
          } else if (dataFilters.sex.indexOf(sex) >= 0 && dataFilters.sex.length > 1) {
            dataFilters.sex.splice(dataFilters.sex.indexOf(sex), 1);
          } else {
            dataFilters.sex = [];
          }
          redrawWithDataFilters();
        }
      });

    // Draw Axes
    var xAxis = d3.svg.axis()
      .orient("bottom")
      .scale(xScale);
    var xAxisGroup = isRedraw ? svg.select("g.x.axis") :
      svg.append("g")
        .attr({
          class: "x axis",
          transform: "translate(0, " + height + ")"
        });
    xAxisGroup.call(xAxis);

    if (!isRedraw) {
      // y axis needs to be drawn only once
      var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left");

      svg.append("g")
        .attr({
          class: "y axis"
        })
        .call(yAxis);

      // x axis label
      svg.append('g')
        .attr({
          class: "x axis-label",
          transform: "translate(" + (width / 2 - 30) + ", " + (height + 30) + ")"
        })
        .append('text')
        .text('Count');
    }

    // Store the object for later use
    chartSvgs.stackedSexBarChart.svg = svg;
    chartSvgs.stackedSexBarChart.xScale = xScale;
    chartSvgs.stackedSexBarChart.yScale = yScale;
    chartSvgs.stackedSexBarChart.margin = margin;
    chartSvgs.stackedSexBarChart.height = height;
    chartSvgs.stackedSexBarChart.width = width;
  }

  /**
   * Draw the stacked passenger class bar chart
   */
  function drawStackedPclassBarChart(data, isRedraw) {

    // chart properties
    var margin = {
      top: 5,
      left: 50,
      bottom: 30,
      right: 30
    },
      width = 450,
      barHeight = 20,
      height = 60;

    // Prepare the data for the d3 stack function
    var survivalData = {};
    survivalData.Survived = data.filter(function (d) {
      return d.Survived === 1;
    });
    survivalData.Perished = data.filter(function (d) {
      return d.Survived === 0;
    });
    var layeredData = [];
    survivalLabels.forEach(function (group) {
      layeredData.push({
        name: group,
        values: Object.keys(pclassMap).map(function (pclass) {
          return {
            x: pclassMap[+pclass],
            y: d3.sum(survivalData[group], function (d) {
              return d.Pclass === +pclass ? 1 : 0;
            })
          };
        })
      });
    });

    // Stack the data
    var stack = d3.layout.stack().values(function (d) { return d.values; });
    var stackedData = stack(layeredData);

    // Main SVG group
    var svg = isRedraw ? chartSvgs.stackedPclassBarChart.svg :
      d3.select('div#stacked-pclass-chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append("g")
        .attr({
          transform: "translate(" + margin.left + "," + margin.top + ")",
          class: 'main-group'
        });

    // Draw the scales
    // x scale will change with the data change
    var xScale = isRedraw ? chartSvgs.stackedPclassBarChart.xScale : d3.scale.linear()
      .range([0, width]);

    xScale.domain([0, d3.max(stackedData[stackedData.length - 1].values, function (topStack) {
      return topStack.y0 + topStack.y;
    })]);

    // y scale needs to be built only once
    var yScale = isRedraw ? chartSvgs.stackedPclassBarChart.yScale : d3.scale.ordinal()
      .domain(stackedData[0].values.map(function (d) { return d.x; }))
      .rangeRoundBands([0, height], 0.2);

    // Bar Group for each survival group
    var barGroups = svg.selectAll("g.bar-group")
      .data(stackedData, function (d) {
        return d.name;
      });
    barGroups.enter()
      .append("g")
      .attr("class", function (d) {
        return d.name.toLowerCase() + " bar-group";
      });

    // Draw rects for each bar group
    var barGroupRects =
      barGroups
        .selectAll("rect.survival-per-pclass")
        .data(function (d) {
          return d.values;
        }, function (d) {
          return d.x;
        });

    barGroupRects
      .enter()
      .append("rect")
      .attr({
        class: "survival-per-pclass clickable",
        height: yScale.rangeBand()
      });

    barGroupRects
      .attr("x", function (d) {
        return xScale(d.y0);
      })
      .attr("width", function (d) {
        return xScale(d.y);
      })
      .attr("y", function (d) {
        return yScale(d.x);
      })
      .classed("dimmed", function (d) {
        // Dim the rect when the clsss is filtered out
        var selectedPclasses = dataFilters.pclass;
        return !$.isEmptyObject(selectedPclasses) &&
          (selectedPclasses.indexOf(+($.grep(Object.keys(pclassMap), function (k) {
            return pclassMap[k] === d.x;
          })[0])) < 0);
      })
      .on("click", function (d) {
        // click event to filter the data
        if (isPclassBarsClickable) {
          var pclassId = +($.grep(Object.keys(pclassMap), function (k) {
            return pclassMap[k] === d.x;
          })[0]);
          if ($.isEmptyObject(dataFilters.pclass) ||
            (dataFilters.pclass.indexOf(pclassId) < 0 && dataFilters.pclass.length < 2)) {
            dataFilters.pclass.push(pclassId);
          } else if (dataFilters.pclass.indexOf(pclassId) >= 0 && dataFilters.pclass.length > 1) {
            dataFilters.pclass.splice(dataFilters.pclass.indexOf(pclassId), 1);
          } else {
            dataFilters.pclass = [];
          }
          dataFilters.pclass.sort();
          redrawWithDataFilters();
        }
      });

    // Draw the Axes

    // x-axis will change with data change
    var xAxis = d3.svg.axis()
      .orient("bottom")
      .scale(xScale);
    var xAxisGroup = isRedraw ? svg.select("g.x.axis") :
      svg.append("g")
        .attr({
          class: "x axis",
          transform: "translate(0, " + height + ")"
        });
    xAxisGroup.call(xAxis);

    if (!isRedraw) {
      // y axis needs to be drawn once only
      var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left");

      svg.append("g")
        .attr({
          class: "y axis"
        })
        .call(yAxis);

      // Draw the x-axis label
      svg.append('g')
        .attr({
          class: "x axis-label",
          transform: "translate(" + (width / 2 - 30) + ", " + (height + 30) + ")"
        })
        .append('text')
        .text('Count');
    }

    // Store the object for later use
    chartSvgs.stackedPclassBarChart.svg = svg;
    chartSvgs.stackedPclassBarChart.xScale = xScale;
    chartSvgs.stackedPclassBarChart.yScale = yScale;
    chartSvgs.stackedPclassBarChart.margin = margin;
    chartSvgs.stackedPclassBarChart.height = height;
    chartSvgs.stackedPclassBarChart.width = width;
  }

  /**
   * Draw the brush for age selection
   */
  function drawAgeHistogramBrush() {
    // D3 brush object
    var brush = d3.svg.brush()
      .x(chartSvgs.stackedAgeHistogram.xScale)
      .on("brush", function (p) {
        // Change the data selection with the brush move
        var extent = brush.extent();
        dataFilters.ageRange = [Math.ceil(extent[0]), Math.floor(extent[1])];
        redrawWithDataFilters();
      })
      .on("brushend", function () {
        // when brush end, check if the selected area is valid
        // clear the brush if it is invalid
        var extent = brush.extent();
        var startAge = Math.ceil(brush.extent()[0]);
        var endAge = Math.floor(brush.extent()[1]);
        if (endAge - startAge <= 0 || brush.empty()) {
          brush.clear();
          chartSvgs.stackedAgeHistogram.svg.select("g.x.brush").call(brush);
          dataFilters.ageRange = [];
          redrawWithDataFilters();
        }
      });

    // append the group can call the brush
    chartSvgs.stackedAgeHistogram.svg.append("g")
      .attr("class", "x brush")
      .call(brush)
      .selectAll("rect")
      .attr({
        transform: "translate(0, -2)",
        height: chartSvgs.stackedAgeHistogram.height + 2
      });
    chartSvgs.stackedAgeHistogram.brush = brush;
  }

  /**
   * Initialize the interaction
   * (do it when narrative completes)
   */
  function initInteraction() {
    if (interactionInitialized) {
      return;
    }

    // make bars clickable
    isSexBarsClickable = true;
    isPclassBarsClickable = true;

    // draw the brush
    drawAgeHistogramBrush();

    // init the reset selection button
    d3.select('#reset-filter')
      .classed('hidden', false)
      .on('click', function () {
        dataFilters.ageRange = [];
        dataFilters.sex = [];
        dataFilters.pclass = [];
        var brush = chartSvgs.stackedAgeHistogram.brush;
        if (brush) {
          brush.clear();
          chartSvgs.stackedAgeHistogram.svg.select("g.x.brush").call(brush);
        }
        redrawWithDataFilters();
      });

    // display the help text
    d3.selectAll(".interaction-help-text")
      .classed("hidden", false);

    // display the dismissable explanation
    var explainDiv = d3.select('#interaction-explain')
      .classed('hidden', false);
    d3.select('#interaction-explain button.close')
      .on('click', function () {
        explainDiv.classed('hidden', true);
        explainDiv = null;
      });

    // turn on the flag to mark initialized
    interactionInitialized = true;
  }

  /**
   * Fitler data and redraw all charts
   */
  function redrawWithDataFilters(excludedCharts) {
    var filteredData = filterData(fullData);
    var filteredSurvivalData = getSurvivalCount(filteredData);

    function shouldUpdate(chart) {
      if ($.isArray(excludedCharts)) {
        return excludedCharts.indexOf(chart) < 0;
      } else {
        return excludedCharts !== chart;
      }
    }

    drawDataLabels(filteredData);

    if (shouldUpdate(chartSvgs.survivalChart)) {
      drawSurvivalChart(filteredSurvivalData, true);
    }
    if (shouldUpdate(chartSvgs.survivalStack)) {
      drawSurvivalStack(filteredSurvivalData, true);
    }
    if (shouldUpdate(chartSvgs.stackedAgeHistogram)) {
      drawStackedAgeHistogram(filterData(fullData, ['Age']), true);
    }
    if (shouldUpdate(chartSvgs.stackedSexBarChart)) {
      drawStackedSexBarChart(filterData(fullData, ['Sex']), true);
    }
    if (shouldUpdate(chartSvgs.stackedPclassBarChart)) {
      drawStackedPclassBarChart(filterData(fullData, ['Pclass']), true);
    }
  }

  /**
   *  Filter the data based on dataFilters
   *  excludedFields allows specifying which filters to exclude
   */
  function filterData(data, excludedFields) {
    if (!excludedFields) {
      excludedFields = [];
    }
    return $.grep(data, function (d) {
      if (excludedFields.indexOf('Age') && !$.isEmptyObject(dataFilters.ageRange)) {
        if (d.Age === null) {
          return false;
        } else if (d.Age < dataFilters.ageRange[0] || d.Age >= dataFilters.ageRange[1]) {
          return false;
        }
      }
      if (excludedFields.indexOf('Sex') && !$.isEmptyObject(dataFilters.sex) &&
        dataFilters.sex.indexOf(d.Sex) < 0) {
        return false;
      }
      if (excludedFields.indexOf('Pclass') && !$.isEmptyObject(dataFilters.pclass) &&
        dataFilters.pclass.indexOf(d.Pclass) < 0) {
        return false;
      }
      return true;
    });
  }

  /**
   * Fill in the number of data, mainly for narratives text
   */
  function initDrawDataLabels() {
    var numOfSamplesWithAge = $.grep(fullData, function (d) {
      return d.Age !== null;
    }).length;
    d3.selectAll(".rows-of-dataset").html(fullData.length);
    d3.selectAll(".rows-of-age-data").html(numOfSamplesWithAge);
  }

  /**
   * Calculate and set the number of data to the current data selection info panel
   */
  function drawDataLabels(data) {
    d3.selectAll(".current-rows-of-dataset").html(data.length);

    // Calculate the  age range filter
    var ageRange = dataFilters.ageRange;
    if ($.isEmptyObject(ageRange) || !$.isArray(ageRange)) {
      d3.selectAll(".age-not-restricted-label").classed("hidden", false);
      d3.selectAll(".age-range").classed("hidden", true);
    } else {
      d3.selectAll(".age-not-restricted-label").classed("hidden", true);
      d3.selectAll(".age-range").classed("hidden", false);
      d3.selectAll(".lower-age").html(ageRange[0]);
      d3.selectAll(".upper-age").html(ageRange[1]);
    }

    // Calculate the sex filter
    var sex = dataFilters.sex;
    if ($.isEmptyObject(sex) || !$.isArray(sex)) {
      d3.selectAll(".sex-not-restricted-label").classed("hidden", false);
      d3.selectAll(".selected-sex-label").classed("hidden", true);
    } else {
      d3.selectAll(".sex-not-restricted-label").classed("hidden", true);
      d3.selectAll(".selected-sex-label").classed("hidden", false);
      d3.selectAll(".selected-male-label").classed("hidden", sex.indexOf("male") < 0);
      d3.selectAll(".selected-female-label").classed("hidden", sex.indexOf("female") < 0);
    }

    // Calculate the passenger class filter
    var pclass = dataFilters.pclass;
    if ($.isEmptyObject(pclass) || !$.isArray(pclass)) {
      d3.selectAll(".pclass-not-restricted-label").classed("hidden", false);
      d3.selectAll("#selected-pclass-label").classed("hidden", true);
    } else if ($.isArray(pclass)) {
      d3.selectAll(".pclass-not-restricted-label").classed("hidden", true);
      d3.select("#selected-pclass-label").classed("hidden", false);
      d3.select("#selected-pclass-label")
        .selectAll("span")
        .remove();
      d3.select("#selected-pclass-label")
        .selectAll("span")
        .data(pclass.sort(), function (d) {
          return d;
        })
        .enter()
        .append("span")
        .html(function (d) {
          return pclassMap[d] + '<span class="comma">, </span>';
        });
    }
  }

  /**
   * Perform the narratives
   */
  function performNarrativeAnimation(callback) {
    // Each narrative objects corresponds to a DOM to display
    // the timeout, what to do, what to waitFor
    var ageNarrative = [{
        id: "narrative-0",
        timeout: 3000
      }, {
        id: "narrative-1",
        timeout: 5000
      }, {
        id: "narrative-2",
        timeout: 8000
      }, {
        id: "narrative-3",
        timeout: 5000
      }, {
        id: "narrative-4",
        timeout: 3000,
        toAge: 10,
        toAgeSpeed: 300
      }, {
        id: "narrative-5",
        timeout: 4000,
        waitFor: function () {
          return waitFor.ageAnimateEnd;
        }
      }, {
        id: "narrative-6",
        timeout: 3000,
        toAge: maxAge + 1
      }, {
        id: "narrative-7",
        timeout: 6000
      }, {
        id: "narrative-8",
        timeout: 3000
      }, {
        id: "narrative-9",
        timeout: 3000,
        waitFor: function () {
          return waitFor.ageAnimateEnd;
        }
      }, {
        id: "narrative-10",
        timeout: 4000,
        before: function () {
          dataFilters.ageRange = [];
          redrawWithDataFilters();
        }
      }, {
        id: "narrative-11",
        timeout: 6000,
        sex: ["male"]
      }, {
        id: "narrative-12",
        timeout: 3000,
        sex: ["female"]
      }, {
        id: "narrative-13",
        timeout: 4000,
        sex: ["female"]

      }, {
        id: "narrative-14",
        timeout: 4000,
        before: function () {
          dataFilters.sex = [];
          redrawWithDataFilters();
        }
      }, {
        id: "narrative-15",
        timeout: 6000,
        pclass: [3]
      }, {
        id: "narrative-16",
        timeout: 6000,
        pclass: [2]
      }, {
        id: "narrative-17",
        timeout: 3000,
        pclass: [1]
      }, {
        id: "narrative-18",
        timeout: 4000,
        pclass: [1]
      }, {
        id: "narrative-19",
        timeout: 4000,
        before: function () {
          dataFilters.pclass = [];
          redrawWithDataFilters();
        }
      }, {
        id: "narrative-20",
        timeout: 5000,
        before: function () {
          redrawWithDataFilters();
          initInteraction();
        }
      }];
    // For debug, use ageNarrative = []; to skip
    var currCount = 0;
    var waitFor = {};

    // Do the narrative animation
    // It will return after all steps are done.
    function doAnimate() {
      var currNarrative = ageNarrative[currCount++];
      if (!currNarrative) {
        endNarrative();
        return;
      }
      if (typeof currNarrative.waitFor === "function") {
        if (!currNarrative.waitFor()) {
          currCount--;
          setTimeout(doAnimate, 100);
          return;
        }
      }
      d3.selectAll("#narrative > div.show")
        .classed("show", false);

      d3.select("#" + currNarrative.id)
        .classed("show", true)
        .attr("opacity", 0)
        .transition()
        .duration(1000)
        .attr("opacity", 100);
      if (typeof currNarrative.before === "function") {
        currNarrative.before();
      }
      if (currNarrative.toAge) {
        waitFor.ageAnimateEnd = false;
        if ($.isEmptyObject(dataFilters.ageRange)) {
          dataFilters.ageRange = [0, 1];
          redrawWithDataFilters();
        }
        var currAgeUpperLimit = dataFilters.ageRange[1];
        var increaseAgeInterval = setInterval(function () {
          dataFilters.ageRange[1] += 1;
          redrawWithDataFilters();

          if (dataFilters.ageRange[1] >= currNarrative.toAge) {
            clearInterval(increaseAgeInterval);
            waitFor.ageAnimateEnd = true;
          }
        }, currNarrative.toAgeSpeed ? currNarrative.toAgeSpeed : 100);
      }
      if ($.isArray(currNarrative.sex)) {
        dataFilters.sex = currNarrative.sex.slice();
        redrawWithDataFilters();
      }
      if ($.isArray(currNarrative.pclass)) {
        dataFilters.pclass = currNarrative.pclass.slice();
        redrawWithDataFilters();
      }
      setTimeout(doAnimate, currNarrative.timeout);
    }

    // Starting point
    function startNarrative() {
      d3.select("#narrative-panel").classed("hidden", false);
      doAnimate();
    }

    // Ending point, call the passed-in callback
    function endNarrative() {
      d3.select("#narrative-panel").classed("hidden", true);
      if (typeof callback === "function") {
        callback();
      }
    }

    // Delay 100ms before starting the narratives
    setTimeout(startNarrative, 100);
  }

  /**
   * The main drawing function
   */
  function draw(data) {
    fullData = data;
    maxAge = d3.max(fullData, function (d) {
      return d.Age;
    });
    minAge = d3.min(fullData, function (d) {
      return d.Age;
    });

    // Draw labels
    initDrawDataLabels();
    drawDataLabels(data);

    // Draw the main survival section
    var survivalData = getSurvivalCount(data);
    drawSurvivalChart(survivalData);
    drawSurvivalStack(survivalData);

    // Draw the 3 attribute charts
    drawStackedAgeHistogram(data);
    drawStackedSexBarChart(data);
    drawStackedPclassBarChart(data);

    // Star the narratives
    performNarrativeAnimation(function () {
      initInteraction();
    });
  }

  /*
   * The main entry init point
   */
  function init() {
    d3.csv('data/titanic.csv', function (row) {
      row.PassengerId = +row.PassengerId;
      row.Survived = +row.Survived;
      row.SurvivedBool = row.Survived === 1;
      row.Pclass = +row.Pclass;
      row.Age = row.Age === "" ? null : +row.Age;
      row.SibSp = +row.SibSp;
      row.Parch = +row.Parch;
      row.Fare = +row.Fare;
      return row;
    }, function (err, data) {
      draw(data);
    });
  }

  return {
    init: init
  };
} (d3, jQuery);

jQuery(app.init);
