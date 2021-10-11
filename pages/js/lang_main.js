//JavaScript by Seth Frame

(function(){

    // Set array of attributes
var attrArray = ["Navajo", "Other_NA", "Spanish", "English", "Very_Well", "Less_Than_Well"];
var expressed = attrArray[0];

    // Set map attributes
var margin = {top: 10, left: 10, bottom: 10, right: 10},
    width = parseInt(d3.select('#map').style('width')),
    width = (width - margin.left - margin.right)/2,
    mapRatio = .3,
    height = width * mapRatio * 2,
    centered;

var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

    // Set page title
var pageTitleH= parseInt(d3.select('#title').style('height'));
    
    // Set Chart attributes
var chartWidth = window.innerWidth * 0.97,
    chartHeight = (h - height - pageTitleH) * .80,
    leftPadding = 35,
    rightPadding = 5,
    topBottomPadding = 10,
    chartInnerWidth = chartWidth - leftPadding - rightPadding,
    chartInnerHeight = chartHeight - topBottomPadding * 10,
    translate = "translate(" + leftPadding + "," + topBottomPadding + ")";
    
    // Set map projection
var projection = d3.geoAlbers()
    .center([0, 36.7])
    .rotate([109, 0])
    .parallels([25.9, 45.5])
    .scale(width * 3)
    .translate([width / 2, height / 2]);

var path = d3.geoPath()
    .projection(projection);
    
    // Set alternate attribute names
var t_navajo = "Navajo speakers",
    t_otherna = "other Native American speakers",
    t_spanish = "Spanish speakers",
    t_english = "English only speakers",
    t_verywell = "speak English very well",
    t_lessthanwell = "speak English less than well";

    // Set scale
var yScale = d3.scaleLinear()
    .range([chartInnerHeight + 85, 0])
    .domain([0, 100]);
    
    // Call map on window load
window.onload = setMap(width, height);

    // Sets main map in page and adds data also calls other functions on callback
function setMap(width, height){

    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);
    
    d3.queue()
        .defer(d3.csv, "data/County_Attributes.csv")
        .defer(d3.json, "data/counties.topojson")
        .defer(d3.json, "data/reservations.topojson")
        .defer(d3.json, "data/states.topojson")
        .await(callback);
    
    function callback(error, csvData, co, res, st){
        
        console.log(st);
        
        var resBoundaries = topojson.feature(res, res.objects.reservations),
            stateBorders = topojson.feature(st, st.objects.states).features,
            langCounties = topojson.feature(co, co.objects.counties).features;
        
        
        console.log(stateBorders);
        
        langCounties = joinData(langCounties, csvData);
        
        var colorScale = makeColorScale(csvData);
        
        setStateBackground(stateBorders, path);
        
        setText();
        
        setEnumerationUnits(langCounties, map, path, colorScale);

        setResText(resBoundaries, map, path);
        
        createDropdown(csvData);
        
        setChart(csvData, colorScale);
    };
};
    
    // Join JSON data to CSV
function joinData(langCounties, csvData){
        for (var i=0; i<csvData.length; i++){
            var csvRegion = csvData[i];
            var csvKey = csvRegion.GeoID;

        for (var a=0; a<langCounties.length; a++){
            var geojsonProps = langCounties[a].properties;
            var geojsonKey = geojsonProps.GeoID;

            if (geojsonKey == csvKey){
                attrArray.forEach(function(attr){
                    var val = parseFloat(csvRegion[attr]);
                    geojsonProps[attr] = val;
                }); 
            };
        };
    };
    
    console.log(langCounties);
    return langCounties;
};
    
    // Create colorscale for map and chart
function makeColorScale(data){
    var colorClasses = [
        "#fff5eb",
        "#fee6ce",
        "#fdd0a2",
        "#fdae6b",
        "#fd8d3c",
        "#f16913",
        "#d94801",
        "#8c2d04"
    ];

    var colorScale = d3.scaleThreshold()
        .range(colorClasses);

    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };
    
    var clusters = ss.ckmeans(domainArray,8);
    
    domainArray = clusters.map(function(d){
        return d3.min(d);
    });
    
    domainArray.shift();

    colorScale.domain(domainArray);

    return colorScale;
};

    // Define choropleth for colorscale
