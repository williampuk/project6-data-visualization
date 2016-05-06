var app = function(d3, $) {
  "use strict";

  var fullData, maxAge, minAge;

  var isSexLabelClickable = false, isPclassLabelClickable = false;

  var pclassMap = {
    1: "Upper",
    2: "Middle",
    3: "Lower"
  };

  var chartSvgs = {
    survivalChart: undefined,
    survivalStack: undefined,
    ageHistogram: undefined,
    sexChart: undefined,
    pclassChart: undefined
  };

  var dataFilters = {
    ageRange: [],
    sex: [],
    pclass: []
  };

  function getSurvivalCount(data) {
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

  function getSexCount(data) {
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

  function getPclassCount(data) {
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
        top: 0,
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
        top: 10,
        left: 20,
        bottom: 10,
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
      height = 300;
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
    if (!isRedraw) {
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
    }
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
        }).on("click", function(d) {
          if (isSexLabelClickable) {
            var sex = d.x.toLowerCase();
            if ($.isEmptyObject(dataFilters.sex)) {
              dataFilters.sex.push(sex);
            } else if (dataFilters.sex.indexOf(sex) >= 0 && dataFilters.sex.length > 1) {
              dataFilters.sex.splice(dataFilters.sex.indexOf(sex), 1);
            } else {
              dataFilters.sex = [];
            }
            redrawWithFilteredDate();
          }
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
      })
      .on("click", function(d) {
          if (isSexLabelClickable) {
            var pclassId = +Object.keys(pclassMap).filter(function(k) {
              return pclassMap[k] === d.category;
            })[0];
            if ($.isEmptyObject(dataFilters.pclass) ||
              (dataFilters.pclass.indexOf(pclassId) < 0 && dataFilters.pclass.length < 2)) {
              dataFilters.pclass.push(pclassId);
            } else if (dataFilters.pclass.indexOf(pclassId) >= 0 && dataFilters.pclass.length > 1) {
              dataFilters.pclass.splice(dataFilters.pclass.indexOf(pclassId), 1);
            } else {
              dataFilters.pclass = [];
            }
            dataFilters.pclass.sort();
            redrawWithFilteredDate();
          }
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

  function dimUnselectedAgeRange(ageRange) {
    if ($.isEmptyObject(ageRange)) {
      chartSvgs.ageHistogram.svg.selectAll("rect.age-data")
        .classed("dimmed", false);
    } else {
      chartSvgs.ageHistogram.svg.selectAll("rect.age-data")
        .classed("dimmed", function(d) {
          return d.x < ageRange[0] || d.x >= ageRange[1];
        });
    }
  }

  function drawAgeHistogramBrush() {

    d3.select("div#brush-help-text")
      .classed("hidden", false);

    var brush = d3.svg.brush()
      .x(chartSvgs.ageHistogram.xScale)
      .on("brush", function(p) {
        var extent = brush.extent();
        dataFilters.ageRange = [Math.ceil(extent[0]), Math.floor(extent[1])];
        dimUnselectedAgeRange(dataFilters.ageRange);
        redrawWithFilteredDate(chartSvgs.ageHistogram);
      })
      .on("brushend", function() {
        var extent = brush.extent();
        var startAge = Math.ceil(brush.extent()[0]);
        var endAge = Math.floor(brush.extent()[1]);
        if (endAge - startAge <= 0 || brush.empty()) {
          brush.clear();
          chartSvgs.ageHistogram.svg.select("g.x.brush").call(brush);
          dataFilters.ageRange = [];
          dimUnselectedAgeRange(dataFilters.ageRange);
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

  function makeSexLabelClickable(clickable) {
    isSexLabelClickable = clickable;
  }

  function redrawWithFilteredDate(excludedCharts) {
    var data = filterData(fullData);
    var dataPreservingAllAges = filterData(fullData, true)
    var survivalData = getSurvivalCount(data);
    var sexData = getSexCount(data);
    var pclassData = getPclassCount(data);

    function shouldUpdate(chart) {
      if ($.isArray(excludedCharts)) {
        return excludedCharts.indexOf(chart) < 0;
      } else {
        return excludedCharts !== chart;
      }
    }

    drawDataLabels(data);

    if (shouldUpdate(chartSvgs.survivalChart)) {
      drawSurvivalChart(survivalData, true);
    }
    if (shouldUpdate(chartSvgs.survivalStack)) {
      drawSurvivalStack(survivalData, true);
    }
    if (shouldUpdate(chartSvgs.ageHistogram)) {
      drawAgeHistogram(dataPreservingAllAges, true);
    }
    if (shouldUpdate(chartSvgs.sexChart)) {
      drawSexStack(sexData, true);
    }
    if (shouldUpdate(chartSvgs.survivalChart)) {
      drawPclassChart(pclassData, true);
    }
  }

  function filterData(data, preserveAllAges) {
    return $.grep(data, function(d) {
      if (!preserveAllAges && !$.isEmptyObject(dataFilters.ageRange)) {
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

  function initDrawDataLabels() {
    var numOfSamplesWithAge = $.grep(fullData, function(d) {
      return d.Age !== null;
    }).length;
    d3.selectAll(".rows-of-dataset").html(fullData.length);
    d3.selectAll(".rows-of-age-data").html(numOfSamplesWithAge);
  }

  function drawDataLabels(data) {
    d3.selectAll(".current-rows-of-dataset").html(data.length);

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

    var pclass = dataFilters.pclass;
    if ($.isEmptyObject(pclass) || !$.isArray(pclass)) {
      d3.selectAll(".pclass-not-restricted-label").classed("hidden", false);
      d3.selectAll("#selected-pclass-label").classed("hidden", true);
    } else if ($.isArray(pclass)){
      d3.selectAll(".pclass-not-restricted-label").classed("hidden", true);
      d3.select("#selected-pclass-label").classed("hidden", false);
      var pclassSpans = d3.select("#selected-pclass-label")
        .selectAll("span")
        .data(pclass, function(d) {
          console.log(d);
          return d;
        });
      pclassSpans
        .enter()
        .append("span")
        .html(function(d) {
          return pclassMap[d] + '<span class="comma">, </span>';
        });
      pclassSpans
        .exit()
        .remove();
    }
  }

  function performNarrativeAnimation(callback) {
    var ageNarrative = [{
      id: "narrative-0",
      timeout: 3000
    }, {
      id: "narrative-1",
      timeout: 3000
    }, {
      id: "narrative-2",
      timeout: 3000
    }, {
      id: "narrative-3",
      timeout: 3000
    }, {
      id: "narrative-4",
      timeout: 6000,
      toAge: 10,
      toAgeSpeed: 400
    }, {
      id: "narrative-5",
      timeout: 3000
    }, {
      id: "narrative-6",
      timeout: 10000,
      toAge: maxAge + 1
    }, {
      id: "narrative-7",
      timeout: 4000
    }, {
      id: "narrative-8",
      timeout: 6000
    }, {
      id: "narrative-9",
      timeout: 3000,
      waitFor: function() {
        return waitFor.ageAnimateEnd;
      }
    }, {
      id: "narrative-10",
      timeout: 5000,
      before: function() {
        dataFilters.ageRange = [];
        dimUnselectedAgeRange(dataFilters.ageRange);
        redrawWithFilteredDate(chartSvgs.ageHistogram);
      }
    }, {
      id: "narrative-11",
      timeout: 8000,
      sex: ["male"]
    }, {
      id: "narrative-12",
      timeout: 5000,
      sex: ["female"]
    }, {
      id: "narrative-13",
      timeout: 5000,
      sex: ["female"]

    }, {
      id: "narrative-14",
      timeout: 5000,
      before: function() {
        dataFilters.sex = [];
        redrawWithFilteredDate();
      }
    }, {
      id: "narrative-15",
      timeout: 8000,
      pclass: [3]
    }, {
      id: "narrative-16",
      timeout: 8000,
      pclass: [2]
    }, {
      id: "narrative-17",
      timeout: 5000,
      pclass: [1]
    }, {
      id: "narrative-18",
      timeout: 5000
    }, {
      id: "narrative-19",
      timeout: 5000,
      before: function() {
        dataFilters.pclass = [];
        redrawWithFilteredDate();
      }
    }, {
      id: "narrative-20",
      timeout: 5000
    }];
    var currCount = 0;
    var waitFor = {};

    function doAnimate() {
      var currNarrative = ageNarrative[currCount++];
      if (!currNarrative) {
        endNarrative();
        return;
      }
      if (typeof currNarrative.waitFor === "function") {
        if (!currNarrative.waitFor()) {
          currCount--;
          setTimeout(doAnimate, 500);
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
          dimUnselectedAgeRange(dataFilters.ageRange);
          redrawWithFilteredDate(chartSvgs.ageHistogram);
        }
        var currAgeUpperLimit = dataFilters.ageRange[1];
        var increaseAgeInterval = setInterval(function() {
          dataFilters.ageRange[1] += 1;
          dimUnselectedAgeRange(dataFilters.ageRange);
          redrawWithFilteredDate(chartSvgs.ageHistogram);

          if (dataFilters.ageRange[1] >= currNarrative.toAge) {
            clearInterval(increaseAgeInterval);
            waitFor.ageAnimateEnd = true;
          }
        }, currNarrative.toAgeSpeed ? currNarrative.toAgeSpeed : 200);
      }
      if ($.isArray(currNarrative.sex)) {
        dataFilters.sex = currNarrative.sex.slice();
        redrawWithFilteredDate();
      }
      if ($.isArray(currNarrative.pclass)) {
        dataFilters.pclass = currNarrative.pclass.slice();
        redrawWithFilteredDate();
      }
      setTimeout(doAnimate, currNarrative.timeout);
    }

    function startNarrative() {
      d3.select("#narrative-panel").classed("hidden", false);
      doAnimate();
    }

    function endNarrative() {
      d3.select("#narrative-panel").classed("hidden", true);
      if (typeof callback === "function") {
        callback();
      }
    }

    setTimeout(startNarrative, 100);
  }

  function draw(data) {
    fullData = data;
    maxAge = d3.max(fullData, function(d) {
      return d.Age;
    });
    minAge = d3.min(fullData, function(d) {
      return d.Age;
    });
    initDrawDataLabels();
    drawDataLabels(data);
    var survivalData = getSurvivalCount(data);
    var sexData = getSexCount(data);
    var pclassData = getPclassCount(data);
    drawSurvivalChart(survivalData);
    drawSurvivalStack(survivalData);
    drawAgeHistogram(data);
    drawSexStack(sexData);
    drawPclassChart(pclassData);
    performNarrativeAnimation(function() {
      drawAgeHistogramBrush();
      makeSexLabelClickable(true);
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
