//JavaScript by Seth Frame
// https://bl.ocks.org/mbostock/2206590
(function(){

var attrArray = ["Navajo", "Other_NA", "Spanish", "English", "Very_Well", "Less_Than_Well"];
var expressed = attrArray[0];

var margin = {top: 10, left: 10, bottom: 10, right: 10},
    width = parseInt(d3.select('#map').style('width')),
    width = (width - margin.left - margin.right)/2,
    mapRatio = .3,
    height = width * mapRatio * 2,
    centered;

var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);

var pageTitleH= parseInt(d3.select('#title').style('height'));
    
var chartWidth = window.innerWidth * 0.97,
    chartHeight = (h - height - pageTitleH) * 0.75,
    leftPadding = 35,
    rightPadding = 2,
    topBottomPadding = 5,
    chartInnerWidth = chartWidth - leftPadding - rightPadding,
    chartInnerHeight = chartHeight - topBottomPadding * 2,
    translate = "translate(" + leftPadding + "," + topBottomPadding + ")";
    
var t_navajo = "Navajo speakers",
    t_otherna = "other Native American language speakers",
    t_spanish = "Spanish speakers",
    t_english = "English only speakers",
    t_verywell = "speak English very well",
    t_lessthanwell = "speak English less than well";

var yScale = d3.scaleLinear()
    .range([chartHeight - 10, 0])
    .domain([0, 100]);
    
window.onload = setMap(width, height);

function setMap(width, height){

    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);
    
    var projection = d3.geoAlbers()
        .center([0, 37])
        .rotate([110, 0])
        .parallels([25.9, 45.5])
        .scale(width * 2.8)
        .translate([width / 2, height / 2]);
    
    var path = d3.geoPath()
        .projection(projection);
    
    d3.queue()
        .defer(d3.csv, "data/County_Attributes.csv")
        .defer(d3.json, "data/counties.topojson")
        .await(callback);
    
    function callback(error, csvData, co){
        
        console.log(co);
        
        var langCounties = topojson.feature(co, co.objects.Counties).features;
        
        langCounties = joinData(langCounties, csvData);
        
        var colorScale = makeColorScale(csvData);
        
        setEnumerationUnits(langCounties, map, path, colorScale);

        createDropdown(csvData);
        setText();
        setChart(csvData, colorScale);
        
    };
};
    
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

function choropleth(props, colorScale){
    var val = parseFloat(props[expressed]);
    if (typeof val == 'number' && !isNaN(val)){
        return colorScale(val);
    } else {
        return "#CCC";
    };
};

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
    
function setChart(csvData, colorScale){

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
    
    var chartTitle = chart.append("text")
        .attr("x", chartWidth/2.75)
        .attr("y", 25)
        .attr("class", "chartTitle")
    
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
            .text("Percentage of " + t_navajo + " per county");
    } else if (expressed == attrArray[1]) {
        var chartTitle = d3.select(".chartTitle")    
            .text("Percentage of " + t_otherna + " per county");
    } else if (expressed == attrArray[2]) {
        var chartTitle = d3.select(".chartTitle")    
            .text("Percentage of " + t_spanish + " per county");
    } else if (expressed == attrArray[3]) {
        var chartTitle = d3.select(".chartTitle")    
            .text("Percentage of " + t_english + " per county");
    } else if (expressed == attrArray[4]) {
        var chartTitle = d3.select(".chartTitle")    
            .text("Percentage of Native Americans that " + t_verywell + " per county");
    } else if (expressed == attrArray[5]) {
         var chartTitle = d3.select(".chartTitle")    
            .text("Percentage of Native Americans that  " + t_lessthanwell + " per county");
    };
};

function highlight(props){
    var selected = d3.selectAll("." + props.GeoID)
        .style("stroke", "#363128")
        .style("stroke-width", "2")
        .style("opacity", "1");
    setLabel(props);
};

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
    
    var labelAttribute = "<h1>" + props[expressed] +
        "%</h1><br><b>" + label + "</b>";

    var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", props.GeoID + "_label")
        .html(labelAttribute);

    var regionName = infolabel.append("div")
        .attr("class", "labelname")
        .html(props.NAME);
};

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

function setText(){
    var chart = d3.select("body")
    .append("div")
    .attr("width", width-50)
    .attr("height", height-50)
    .attr("class", "textPanel")
    .append("p")
    .text("Welcome, feel free to explore language useage statistics of the Southwestern United States.");
    
};