function choropleth(props, colorScale){
    var val = parseFloat(props[expressed]);
    if (typeof val == 'number' && !isNaN(val) && val != 0.0){
        return colorScale(val);
    } else {
        return "#CCC";
    };
};

    // Set main map units
function setEnumerationUnits(langCounties, map, path, colorScale){
    var regions = map.selectAll(".regions")
        .data(langCounties)
        .enter()
        .append("path")
        .attr("class", function(d){
            return "regions " + d.properties.GeoID;
        })
        .attr("d", path)
        .style("fill", function(d){
            return choropleth(d.properties, colorScale);
        })
        .style("opacity", .65)
        .on("mouseover", function(d){
            highlight(d.properties);
        })
        .on("mouseout", function(d){
            dehighlight(d.properties);
        })
        .on("mousemove", moveLabel)
    
    var desc = regions.append("desc")
        .text('{"stroke": "#000", "stroke-width": "0.5px"}');
};

    // Set reservation boundary data
function setReservation(resBoundaries, map, path){
    map.append("path")
        .datum(resBoundaries)
        .attr("class", "reservation")
        .attr("d", path)
};

    // Set United States background map
function setStateBackground(stateBorders, path){
    var projection = d3.geoMercator()
        .center([0, 40])
        .rotate([96, 0])
        //.parallels([20, 40])
        .scale(width/3)
        .translate([width / 2, height / 2]);

    var path = d3.geoPath()
        .projection(projection);
    
    var map = d3.select("#map")
        .append("svg")
        .attr("class", "background")
        .attr("width", "50%")
        .attr("height", "75%");
    
    var states = map.selectAll(".states")
        .data(stateBorders)
        .enter()
        .append("path")
        .attr("class", function(d){
            return "states " + d.properties.STATE_NAME;
        })
        .attr("d", path)
};

    // Creates Reservation button and functionality
function setResText(res, map, path){
    d3.select("body")
    .append("div")
    .attr("height", "25")
    .attr("class", "resText")
    .text("Reservations")
    .on("click", function(){
        console.log(d3.select("d").empty());
        if(d3.select(".reservation").empty() === true){
            setReservation(res, map, path);
        }else d3.select(".reservation").remove();
    }) 
};
    
    // Sets Chart with bars and attributes
function setChart(csvData, colorScale){
    
    var chartTitle = d3.select("body")
        .append("chartText")
        .attr("class", "chartTitle");

    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");
    
    var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

    var bars = chart.selectAll(".bars")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return b[expressed]-a[expressed]
        })
        .attr("class", function(d){
            return "bars " + d.GeoID;
        })
        .attr("width", chartInnerWidth / csvData.length - 1)
        .style("opacity", .65)
        .on("mouseover", highlight)
        .on("mouseout", dehighlight)
        .on("mousemove", moveLabel);
    
    var desc = bars.append("desc")
        .text('{"stroke": "none", "stroke-width": "0px"}');
    
    var yAxis = d3.axisLeft(yScale);
    
    var axis = chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);
    
    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);
    
    updateChart(bars, csvData.length, colorScale);
};
    
    // Creates and populates attribute dropdown
function createDropdown(csvData){
    var dropdown = d3.select("body")
        .append("select")
        .attr("class", "dropdown")
        .on("change", function(){
            changeAttribute(this.value, csvData)
        });

    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select Attribute");

    var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d })
        .text(function(d){
            if (d == attrArray[0]) {
				d = t_navajo;
			} else if (d == attrArray[1]) {
				d = t_otherna;
			} else if (d == attrArray[2]) {
				d = t_spanish;
			} else if (d == attrArray[3]) {
				d = t_english;
			} else if (d == attrArray[4]) {
				d = t_verywell;
			} else if (d == attrArray[5]) {
				d = t_lessthanwell;
			};
			return d;
		});
};

    // Changes map attributes based on dropdown choice
