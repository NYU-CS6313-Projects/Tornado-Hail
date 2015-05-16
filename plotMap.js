// for map
var width = 800,
    height = 480,
    centered;

var projection = d3.geo.albersUsa()
    .scale(800)
    .translate([width / 2, height / 2]);

var path = d3.geo.path()
    .projection(projection);

var graticule = d3.geo.graticule();

var svg = d3.select("#area1").append("svg")
    .attr("width", width)
    .attr("height", height);

var g = svg.append("g");

// Setup groups
// --------------------------------------
// Add groups for arcs and images. If arcs are added before images, they
//  will appear under the images.
// order is important
var stateGroup = g.append('g');
var arcGroup = g.append('g');
window.update = null;
d3.json("us.json", function(error, us) {
    // draw states
    stateGroup.append("g")
      .attr("id", "states")
    .selectAll("path")
      .data(topojson.feature(us, us.objects.states).features)
    .enter().append("path")
      .attr("d", path)
      .on("click", clicked);

    stateGroup.append("path")
      .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
      .attr("id", "state-borders")
      .attr("d", path);

   var data = null;
    d3.csv("paired.csv", function(error, load) {
  data = load;
  update();
    });
    window.update =function update() {
        // --- Helper functions (for tweening the path)
        var lineTransition = function lineTransition(path) {
            path.transition()
                //NOTE: Change this number (in ms) to make lines draw faster or slower
                .duration(3000)
                .attrTween("stroke-dasharray", tweenDash)
                .each("end", function(d,i) { 
                    ////Uncomment following line to re-transition
                    //d3.select(this).call(transition); 
                    
                    //We might want to do stuff when the line reaches the target,
                    //  like start the pulsating or add a new point or tell the
                    //doStuffWhenLineFinishes(d,i);
                });
        };
		
		//filter Data for visualization
		var tmpData = window.filterIndices ? window.filterIndices.map(function(ix) {
   return data[ix];
  }) : data;
		// Some tornadoes do not have end location so omit them for visualization
		     filteredData = tmpData.filter(function(d){ return d.elon != 0; });

		// Omit small tornadoes
		filteredData = filteredData.filter(function(d){ return d.len > 2; });
		
		
        var tweenDash = function tweenDash() {
            //This function is used to animate the dash-array property, which is a
            //  nice hack that gives us animation along some arbitrary path (in this
            //  case, makes it look like a line is being drawn from point A to B)
            var len = this.getTotalLength(),
                interpolate = d3.interpolateString("0," + len, len + "," + len);

            return function(t) { return interpolate(t); };
        };

        //scaling according to input data
		var colorScale = d3.scale.linear().domain([0,5]).range(["blue","red"]);
		var widthScale = d3.scale.pow().exponent(.5).domain(d3.extent(filteredData.map(function(d){ return d.wid; }))).range([".5px", "1.5px"]);
		var opacityScale = d3.scale.quantile().domain([0,5]).range([.1,.4,.5,.6,.7,.8,.9]);
				
		// --- Add paths
        // Format of object is an array of objects, each containing
        //  a type (LineString - the path will automatically draw a greatArc)
        //  and coordinates 
		var links = filteredData.map(function(f) {
		  return {
			type: "LineString",
			//coordinates
			coordinates: [
			  [ f.slon, f.slat ],
			  [ f.elon, f.elat ]
			],
			color: colorScale(f.f), //color
			width: widthScale(f.wid), //width
			//opacity: opacityScale(f.f) //opacity

			}			
		});

		console.log(links);  //debugging
        
		// Standard enter / update 
        var pathArcs = arcGroup.selectAll(".arc")
            .data(links);

        //enter
        pathArcs.enter()
            .append("path").attr({
                'class': 'arc'
            }).style({ 
                fill: 'none',
            });

        //update
        pathArcs.attr({
                //d is the points attribute for this path, we'll draw
                //  an arc between the points using the arc function
                d: path
            })
            .style({
			stroke: function(link) {
					return link.color;
					},
			'stroke-width': function(link) {
							return link.width;
							},
			'opacity': function(link) {
							return link.opacity;
							}
			})


            // Uncomment this line to remove the transition
            .call(lineTransition); 

        //exit
        pathArcs.exit().remove();

    }
});

function clicked(d) {
  var x, y, k;

  if (d && centered !== d) {
    var centroid = path.centroid(d);
    x = centroid[0];
    y = centroid[1];
    k = 4;
    centered = d;
  } else {
    x = width / 2;
    y = height / 2;
    k = 1;
    centered = null;
  }

  g.selectAll("path")
      .classed("active", centered && function(d) { return d === centered; });

  g.transition()
      .duration(750)
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
      .style("stroke-width", 1 / k + "px");
	  
	  
}
