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

// bubble graph ---------------------------------------------------------------

width = 700 - margin.left - margin.right,
height = 400 - margin.top - margin.bottom;

// convert strings to numbers
rentData.forEach(function(d) {
  d.county = d.county;
  d.salaryK = Math.round(d.average_salary/1000);
  d.step_10 = +d.step_10;
  d.rentK = Math.round(d.median_anual_rent/1000);
  d.num_teachers = +d.full_time_employees;
  d.percent = Math.round(d.average_salary_spent_on_rent*100);
})

// x-axis scale
var x = d3.scale.linear()
    .rangeRound([0, width]);

// y-axis scale
var y = d3.scale.linear()
    .rangeRound([height, 0]);

// color bands
// var color = d3.scale.ordinal()
//     .range(["#FFE599", "#DE8067"]);

var color = d3.scale.category10();

// use x-axis scale to set x-axis
var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

// use y-axis scale to set y-axis
var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")

// var valueline = d3.svg.line()
//   .x(function(d) {return x(d.salaryK); })
//   .y(function(d) {return y(d.salaryK/3); });

// create SVG container for chart components
var svg = d3.select(".bubble-graph").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

x.domain(d3.extent(rentData, function(d) { return d.salaryK; })).nice();//.nice();
y.domain(d3.extent(rentData, function(d) { return d.rentK; })).nice(); //.nice();

var xMin = x.domain()[0];
var xMax = x.domain()[1];

var line30 = [
  {x: xMin, y: 0,},
  {x: xMax, y: 0,},
];

console.log(line30);

var area = d3.svg.area()
  .x(function(d) {
    return x(d.x);
  })
  .y0(0)
  .y1(function(d) {
    return y(d.x/3);
  });

svg.append("path")
  .datum(line30)
  .attr("class", "area")
  .attr("d",area);

console.log(area);

svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis)
    .append("text")
    .attr("class", "label")
    .attr("x", width)
    .attr("y", -6)
    .style("text-anchor", "end")
    .text("Yearly Salary (K)");

svg.append("g")
    .attr("class", "y axis")
    .call(yAxis)
    .append("text")
    .attr("class", "label")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text("Yearly Rent (K)")

// label the 30% shading / line
svg.append("text")
    .attr("x", (width-60))
    .attr("y", 90 )
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .text("30% of income");

//color in the dots
svg.selectAll(".dot")
    .data(rentData)
    .enter().append("circle")
    .attr("class", "dot")
    .attr("r", function(d) {
      //return 6;
      return (d.num_teachers/500)+2.5;
    })
    .attr("cx", function(d) { return x(d.salaryK); })
    .attr("cy", function(d) { return y(d.rentK); })
    .style("fill", function(d) { return color(d.county); })
    .on("mouseenter", function(d) {
      showTooltip(d, this);
    })
    .on("mouseleave", function(d) {
      hideTooltip(d, this);
      tooltip.classList.remove("show");
    });

// show tooltip
var tooltip = document.querySelector(".tooltip");

var showTooltip = function(d, target) {
  svg.selectAll('.dot').selectAll("circle")

  // tooltip info
  tooltip.classList.add("show");
  tooltip.innerHTML = `
    <div>School district: <b>${d.school}</b></div>
    <div>County: <b>${d.county}</b></div>
    <div>Median annual rent: <b>$${d.rentK}K</b></div>
    <div>Median annual salary: <b>$${d.salaryK}K</b></div>
    <div>Number of teachers: <b>${d.num_teachers}</b></div>
    <div>Percent income spent on rent: <b>${d.percent}%</b></div>
  `;
}

var hideTooltip = function(d, target) {
    tooltip.classList.remove("show");
}

// get tooltip to move with cursor
document.querySelector(".bubble-graph").addEventListener("mousemove", function(e) {
  var bounds = this.getBoundingClientRect();
  var x = e.clientX - bounds.left;
  var y = e.clientY - bounds.top;
  tooltip.style.left = x + 10 + "px";
  tooltip.style.top = y + 10 + "px";

  tooltip.classList[x > bounds.width / 2 ? "add" : "remove"]("flip");
});


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

width = 500 - margin.left - margin.right,
height = 400 - margin.top - margin.bottom;

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

// clustered bar graph ----------------------------------------------------------

width = 500 - margin.left - margin.right,
height = 400 - margin.top - margin.bottom;

// x-axis scale
var x0 = d3.scale.ordinal()
    .rangeRoundBands([0, width], bar_spacing);
var x1 = d3.scale.ordinal()

// y-axis scale
var y = d3.scale.linear()
    .rangeRound([height, 0]);

// color bands
var color = d3.scale.ordinal()
    .range(["#6C85A5", "#FFCC32", "#889C6B"]);

// use x-axis scale to set x-axis
var xAxis = d3.svg.axis()
    .scale(x0)
    .orient("bottom");

// use y-axis scale to set y-axis
var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .tickFormat(d3.format(".2s"));

// create SVG container for chart components
var svg = d3.select(".clustered-bar-graph").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// convert strings to numbers
// payData.forEach(function(d) {
  // console.log(d);
  // if (d.district == "San Francisco Unified"){
  //   console.log("we have a winner");
    // d.year = d.year;
    // d.teacher = +d.adjusted_teacher;
    // d.step_10 = +d.adjusted_step_10;
    // d.median = +d.adjusted_median;
  // }
// })
console.log(payData);

// map columns to colors
var yearMap = d3.keys(payData[0]).filter(function (key) {
    return key !== "year";
});

payData.forEach(function (d) {
    var y0 = 0;
    d.types = yearMap.map(function (name) {
        return {
            name: name,
            value: +d[name]
        };
    });
});

// x domain is set of years
x0.domain(payData.map(function (d) {
    return d.year;
}));

// x domain number 2
x1.domain(yearMap).rangeRoundBands([0,x0.rangeBand()]);

// y domain is scaled by highest total
y.domain([0, d3.max(payData, function (d) {
    return d3.max(d.types, function(d) { return d.value; });
})]);

svg.append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .attr("y", 6)
    .attr("dy", -45)
    .attr("x", -(height)/2)
    .attr("transform", "rotate(-90)")
    .text("Yearly Salary");

svg.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

svg.append("g")
    .attr("class", "y axis")
    .call(yAxis);

// generate rectangles for all the data values
var year = svg.selectAll(".year")
    .data(payData)
    .enter().append("g")
    .attr("class", "g")
    .attr("transform", function (d) {
      return "translate(" + x0(d.year) + ",0)";
    });

year.selectAll("rect")
    .data(function (d) {
      return d.types;
    })
    .enter().append("rect")
    .attr("width", x1.rangeBand())
    .attr("x", function (d) {
      return x1(d.name);
    })
    .attr("y", function (d) {
      return y(d.value);
    })
    .attr("height", function (d) {
      return height - y(d.value);
    })
    .style("fill", function (d) {
      return color(d.name);
    });
