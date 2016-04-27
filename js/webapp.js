var app = function(d3, dimple, $, undefined) {
    "use strict";

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
            return d.Sex === "male";
        });
        return [{
            category: "Male",
            count: male
        }, {
            category: "Female",
            count: data.length - male
        }];
    }

    function drawSurvivalChart(survivalData) {
        var margin = {
                top: 10,
                left: 50,
                bottom: 10,
                right: 35
            },
            width = 800,
            height = 100;
        var svg = d3.select("div#survival")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom * 2)
            .append("g")
            .attr({
                transform: "translate(" + margin.left + "," +
                    margin.top + ")",
                class: 'main-group'
            });
        var xScale = d3.scale
            .linear()
            .domain([0, d3.max(survivalData, function(d) {
                return d.count;
            })])
            .range([0, width]);

        var yScale = d3.scale.ordinal()
            .domain(survivalData.map(function(d) {
                return d.category;
            }))
            .rangeRoundBands([0, height], 0.2);
        var barGroups = svg.selectAll("g")
            .data(survivalData)
            .enter()
            .append("g")
            .attr("class", function(d) {
                return d.category.toLowerCase() + " bar-group";
            })
            .attr("transform", function(d) {
                return "translate(" + 0 + "," + yScale(d.category) + ")";
            });
        barGroups
            .append("rect")
            .attr("height", function(d) {
                return yScale.rangeBand();
            })
            .attr("width", function(d) {
                return xScale(d.count);
            });
        barGroups
            .append('text')
            .text(function(d) {
                return d.count;
            })
            .attr({
                "class": "bar text",
                'alignment-baseline': 'middle'
            })
            .attr("transform", function(d) {
                return "translate(" + (xScale(d.count) + 5) + ", " + (yScale.rangeBand() / 2) + ")";
            });
        // Axes
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
        return {
            margin: margin,
            width: width,
            height: height
        };
    }

    function drawSurvivalStack(survivalData) {
        var totalCount = d3.sum(survivalData, function(d) {
            return d.count;
        });
        if (totalCount <= 0) {
            // It should not draw this graph if both counts are zero's.
            return;
        }
        var margin = {
                top: 15,
                left: 20,
                bottom: 5,
                right: 2
            },
            axisPadding = 0,
            width = 80,
            barWidth = 20,
            height = 100;
        var layer = d3.layout.stack()(survivalData.map(function(d) {
            return [{
                x: d.category,
                y: d.count
            }];
        }));
        var svg = d3.select("div#survival-ratio")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom * 2)
            .append("g")
            .attr({
                transform: "translate(" + margin.left + "," +
                    margin.top + ")",
                class: 'main-group'
            });
        var yScale = d3.scale.linear()
            .domain([0, d3.max(layer, function(layer) {
                return layer[0].y0 + layer[0].y;
            })])
            .range([0, height]);
        var barGroups = svg.selectAll("g")
            .data(layer)
            .enter()
            .append("g")
            .attr("class", function(d) {
                return d[0].x.toLowerCase() + " bar-group";
            });
        barGroups
            .selectAll("rect")
            .data(function(d) {
                return d;
            })
            .enter()
            .append("rect")
            .attr("x", 0)
            .attr("y", function(d, i) {
                return yScale(d.y0);
            })
            .attr("height", function(d) {
                return yScale(d.y);
            })
            .attr("width", barWidth);
        barGroups
            .selectAll("text")
            .data(function(d) {
                return d;
            })
            .enter()
            .append('text')
            .text(function(d) {
                return Math.round(survivalData.find(function(sd) {
                    return sd.category === d.x;
                }).count / totalCount * 1000) / 10 + "%";
            })
            .attr({
                "class": "bar text",
                'alignment-baseline': 'middle'
            })
            .attr("transform", function(d) {
                return "translate(" + (barWidth + 5) + ", " + (yScale(d.y0) + yScale(d.y) / 2) + ")";
            });
    }

    function drawAgeHistogram(data) {
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

        var xScale = d3.scale.linear()
            .domain([0, maxAge + 1])
            .range([0, width]);

        var histogramData = d3.layout.histogram()
            .bins(xScale.ticks(maxAge))
            (rowsWithAge.map(function(d) {
                return d.Age;
            }));

        var yScale = d3.scale.linear()
            .domain([0, d3.max(histogramData, function(d) {
                return d.y;
            })])
            .range([height, 0]);

        var svg = d3.select("div#age")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        // debugger;
        var barGroups = svg.selectAll("g")
            .data(histogramData)
            .enter()
            .append("g")
            .attr("class", "age bar-group")
            .attr("transform", function(d) {
                return "translate(" + xScale(d.x) + ", " + yScale(d.y) + ")";
            });

        barGroups
            .append("rect")
            .attr("width", xScale(histogramData[0].dx) - 2)
            .attr("height", function(d) {
                return height - yScale(d.y);
            });
        // Axes
        var xAxis = d3.svg.axis()
            .scale(xScale)
            .orient("bottom")
            .ticks(16);
        svg.append("g")
            .attr({
                class: "x axis",
                transform: "translate(" + axisPadding + ", " + height + ")"
            })
            .call(xAxis);
        var yAxis = d3.svg.axis()
            .scale(yScale)
            .orient("left");
        svg.append("g")
            .attr({
                class: "y axis",
                transform: "translate(" + (-axisPadding) + ", 0)"
            })
            .call(yAxis);
    }

    function drawSexStack(sexData) {
        var totalCount = d3.sum(sexData, function(d) {
            return d.count;
        });
        if (totalCount <= 0) {
            // It should not draw this graph if both counts are zero's.
            return;
        }
        var margin = {
                top: 5,
                left: 15,
                bottom: 5,
                right: 5
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
        var svg = d3.select("div#sex")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom * 2)
            .append("g")
            .attr({
                transform: "translate(" + margin.left + "," +
                    margin.top + ")",
                class: 'main-group'
            });
        var xScale = d3.scale.linear()
            .domain([0, d3.max(layer, function(layer) {
                return layer[0].y0 + layer[0].y;
            })])
            .range([0, width]);
        var barGroups = svg.selectAll("g")
            .data(layer)
            .enter()
            .append("g")
            .attr("class", function(d) {
                return d[0].x.toLowerCase() + " bar-group";
            });
        barGroups
            .selectAll("rect")
            .data(function(d) {
                return d;
            })
            .enter()
            .append("rect")
            .attr("x", function(d, i) {
                return xScale(d.y0);
            })
            .attr("y", 0)
            .attr("height", barHeight)
            .attr("width", function(d) {
                return xScale(d.y);
            });
        barGroups
            .selectAll("text")
            .data(function(d) {
                return d;
            })
            .enter()
            .append('text')
            .text(function(d) {
                var count = sexData.find(function(sd) {
                    return sd.category === d.x;
                }).count;
                var percentage = Math.round(count / totalCount * 1000) / 10;
                return d.x + ": " + count + " (" + percentage + "%)";
            })
            .attr({
                "class": "bar text",
                'alignment-baseline': 'text-before-edge',
                'text-anchor': 'middle'
            })
            .attr("transform", function(d) {
                return "translate(" + (xScale(d.y0) + xScale(d.y) / 2) + ", " + (barHeight + 2) + ")";
            });
    }

    function draw(data) {
        var survivalData = updateSurvivalCount(data);
        var sexData = updateSexCount(data);
        drawSurvivalChart(survivalData);
        drawSurvivalStack(survivalData);
        drawAgeHistogram(data);
        drawSexStack(sexData);
    }

    function init() {
        d3.csv('/data/titanic.csv', function(row) {
            row.PassengerId = +row.PassengerId;
            row.Survived = +row.Survived;
            row.SurvivedBool = row.Survived === 1;
            row.Pclass = +row.Pclass;
            row.PclassLbl = row.Pclass === 1 ? "Upper" : row.Pclass === 2 ? "Middle" : "Lower";
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
}(d3, dimple, jQuery);

window.jQuery(app.init);
