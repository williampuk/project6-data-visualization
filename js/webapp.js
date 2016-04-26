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

    function drawSurvivalChart(data) {
        var marginTop = 20,
            marginLeft = 50,
            axisPadding = 0,
            width = 1000,
            height = 100,
            colors = {
                Survived: "blue",
                Perished: "red"
            },
            numberOfRows = data.length,
            survivalData = updateSurvivalCount(data);
        var svg = d3.select("div#survival")
            .append("svg")
            .attr("width", width + marginLeft * 2)
            .attr("height", height + marginTop * 2);
        var svgGrp = svg.append("g")
            .attr({
                transform: "translate(" + marginLeft + "," +
                    marginTop + ")",
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

        var xAxis = d3.svg.axis()
            .orient('bottom')
            .scale(xScale)
            .ticks(20);

        svg.append('g')
            .attr({
                transform: 'translate(' + marginLeft + ',' + (marginTop + height + axisPadding) + ')'
            })
            .attr("class", "x axis")
            .call(xAxis);

        var yAxis = d3.svg.axis()
            .orient('left')
            .scale(yScale);

        svg.append('g')
            .attr({
                transform: 'translate(' + (marginLeft - axisPadding) + ',' + marginTop  + ')'
            })
            .attr("class", "y axis")
            .call(yAxis);
        return {
            marginTop: marginTop,
            marginLeft: marginLeft,
            width: width,
            height: height,
            colors: colors
        };
    }

    function draw(data) {
        var survivalData = updateSurvivalCount(data);
        drawSurvivalChart(data);
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
