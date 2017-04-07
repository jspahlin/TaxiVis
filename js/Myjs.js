// hey look a change!
//Init Map
//*******************************************************************************************************************************************************
var lat = 41.141376;
var lng = -8.613999;
var zoom = 14;

// add an OpenStreetMap tile layer
var mbAttr = 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
    '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
    'Imagery © <a href="http://mapbox.com">Mapbox</a>',
    mbUrl = 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoicGxhbmVtYWQiLCJhIjoiemdYSVVLRSJ9.g3lbg_eN0kztmsfIPxa9MQ';


var grayscale = L.tileLayer(mbUrl, {
        id: 'mapbox.light',
        attribution: mbAttr
    }),
    streets = L.tileLayer(mbUrl, {
        id: 'mapbox.streets',
        attribution: mbAttr
    });


var map = L.map('map', {
    center: [lat, lng], // Porto
    zoom: zoom,
    layers: [streets],
    zoomControl: true,
    fullscreenControl: true,
    fullscreenControlOptions: { // optional
        title: "Show me the fullscreen !",
        titleCancel: "Exit fullscreen mode",
        position: 'bottomright'
    }
});

var baseLayers = {
    "Grayscale": grayscale, // Grayscale tile layer
    "Streets": streets, // Streets tile layer
};

layerControl = L.control.layers(baseLayers, null, {
    position: 'bottomleft'
}).addTo(map);

// Initialise the FeatureGroup to store editable layers
var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

var featureGroup = L.featureGroup();

var drawControl = new L.Control.Draw({
    position: 'bottomright',
	collapsed: false,
    draw: {
        // Available Shapes in Draw box. To disable anyone of them just convert true to false
        polyline: false,
        polygon: false,
        circle: false,
        rectangle: true,
        marker: false,
    },
    edit: {
        featureGroup: drawnItems,
        //remove: true,
        //edit: true
    }

});
map.addControl(drawControl); // To add anything to map, add it to "drawControl"
//*******************************************************************************************************************************************************
//*****************************************************************************************************************************************
// Index Road Network by Using R-Tree
//*****************************************************************************************************************************************
var rt = cw(function(data,cb){
	var self = this;
	var request,_resp;
	importScripts("js/rtree.js");
	if(!self.rt){
		self.rt=RTree();
		request = new XMLHttpRequest();
		request.open("GET", data);
		request.onreadystatechange = function() {
			if (request.readyState === 4 && request.status === 200) {
				_resp=JSON.parse(request.responseText);
				self.rt.geoJSON(_resp);
				cb(true);
			}
		};
		request.send();
	}else{
		return self.rt.bbox(data);
	}
});

