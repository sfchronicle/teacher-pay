// require("./lib/social");
// var track = require("./lib/tracking");

require("component-responsive-frame/child");
var d3 = require('d3');
require("angular");
var app = angular.module("searchbar", []);

// setting sizes of interactive features
var bar_spacing = 0.2;
var margin = {
  top: 20,
  right: 20,
  bottom: 20,
  left: 60
},
width = 500 - margin.left - margin.right,
height = 400 - margin.top - margin.bottom;

// bubble graph ---------------------------------------------------------------



// searchbar code -------------------------------------------------------------

app.controller("SearchController", ["$scope", function($scope) {
  var all = allSchoolData;

  $scope.untouched = true;

  $scope.search = debounce(function() {

    var value = $scope.searchText;

    if (!value) {
      $scope.found = [];
      $scope.untouched = true;
    } else {
      value = value.toLowerCase();
      var filtered = all.filter(function(item) {
        return (item.county.toLowerCase().indexOf(value) == 0 || item.school_district.toLowerCase().indexOf(value) == 0);
      });
      $scope.found = filtered;
      $scope.untouched = false;
    }
    $scope.$apply();
  });

  $scope.found = [];
}]);

var debounce = function(f, interval) {
  var timeout = null;
  return function() {
    if (timeout) return;
    var args = [];
    for (var i = 0; i < arguments.length; i++) {
      args[i] = arguments[i];
    }
    timeout = setTimeout(function() {
      f.apply(null, args);
      timeout = null;
    }, interval || 400);
  };
};

// stacked bar graph ----------------------------------------------------------

// x-axis scale
var x = d3.scale.ordinal()
    .rangeRoundBands([0, width], bar_spacing);

// y-axis scale
var y = d3.scale.linear()
    .rangeRound([height, 0]);

// color bands
var color = d3.scale.ordinal()
    .range(["#6C85A5", "#FFCC32", "#889C6B"]);

// use x-axis scale to set x-axis
var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

// use y-axis scale to set y-axis
var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .tickFormat(d3.format(".2s"));

// create SVG container for chart components
var svg = d3.select(".stacked-bar-graph").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// convert strings to numbers
sfPayData.forEach(function(d) {
  d.year = d["year"];
  d.teacher = +d.teacher;
  d.step_10 = +d.step_10-d.teacher;
  d.median = +d.median-d.step_10-d.teacher;
})

// map columns to colors
color.domain(d3.keys(sfPayData[0]).filter(function (key) {
    return key !== "year";
}));

sfPayData.forEach(function (d) {
    var y0 = 0;
    d.types = color.domain().map(function (name) {
        return {
            name: name,
            y0: y0,
            y1: y0 += +d[name]
        };
    });
    d.total = d.types[d.types.length - 1].y1;
});

// x domain is set of years
x.domain(sfPayData.map(function (d) {
    return d.year;
}));

svg.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .attr("y", 6)
    .attr("dy", -45)
    .attr("x", -(height)/2)
    .attr("transform", "rotate(-90)")
    .text("Yearly Salary");

// y domain is scaled by highest total
y.domain([0, d3.max(sfPayData, function (d) {
    return d.total;
})]);

svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

svg.append("g")
    .attr("class", "y axis")
    .call(yAxis);

// generate rectangles for all the data values
var year = svg.selectAll(".year")
    .data(sfPayData)
    .enter().append("g")
    .attr("class", "g")
    .attr("transform", function (d) {
    return "translate(" + x(d.year) + ",0)";
});

year.selectAll("rect")
    .data(function (d) {
    return d.types;
})
    .enter().append("rect")
    .attr("width", x.rangeBand())
    .attr("y", function (d) {
    return y(d.y1);
})
    .attr("height", function (d) {
    return y(d.y0) - y(d.y1);
})
    .style("fill", function (d) {
    return color(d.name);
});
