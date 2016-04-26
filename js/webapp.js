var app = function(d3, dimple, $, undefined) {
    "use strict";

    function updateSurvivalCount(data) {
        var survived = d3.sum(data, function(d) {
            return d.Survived
        });
        return [{
            category: "survived",
            count: survived
        }, {
            category: "perished",
            count: data.length - survived
        }];
    }

    function draw(data) {
        var numberOfRows = data.length;
        var survivalGraph = {
            marginTop: 20,
            marginLeft: 20,
            width: 1000,
            height: 100,
            colors: {
                survived: "blue",
                perished: "red"
            }
        };
        var survivalData = updateSurvivalCount(data);
        survivalGraph.svg = d3.select("div#survival")
            .append("svg")
            .attr("width", survivalGraph.width + survivalGraph.marginLeft * 2)
            .attr("height", survivalGraph.height + survivalGraph.marginTop * 2);
        survivalGraph.svgGrp = survivalGraph.svg.append("g")
            .attr({
                transform: "translate(" + survivalGraph.marginLeft + "," +
                    survivalGraph.marginTop + ")",
                class: 'main-group'
            });
        survivalGraph.xScale = d3.scale
            .linear()
            .domain([0, d3.max(survivalData, function(d) { return d.count; })])
            .range([0, survivalGraph.width]);
        debugger;
        survivalGraph.yScale = d3.scale.ordinal()
            .domain(d3.range(2))
            .rangeRoundBands([0, survivalGraph.height], 0.05);
        survivalGraph.barGroups = survivalGraph.svgGrp.selectAll("g")
            .data(survivalData)
            .enter()
            .append("g")
            .style("fill", function(d, i) {
                return survivalGraph.colors[d.category];
            });
        survivalGraph.barGroups
            .append("rect")
            .attr("x", 0)
            .attr("y", function(d, i) {
                return survivalGraph.yScale(i);
            })
            .attr("height", function(d) {
                return survivalGraph.yScale.rangeBand();
            })
            .attr("width", function(d) { return survivalGraph.xScale(d.count); });
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
