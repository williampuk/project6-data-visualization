var app = function(d3, $) {
  "use strict";

  var fullData,
    pclassMap = {
      1: "Upper",
      2: "Middle",
      3: "Lower"
    },
    chartSvgs = {
      survivalChart: undefined,
      survivalStack: undefined,
      ageHistogram: undefined,
      sexChart: undefined,
      pclassChart: undefined
    },
    dataFilters = {
      ageRange: [],
      sex: [],
      pclass: []
    };

  function updateSurvivalCount(data) {
    var survived = d3.sum(data, function(d) {
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

  function updateSexCount(data) {
    var male = d3.sum(data, function(d) {
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

  function updatePclassCount(data) {
    var upper = 0,
      middle = 0,
      lower = 0;
    data.forEach(function(d) {
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

  function drawSurvivalChart(survivalData, isRedraw) {
    var margin = {
        top: 10,
        left: 50,
        bottom: 10,
        right: 35
      },
      width = 800,
      height = 100;
    var svg = isRedraw ?
      chartSvgs.survivalChart.svg :
      d3.select("div#survival")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom * 2)
      .append("g")
      .attr({
        transform: "translate(" + margin.left + "," +
          margin.top + ")",
        class: 'main-group'
      });
    // Scales
    // xScale and yScale stays the same on purpose in every redraw
    var xScale = isRedraw ? chartSvgs.survivalChart.xScale : d3.scale
      .linear()
      .domain([0, d3.max(survivalData, function(d) {
        return d.count;
      })])
      .range([0, width]);
    var yScale = isRedraw ? chartSvgs.survivalChart.yScale : d3.scale.ordinal()
      .domain(survivalData.map(function(d) {
        return d.category;
      }))
      .rangeRoundBands([0, height], 0.2);
    // Bar Groups
    var barGroups = svg.selectAll("g.bar-group")
      .data(survivalData, function(d) {
        return d.category;
      });
    if (!isRedraw) {
      barGroups = barGroups
        .enter()
        .append("g")
        .attr("class", function(d) {
          return d.category.toLowerCase() + " bar-group";
        });
    }
    barGroups.attr("transform", function(d) {
      return "translate(" + 0 + "," + yScale(d.category) + ")";
    });
    // Rect
    var barGroupsRect = isRedraw ? barGroups.select("rect.survival-data") :
      barGroups
      .append("rect")
      .attr("class", "survival-data")
      .attr("height", function(d) {
        return yScale.rangeBand();
      });
    barGroupsRect
      .attr("width", function(d) {
        return xScale(d.count);
      });
    // Text
    var barGroupsText = isRedraw ? barGroups.select("text.bar.text") :
      barGroups.append('text').attr({
        "class": "bar text",
        'alignment-baseline': 'middle'
      });
    barGroupsText.text(function(d) {
        return d.count;
      })
      .attr("transform", function(d) {
        return "translate(" + (xScale(d.count) + 5) + ", " + (yScale.rangeBand() / 2) + ")";
      });
    // Axes
    if (!isRedraw) {
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

      var yAxis = d3.svg.axis()
        .orient('left')
        .scale(yScale);

      svg.append('g')
        .attr("class", "y axis")
        .call(yAxis);
    }

    chartSvgs.survivalChart = {
      svg: svg,
      xScale: xScale,
      yScale: yScale,
      margin: margin,
      height: height,
      width: width
    };
  }

  function drawSurvivalStack(survivalData, isRedraw) {
    var margin = {
        top: 5,
        left: 20,
        bottom: 5,
        right: 2
      },
      axisPadding = 0,
      width = 80,
      barWidth = 20,
      height = 100;
    var totalCount = d3.sum(survivalData, function(d) {
      return d.count;
    });
    if (totalCount <= 0) {
      // It should not draw this graph if both counts are zero's.
      return;
    }
    // Layered Data
    var layer = d3.layout.stack()(survivalData.map(function(d) {
      return [{
        x: d.category,
        y: d.count
      }];
    }));
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
    // Scale
    var yScale = isRedraw ? chartSvgs.survivalStack.yScale : d3.scale.linear()
      .range([0, height]);
    yScale.domain([0, d3.max(layer, function(layer) {
      return layer[0].y0 + layer[0].y;
    })]);
    // Bar Groups
    var barGroups = svg.selectAll("g.bar-group")
      .data(layer, function(d, i) {
        return i;
      });
    if (!isRedraw) {
      barGroups.enter()
        .append("g")
        .attr("class", function(d) {
          return d[0].x.toLowerCase() + " bar-group";
        });
    }
    // Bar Group Rects
    var barGroupRects =
      barGroups
      .selectAll("rect.survival-data")
      .data(function(d) {
        return d;
      }, function(d) {
        return d.x;
      });
    if (!isRedraw) {
      barGroupRects
        .enter()
        .append("rect")
        .attr({
          class: "survival-data",
          x: 0,
          width: barWidth
        });
    }
    barGroupRects.attr("y", function(d, i) {
        return yScale(d.y0);
      })
      .attr("height", function(d) {
        return yScale(d.y);
      });
    // Text
    var barGroupTexts = barGroups
      .selectAll("text.bar.text")
      .data(function(d) {
        return d;
      }, function(d) {
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
    barGroupTexts.text(function(d) {
        return Math.round(survivalData.find(function(sd) {
          return sd.category === d.x;
        }).count / totalCount * 1000) / 10 + "%";
      })
      .attr("transform", function(d) {
        return "translate(" + (barWidth + 5) + ", " + (yScale(d.y0) + yScale(d.y) / 2) + ")";
      });

    chartSvgs.survivalStack = {
      svg: svg,
      xScale: null,
      yScale: yScale,
      margin: margin,
      height: height,
      width: width
    };
  }

  function drawAgeHistogram(data, isRedraw) {
    var rowsWithAge = [],
      rowsWithoutAge = [];
    data.forEach(function(d) {
      if (d.Age !== null) {
        rowsWithAge.push(d);
      } else {
        rowsWithoutAge.push(d);
      }
    });
    var margin = {
        top: 15,
        left: 30,
        bottom: 20,
        right: 2
      },
      axisPadding = 0,
      width = 1000,
      barWidth = 20,
      height = 300,
      maxAge = d3.max(rowsWithAge, function(d) {
        return d.Age;
      });
    // Scales
    // xScale is kept unchanged on purpose
    var xScale = isRedraw ? chartSvgs.ageHistogram.xScale : d3.scale.linear()
      .domain([0, maxAge + 1])
      .range([0, width]);

    var histogramData = d3.layout.histogram()
      .bins(xScale.ticks(maxAge))
      (rowsWithAge.map(function(d) {
        return d.Age;
      }));

    var yScale = isRedraw ? chartSvgs.ageHistogram.yScale : d3.scale.linear()
      .range([height, 0]);
    yScale.domain([0, d3.max(histogramData, function(d) {
      return d.y;
    })]);

    var svg = isRedraw ? chartSvgs.ageHistogram.svg : d3.select("div#age-chart")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    // debugger;
    var barGroups = svg.selectAll("g.bar-group")
      .data(histogramData, function(d) {
        return d.x;
      });
    if (!isRedraw) {
      barGroups.enter()
        .append("g")
        .attr("class", "age bar-group");
    }
    barGroups
      .attr("transform", function(d) {
        return "translate(" + xScale(d.x) + ", " + yScale(d.y) + ")";
      });
    var barGroupRects = isRedraw ? barGroups.select("rect.age-data") :
      barGroups
      .append("rect")
      .attr("class", "age-data");
    barGroupRects
      .attr("width", xScale(histogramData[0].dx) - 2)
      .attr("height", function(d) {
        return height - yScale(d.y);
      });
    // Axes
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
    chartSvgs.ageHistogram = {
      svg: svg,
      xScale: xScale,
      yScale: yScale,
      margin: margin,
      height: height,
      width: width
    };
  }

  function drawSexStack(sexData, isRedraw) {
    var totalCount = d3.sum(sexData, function(d) {
      return d.count;
    });
    if (totalCount <= 0) {
      // It should not draw this graph if both counts are zero's.
      return;
    }
    var margin = {
        top: 5,
        left: 10,
        bottom: 10,
        right: 30
      },
      width = 500,
      barHeight = 20,
      height = 30;
    var layer = d3.layout.stack()(sexData.map(function(d) {
      return [{
        x: d.category,
        y: d.count
      }];
    }));
    var svg = isRedraw ? chartSvgs.sexChart.svg : d3.select("div#sex-chart")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr({
        transform: "translate(" + margin.left + "," +
          margin.top + ")",
        class: 'main-group'
      });
    // Scale
    var xScale = isRedraw ? chartSvgs.sexChart.xScale : d3.scale.linear()
      .range([0, width]);
    xScale.domain([0, d3.max(layer, function(layer) {
      return layer[0].y0 + layer[0].y;
    })]);
    // Bar Groups
    var barGroups = svg.selectAll("g.bar-group")
      .data(layer, function(d, i) {
        return i;
      });
    if (!isRedraw) {
      barGroups.enter()
        .append("g")
        .attr("class", function(d) {
          return d[0].x.toLowerCase() + " bar-group";
        });
    }
    // Bar Group Rects
    var barGroupRects = barGroups
      .selectAll("rect")
      .data(function(d) {
        return d;
      }, function(d) {
        return d.x;
      });
    if (!isRedraw) {
      barGroupRects.enter()
        .append("rect")
        .attr("y", 0)
        .attr("height", barHeight);
    }
    barGroupRects.attr("x", function(d, i) {
        return xScale(d.y0);
      })
      .attr("width", function(d) {
        return xScale(d.y);
      });
    // Bar Group Texts
    var barGroupTexts = barGroups
      .selectAll("text.bar.text")
      .data(function(d) {
        return d;
      }, function(d) {
        return d.x;
      });
    if (!isRedraw) {
      barGroupTexts.enter()
        .append('text')
        .attr({
          "class": "bar text",
          'alignment-baseline': 'text-before-edge',
          'text-anchor': 'middle'
        });
    }
    barGroupTexts.text(function(d) {
        var count = sexData.find(function(sd) {
          return sd.category === d.x;
        }).count;
        var percentage = Math.round(count / totalCount * 1000) / 10;
        return d.x + ": " + count + " (" + percentage + "%)";
      })
      .attr("transform", function(d) {
        return "translate(" + (xScale(d.y0) + xScale(d.y) / 2) + ", " + (barHeight + 2) + ")";
      });

    chartSvgs.sexChart = {
      svg: svg,
      xScale: xScale,
      yScale: null,
      margin: margin,
      height: height,
      width: width
    };
  }

  function drawPclassChart(pclassData, isRedraw) {
    var margin = {
        top: 25,
        left: 20,
        bottom: 20,
        right: 5
      },
      width = 300,
      height = 100,
      totalCount = d3.sum(pclassData, function(d) {
        return d.count;
      });
    var svg = isRedraw ? chartSvgs.pclassChart.svg : d3.select("div#pclass-chart")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr({
        transform: "translate(" + margin.left + "," +
          margin.top + ")",
        class: 'main-group'
      });
    // Scales
    var xScale = isRedraw ? chartSvgs.pclassChart.xScale : d3.scale.ordinal()
      .domain(pclassData.map(function(d) {
        return d.category;
      }))
      .rangeRoundBands([0, width], 0.2);
    var yScale = isRedraw ? chartSvgs.pclassChart.yScale : d3.scale
      .linear()
      .range([height, 0]);
    yScale.domain([0, d3.max(pclassData, function(d) {
      return d.count;
    })]);
    var barGroups = svg.selectAll("g.bar-group")
      .data(pclassData, function(d) {
        return d.category;
      });
    if (!isRedraw) {
      barGroups.enter()
        .append("g")
        .attr("class", function(d) {
          return d.category.toLowerCase() + " bar-group";
        });
    }
    barGroups.attr("transform", function(d) {
      return "translate(" + xScale(d.category) + "," + yScale(d.count) + ")";
    });
    var barGroupRects = isRedraw ? barGroups.select("rect.pclass-data") : barGroups
      .append("rect")
      .attr("class", "pclass-data")
      .attr("width", function(d) {
        return xScale.rangeBand();
      });
    barGroupRects
      .attr("height", function(d) {
        return height - yScale(d.count);
      });
    var barGroupTexts = isRedraw ? barGroups.select("text.bar.text") : barGroups
      .append('text')
      .attr({
        "class": "bar text",
        "alignment-baseline": "after-edge",
        'text-anchor': 'middle'
      })
      .attr("transform", function(d) {
        return "translate( " + xScale.rangeBand() / 2 + ", -2)";
      });
    barGroupTexts.text(function(d) {
      return d.count + (totalCount === 0 ? "" : " (" + Math.round(d.count / totalCount * 1000) / 10 + "%)");
    });
    // Axes
    if (!isRedraw) {
      var xAxis = d3.svg.axis()
        .orient('bottom')
        .scale(xScale);

      svg.append('g')
        .attr({
          transform: 'translate(0,' + height + ')'
        })
        .attr("class", "x axis")
        .call(xAxis);
    }

    chartSvgs.pclassChart = {
      svg: svg,
      xScale: xScale,
      yScale: yScale,
      margin: margin,
      height: height,
      width: width
    };
  }

  function drawAgeHistogramBrush(data) {
    var brush = d3.svg.brush()
      .x(chartSvgs.ageHistogram.xScale)
      .on("brush", function(p) {
        console.log(brush.extent(), p);
        var extent = brush.extent();
        var ageRange = [Math.ceil(extent[0]), Math.floor(extent[1])];
        chartSvgs.ageHistogram.svg.selectAll("rect.age-data")
          .classed("dimmed", function(d) {
            return d.x < ageRange[0] || d.x >= ageRange[1];
          });
        dataFilters.ageRange = ageRange;
        redrawWithFilteredDate(chartSvgs.ageHistogram);
      })
      .on("brushend", function() {
        var extent = brush.extent();
        var startAge = Math.ceil(brush.extent()[0]);
        var endAge = Math.floor(brush.extent()[1]);
        if (endAge - startAge <= 0 || brush.empty()) {
          chartSvgs.ageHistogram.svg.selectAll("rect.age-data")
            .classed("dimmed", false);
          brush.clear();
          chartSvgs.ageHistogram.svg.select("g.x.brush").call(brush);
          dataFilters.ageRange = [];
          redrawWithFilteredDate(chartSvgs.ageHistogram);
        }
      });
    chartSvgs.ageHistogram.svg.append("g")
      .attr("class", "x brush")
      .call(brush)
      .selectAll("rect")
      .attr({
        transform: "translate(0, -2)",
        height: chartSvgs.ageHistogram.height + 2
      });
  }

  function draw(data) {
    fullData = data;
    var survivalData = updateSurvivalCount(data);
    var sexData = updateSexCount(data);
    var pclassData = updatePclassCount(data);
    drawSurvivalChart(survivalData);
    drawSurvivalStack(survivalData);
    drawAgeHistogram(data);
    drawSexStack(sexData);
    drawPclassChart(pclassData);
    drawAgeHistogramBrush(data);
  }

  function redrawWithFilteredDate(excludedCharts) {
    var data = filterData(fullData);
    var survivalData = updateSurvivalCount(data);
    var sexData = updateSexCount(data);
    var pclassData = updatePclassCount(data);

    function shouldUpdate(chart) {
      if ($.isArray(excludedCharts)) {
        return excludedCharts.indexOf(chart) < 0;
      } else {
        return excludedCharts !== chart;
      }
    }

    if (shouldUpdate(chartSvgs.survivalChart)) {
      drawSurvivalChart(survivalData, true);
    }
    if (shouldUpdate(chartSvgs.survivalStack)) {
      drawSurvivalStack(survivalData, true);
    }
    if (shouldUpdate(chartSvgs.ageHistogram)) {
      drawAgeHistogram(data, true);
    }
    if (shouldUpdate(chartSvgs.sexChart)) {
      drawSexStack(sexData, true);
    }
    if (shouldUpdate(chartSvgs.survivalChart)) {
      drawPclassChart(pclassData, true);
    }
  }

  function filterData(data) {
    return $.grep(data, function(d) {
      if (!$.isEmptyObject(dataFilters.ageRange)) {
        if (d.Age === null) {
          return false;
        } else if (d.Age < dataFilters.ageRange[0] || d.Age >= dataFilters.ageRange[1]) {
          return false;
        }
      }
      if (!$.isEmptyObject(dataFilters.sex) &&
        dataFilters.sex.indexOf(d.Sex) < 0) {
        return false;
      }
      if (!$.isEmptyObject(dataFilters.pclass) &&
        dataFilters.pclass.indexOf(d.Pclass) < 0) {
        return false;
      }
      return true;
    });
  }

  function init() {
    d3.csv('data/titanic.csv', function(row) {
      row.PassengerId = +row.PassengerId;
      row.Survived = +row.Survived;
      row.SurvivedBool = row.Survived === 1;
      row.Pclass = +row.Pclass;
      row.Age = row.Age === "" ? null : +row.Age;
      row.SibSp = +row.SibSp;
      row.Parch = +row.Parch;
      row.Fare = +row.Fare;
      return row;
    }, function(err, data) {
      draw(data);
    });
  }

  return {
    init: init
  };
}(d3, jQuery);

jQuery(app.init);
