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

    function drawSurvivalChart(survivalData) {
        var margin = {
                top: 10,
                left: 50,
                bottom: 10,
                right: 30
            },
            axisPadding = 0,
            width = 800,
            height = 100,
            colors = {
                Survived: "blue",
                Perished: "red"
            };
        var svg = d3.select("div#survival")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom * 2);
        var svgGrp = svg.append("g")
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
        var barGroups = svgGrp.selectAll("g")
            .data(survivalData)
            .enter()
            .append("g")
            .style("fill", function(d, i) {
                return colors[d.category];
            });
        barGroups
            .append("rect")
            .attr("x", 0)
            .attr("y", function(d, i) {
                return yScale(d.category);
            })
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
                return "translate(" + (xScale(d.count) + 5) + ", " + (yScale(d.category) + yScale.rangeBand() / 2) + ")";
            });

        var xAxis = d3.svg.axis()
            .orient('bottom')
            .scale(xScale)
            .ticks(20);

        svg.append('g')
            .attr({
                transform: 'translate(' + margin.left + ',' + (margin.top + height + axisPadding) + ')'
            })
            .attr("class", "x axis")
            .call(xAxis);

        var yAxis = d3.svg.axis()
            .orient('left')
            .scale(yScale);

        svg.append('g')
            .attr({
                transform: 'translate(' + (margin.left - axisPadding) + ',' + margin.top + ')'
            })
            .attr("class", "y axis")
            .call(yAxis);
        return {
            margin: margin,
            width: width,
            height: height,
            colors: colors
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
                top: 5,
                left: 2,
                bottom: 5,
                right: 2
            },
            axisPadding = 0,
            width = 80,
            barWidth = 20,
            height = 100,
            colors = {
                Survived: "blue",
                Perished: "red"
            };
        var layer = d3.layout.stack()(survivalData.map(function(d) {
            return [{
                x: d.category,
                y: d.count
            }];
        }));
        var svg = d3.select("div#survival-ratio")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom * 2);
        var svgGrp = svg.append("g")
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
        var barGroups = svgGrp.selectAll("g")
            .data(layer)
            .enter()
            .append("g")
            .style("fill", function(d, i) {
                return colors[d[0].x];
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

    function draw(data) {
        var survivalData = updateSurvivalCount(data);
        drawSurvivalChart(survivalData);
        drawSurvivalStack(survivalData);
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