rt.data(cw.makeUrl("js/trips.json"));
//*****************************************************************************************************************************************
// Clear the Map.
//*****************************************************************************************************************************************	
function clearMap() {
    for (i in map._layers) {
        if (map._layers[i]._path != undefined) {
            try {
                map.removeLayer(map._layers[i]);
            } catch (e) {
                console.log("problem with " + e + map._layers[i]);
            }
        }
    }
}
//*****************************************************************************************************************************************
// Draw rectangle on Map Event for Query :
// Click the small box on Map and start drawing to do query.
//*****************************************************************************************************************************************	
var lineData;
var barData;
map.on('draw:created', function (e) {
	
	clearMap();
	
	var type = e.layerType,
		layer = e.layer;
	
	if (type === 'rectangle') {
		var bounds=layer.getBounds();
		rt.data([[bounds.getSouthWest().lng,bounds.getSouthWest().lat],[bounds.getNorthEast().lng,bounds.getNorthEast().lat]]).
		then(function(d){var result = d.map(function(a) {return a.properties;});
		barData= result;
		lineData = result;
		console.log(result);		// Trip Info: avspeed, distance, duration, endtime, maxspeed, minspeed, starttime, streetnames, taxiid, tripid
		DrawRS(result);
		});
		// update graphs when drawing a rectangle
		testVis(lineData);
		barChart();
	}
	drawnItems.addLayer(layer);			//Add your Selection to Map  
	console.log("hi I made a change!");
});
//*****************************************************************************************************************************************
// DrawRS Function:
// Input is a list of Trip and the function draw these trips on Map based on their IDs
//*****************************************************************************************************************************************
function DrawRS(trips) {
	for (var j=0; j<trips.length; j++) {  // Check Number of Segments and go through all segments
		var TPT = new Array();			  
		TPT = TArr[trips[j].tripid].split(',');  		 // Find each segment in TArr Dictionary. 
		var polyline = new L.Polyline([]).addTo(drawnItems);
        polyline.setStyle({
            color: 'red',                      // polyline color
			weight: 1,                         // polyline weight
			opacity: 0.5,                      // polyline opacity
			smoothFactor: 1.0  
        });
		for(var y = 0; y < TPT.length-1; y=y+2){    // Parse latlng for each segment
			polyline.addLatLng([parseFloat(TPT[y+1]), parseFloat(TPT[y])]);
		}
	}		
}
// inspiration taken from https://bl.ocks.org/mbostock/raw/3883245/
// for some of the linegraph code.
var testVisData;
function testVis(data) {
//preparse data to reduce it to values without undefined values.
	cleanData = function (d) {
		var newArray = new Array();
		for (var i = 0; i < 10; ++i) {
			if (d[i].duration != null && d[i].avgspeed != null) {
				newArray.push(d[i]);
			}
		}
		return newArray;
	}
	
	testVisData = cleanData(data);
	data = testVisData;

var svg = d3.select("body").select("div#rightside").append("svg").attr("width", 400).attr("height",300).attr("id","testVis"),
    margin = {top: 20, right: 20, bottom: 30, left: 50},
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom,
    g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var parseTime = d3.timeParse("%d-%b-%y");

var x = d3.scaleTime()
    .rangeRound([0, width]);

var y = d3.scaleLinear()
    .rangeRound([height, 0]);

var line = d3.line()
    .x(function(d) { return x(d.duration); })
    .y(function(d) { return y(d.avgspeed); });

/*d3.tsv("js/data.tsv", function(d) {
  d.date = parseTime(d.date);
  d.close = +d.close;
  return d;
}, function(error, data) {
  if (error) throw error;
*/
	// we handle data that is passed in the first argument of the function.
	// avgspeed, distance, duration, endtime, maxspeed, minspeed, starttime, streetnames{...}, taxiid, tripid.
	console.log("before x.domain");
  x.domain(d3.extent(data, function(d) { return d.duration; }));
	console.log("before y.domain");
  y.domain(d3.extent(data, function(d) { return d.avgspeed; })); 

	console.log("before g.append(\"g\")");
  g.append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x))
    .select(".domain")
      .remove();
	console.log("before g.append(\"g\") 2");
  g.append("g")
      .call(d3.axisLeft(y))
    .append("text")
      .attr("fill", "#000")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", "0.71em")
      .attr("text-anchor", "end")
      .text("Price ($)");
console.log("before g.append(\"g\") 3");
  g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("stroke-width", 1.5)
      .attr("d", line);
/*});*/
}



// sample bar chart

function barChart(){
	
	var margin = {top: 20, right: 20, bottom: 70, left: 40},
    width = 400 - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom;

// Parse the date / time

var	parseDate = d3.timeParse("%Y-%m");

var x = d3.scaleBand().rangeRound([0, width]).padding(0.2);

var y = d3.scaleLinear().range([height, 0]);

var xAxis = d3.axisBottom(x).tickFormat(d3.timeParse("%Y-%m"));

var yAxis = d3.axisLeft(y).ticks(10);
	
d3.select("body").select("div#rightside").select("div#barchart").selectAll("*").remove();

var svg = d3.select("body").select("div#rightside").select("div#barchart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", 
          "translate(" + margin.left + "," + margin.top + ")");
		 
d3.csv("data/bar-data.csv", function(error, data) {
	
    data.forEach(function(d) {
        d.date = parseDate(d.date);
        d.value = +d.value;
		//console.log(d.date);
    });
	
  x.domain(data.map(function(d) { return d.date; }));
  y.domain([0, d3.max(data, function(d) { return d.value; })]);

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", "-.55em")
      .attr("transform", "rotate(-90)" );

  svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Value ($)")
	  .attr("fill", "red");

  svg.selectAll("bar")
      .data(data)
      .enter().append("rect")
      .style("fill", "steelblue")
      .attr("x", function(d) { return x(d.date); })
      .attr("width", x.bandwidth())
      .attr("y", function(d) { return y(d.value); })
      .attr("height", function(d) { return height - y(d.value); });

});
}
//barChart();