function updateText(props){
    var navajoText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus elementum eu elit nec laoreet. Vestibulum facilisis arcu est, vitae pellentesque nibh imperdiet ut. Morbi semper vehicula bibendum. Nulla tristique augue lorem, quis interdum tortor tempor ac. Aenean elementum quis urna id pretium. Vivamus at ante venenatis metus fringilla sodales non vel nisi. Mauris pellentesque tincidunt orci, vel euismod metus porttitor id. Curabitur vel urna nec est semper accumsan nec non diam. Aenean finibus dapibus pellentesque. Nunc feugiat velit nec nisi pulvinar, pulvinar bibendum dui cursus. Aliquam imperdiet ultrices congue."
    var othernaText = "Nunc accumsan lectus id eros vulputate consectetur. Praesent consequat facilisis quam sed porttitor. Cras eget mauris nec ipsum semper interdum. Maecenas ut orci vulputate, faucibus diam sed, dignissim nulla. Aliquam vulputate urna non justo pretium porttitor non a ante. Pellentesque nec sodales velit. In id vulputate leo, vitae aliquam dolor. Aliquam elit felis, lacinia in ex ac, fermentum accumsan elit. Etiam varius, nibh non suscipit pulvinar, lacus erat commodo massa, non mollis diam metus ut quam. Nulla facilisi. Nam vulputate leo eget eros rutrum semper."
    var spanishText = "Duis laoreet sapien lorem. Fusce dignissim quam eu eros dictum commodo eget eget lacus. Sed faucibus lectus id auctor semper. Aenean pulvinar ultrices venenatis. Aenean eleifend quam eleifend, fringilla tellus sed, iaculis lorem. Ut sit amet mauris felis. In a metus id dolor rhoncus molestie at in urna. Curabitur tellus nunc, ultrices vel nisi tincidunt, sagittis volutpat sem. Curabitur in justo sed velit porta varius."
    var englishText = "Vestibulum eget maximus dolor. Etiam ullamcorper nunc nec ipsum interdum sodales. Aliquam fringilla eget arcu a mattis. Duis sed gravida massa, vestibulum aliquet velit. Phasellus vitae placerat velit, non sodales tortor. Proin vehicula tempor ex quis efficitur. Phasellus mattis vel neque accumsan consectetur. Maecenas commodo sed lorem vehicula mattis. Integer condimentum orci risus, eu tristique augue consequat at. Proin cursus ac ex a feugiat. Nulla facilisi. Nulla ipsum odio, vulputate sit amet sapien in, consectetur viverra sapien. Suspendisse ut cursus tortor, eget vehicula quam. Morbi lacinia urna eget lacinia varius. Cras consequat quis orci sit amet mollis."
    var elseText = "Aliquam sollicitudin nec purus a vehicula. Vivamus lobortis sit amet odio nec facilisis. Ut sem ante, porta nec cursus ut, ullamcorper vel elit. Pellentesque eget lorem elementum nunc pulvinar consectetur. Pellentesque venenatis ipsum eu purus semper, quis efficitur enim iaculis. Donec dui odio, imperdiet quis metus eu, euismod fermentum lacus. Pellentesque ac enim non orci volutpat tincidunt. Donec lacinia aliquet viverra. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Suspendisse ut risus at libero finibus convallis sed aliquam orci. Quisque ornare justo dolor, in vulputate turpis rhoncus vel. Duis placerat ullamcorper massa vitae auctor. Suspendisse eget lectus iaculis, tristique neque vel, sagittis velit. Nulla ultricies bibendum nulla. Sed scelerisque augue vel lorem dapibus, non semper magna mollis"
    
    if (expressed == attrArray[0]){
        var chartTitle = d3.select(".textPanel p")
            .text(navajoText);
    } else if (expressed == attrArray[1]){
        var chartTitle = d3.select(".textPanel p")
            .text(othernaText);
    } else if (expressed == attrArray[2]){
        var chartTitle = d3.select(".textPanel p")
            .text(spanishText);
    } else if (expressed == attrArray[3]){
        var chartTitle = d3.select(".textPanel p")
            .text(englishText);
    } else if (expressed == attrArray[4]){
        var chartTitle = d3.select(".textPanel p")
            .text(elseText);
    } else if (expressed == attrArray[5]){
        var chartTitle = d3.select(".textPanel p")
            .text(elseText);
    };
};

})();