function changeAttribute(attribute, csvData){
    expressed = attribute;

    var colorScale = makeColorScale(csvData);

    var regions = d3.selectAll(".regions")
        .transition()
        .duration(1000)
        .style("fill", function(d){
            return choropleth(d.properties, colorScale)
        });
    
    var bars = d3.selectAll(".bars")
        .sort(function(a, b){
            return b[expressed] - a[expressed];
        })
        .transition()
                .delay(function(d, i){
            return i * 20
        })

        updateChart(bars, csvData.length, colorScale);
        updateText(expressed);
};

    // Updates chart with new attributes
function updateChart(bars, n, colorScale){
    
    bars.attr("x", function(d, i){
            return i * (chartInnerWidth / n) + leftPadding;
        })
        .attr("height", function(d, i){
            return 460 - yScale(parseFloat(d[expressed]))+3;
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        .style("fill", function(d){
            return choropleth(d, colorScale);
        });
    
    if (expressed == attrArray[0]) {    
        var chartTitle = d3.select(".chartTitle")
            .text("Percentage of " + t_navajo);
    } else if (expressed == attrArray[1]) {
        var chartTitle = d3.select(".chartTitle")    
            .text("Percentage of " + t_otherna);
    } else if (expressed == attrArray[2]) {
        var chartTitle = d3.select(".chartTitle")    
            .text("Percentage of " + t_spanish);
    } else if (expressed == attrArray[3]) {
        var chartTitle = d3.select(".chartTitle")    
            .text("Percentage of " + t_english);
    } else if (expressed == attrArray[4]) {
        var chartTitle = d3.select(".chartTitle")    
            .text("Percentage that " + t_verywell);
    } else if (expressed == attrArray[5]) {
         var chartTitle = d3.select(".chartTitle")    
            .text("Percentage that  " + t_lessthanwell);
    };
};

    // Mouse over highlight function
function highlight(props){
    var selected = d3.selectAll("." + props.GeoID)
        .style("stroke", "#363128")
        .style("stroke-width", "2")
        .style("opacity", "1");
    setLabel(props);
};

    // Mouse out dehilight function
function dehighlight(props){
    var selected = d3.selectAll("." + props.GeoID)
        .style("stroke", function(){
            return getStyle(this, "stroke")
        })
        .style("stroke-width", function(){
            return getStyle(this, "stroke-width")
        })
        .style("opacity", ".75");

    function getStyle(element, styleName){
        var styleText = d3.select(element)
            .select("desc")
            .text();

        var styleObject = JSON.parse(styleText);

        return styleObject[styleName];
    };
    d3.select(".infolabel")
        .remove();
};

    // Set value for mouse over label
function setLabel(props){
    if (expressed == attrArray[0]){
        var label = t_navajo;
    } else if (expressed == attrArray[1]){
        var label = t_otherna;
    } else if (expressed == attrArray[2]){
        var label = t_spanish;
    } else if (expressed == attrArray[3]){
        var label = t_english;
    } else if (expressed == attrArray[4]){
        var label = t_verywell;
    } else if (expressed == attrArray[5]){
        var label = t_lessthanwell;
    };
    
    var labelAttribute = "<h2>" + props[expressed] +
        "%</h2><br><b>" + label + "</b>";

    var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", props.GeoID + "_label")
        .html(labelAttribute);

    var regionName = infolabel.append("div")
        .attr("class", "labelname")
        .html(props.Co_Name);
};

    // Function to move label with mouse
function moveLabel(){
    var labelwidth = d3.select(".infolabel")
        .node()
        .getBoundingClientRect()
        .width;
    
    var x1 = d3.event.clientX + 10,
        y1 = d3.event.clientY - 75,
        x2 = d3.event.clientX - labelwidth - 10,
        y2 = d3.event.clientY + 25;
    
    var x = d3.event.clientX > window.innerWidth - labelwidth - 20 ? x2 : x1;
    
    var y = d3.event.clientY < 75 ? y2 : y1;

    d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");
};

    // Set text panel and adds landing page text
function setText(){
    var textPanel = d3.select("#title")
    .append("div")
    .attr("class", "textPanel")
    .append("p")
    .text("The language you speak when you are at home with your family and loved ones is a reflection of your cultural identity. Cultural identity is shared within a group and gives a person a feeling of inclusion. Language reinforces and defines this inclusion within a group. Language can be seen as an anchor between a person and their cultural identity because in many ways it encodes the cultural worldview of the individual. In addition to simply allowing us to communicate with other members of our kind, language allows us to pass down myths, stories, history, and culture from one generation to the next. Language acts as a conduit for a people’s cultural heritage. In the American Southwest there have been waves of cultural expansion and intermixing, going back thousands of years. The aim of the accompanying map and chart is to explore the interplay between the languages and cultures living in the are in the present day. Enjoy.");
    
};

    // Updates text with attribute change
function updateText(props){
    var navajoText = "The Navajo language, or Diné Bizaad, with over 175,000 speakers is one of the most widely spoken Native American languages alive today. Even so, the Navajo were latecomers to the Southwest region. Unlike other native languages in the area, Diné Bizaad is Athabaskan in origin and is related to the languages spoken by native peoples in northern Canada. While the Navajo people have assimilated the customs and lifestyles of their neighbors, they have maintained a distinct cultural identity through, in part, to the preservation of their language."
    var othernaText = "While the language of the Navajo is the most widely spoken language in the area, the Southwest if home to a myriad of other Native American languages and cultures. Each culture is unique and has its own belief and customs. Unfortunately, it is not possible to represent all those peoples individually in the context of this map. Instead, they have been grouped into a single layer to give a feel just how endangered native language are in the Southwest. My apologies to those peoples for not better representing their individual cultures."
    var spanishText = "Spanish, or Español, is another prevalent language in the Southwest. Introduced with the arrival of the Spanish from Europe in the 16th century, it has spread throughout both North and South America. Spanish explorers visiting areas that would one day become 42 U.S. states. Currently it is the second most common language spoken in the United States with forty-five million speakers. The high proportion of Spanish speakers in the Southwest stems from the region at one time belonging to Mexico, which it acquired from Spain in 1821. The area was annexed by the U.S. after the Mexican-American War in the 1850’s. Spanish influence and culture has been incorporated throughout the Southwest and is deeply associated with the area."
    var englishText = "English is the most widely spoken language in the United States and represents the language spoken by the dominant culture of the country. Although it is not the official language of the country, it is seen as the default. For example, this webpage uses primarily English for its text simply because it will be the most widely understood. So ubiquitous is the language and so difficult to escape it’s influence in many Native American communities English has supplanted the traditional language. This has occurred for a number of reasons, most notably a program of Native American re-education beginning in the late 1870s."
    var elseText = "The last two maps represent the ability to speak English amongst Native American peoples. There are two categories: Those who speak English “Very Well” and those who speak English “Less Than Well.” This represents numbers of Native American who are to some extent bilingual and also speak their native languages."
    
    if (expressed == attrArray[0]){
        var textContent = d3.select(".textPanel p")
            .text(navajoText);
    } else if (expressed == attrArray[1]){
        var textContent = d3.select(".textPanel p")
            .text(othernaText);
    } else if (expressed == attrArray[2]){
        var textContent = d3.select(".textPanel p")
            .text(spanishText);
    } else if (expressed == attrArray[3]){
        var textContent = d3.select(".textPanel p")
            .text(englishText);
    } else if (expressed == attrArray[4]){
        var textContent = d3.select(".textPanel p")
            .text(elseText);
    } else if (expressed == attrArray[5]){
        var textContent = d3.select(".textPanel p")
            .text(elseText);
    };
};

})();