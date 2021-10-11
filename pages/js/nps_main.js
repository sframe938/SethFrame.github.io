//JavaScript by Seth Frame

// Create the base map usng Mapbox layers
function createMap() {
    var map = L.map('map', {
        center: [40, -96],
        zoom: 4,
        minZoom: 3,
        maxZoom: 14,
        zoomControl: false
    });
    
    L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1Ijoic2ZyYW1lOTM4IiwiYSI6ImNqN2RweG9ydjBkenIycWt5Z2c5NWtsajcifQ.bA0BviPhPcygQREBZd0cdQ', {
        attribution:"Thank You Mapbox and the National Park Service",
        minZoom: 3,
        maxZoom: 14,
        detectRetina: true
    }).addTo(map);
    
    L.control.scale().addTo(map);
    
    L.control.zoom({
        position:'bottomright'
    }).addTo(map);

    getData(map); 
}

// Calculate the radius for each circle marker
function calcPropRadius(attValue) {
    var scaleFactor = .0002;
    var area = attValue * scaleFactor;
    var radius = Math.sqrt(area/Math.PI);

    return radius;
}

// Creates an array of all of the visitation columns for each year
function processData(data){
    var attributes = [];

    var properties = data.features[0].properties;

    for (var attribute in properties){
        if (attribute.indexOf("Vis") > -1){
            attributes.push(attribute);
        }
    }
    return attributes;
}

// Creates filter values
function filterFeatures(feature, filter){
    return (filter === "all") ? true : feature.properties[filter];
}

// Creates the park legend and returns the filter value based on the 'active' button class
function createLegendControls(map, feature){
    $('.NPS').append('<button title="Top 20 Most Visited NPS Properties, by Average Visitation " data-filter="Popular" class="active"><img src="images/nps/other.png" alt= "Most Popular" align="left" hspace="20" width="20" height="20">Most Visited</button>');
    $('.NPS').append('<button title="National Parks" data-filter="Park"><img src="images/nps/park.png" alt= "Park" align="left" hspace="20" width="20" height="20">Park</button>');
    $('.NPS').append('<button title="National Monuments" data-filter="Monument"><img src="images/nps/monument.png" alt= "Monument" align="left" hspace="20" width="20" height="20">Monument</button>');
    $('.NPS').append('<button title="National Historical Parks and Sites" data-filter="Historic"><img src="images/nps/historic.png" alt= "Historic" align="left" hspace="20" width="20" height="20">Historic</button>');
    $('.NPS').append('<button title="National Memorials" data-filter="Memorial"><img src="images/nps/memorial.png" alt= "Memorial" align="left" hspace="20" width="20" height="20">Memorial</button>');
    $('.NPS').append('<button title="National Preserves" data-filter="Preserve"><img src="images/nps/preserve.png" alt= "Preserve" align="left" hspace="20" width="20" height="20">Preserve</button>');
    $('.NPS').append('<button title="National Recreation Areas" data-filter="Recreation"><img src="images/nps/recreation.png" alt= "Recreation Area" align="left" hspace="20" width="20" height="20">Recreation</button>');
    $('.NPS').append('<button title="National Military Parks and Battlefields" data-filter="Military"><img src="images/nps/military.png" alt= "Military" align="left" hspace="20" width="20" height="20">Military</button>');
    $('.NPS').append('<button title="National Seashores and Lakeshores" data-filter="Shoreline"><img src="images/nps/shoreline.png" alt= "Shoreline" align="left" hspace="20" width="20" height="20">Shoreline</button>');
    $('.NPS').append('<button title="All NPS Properties" data-filter="all"><img src="images/nps/other.png" alt= "All" align="left" hspace="20" width="20" height="20">All NPS</button>');
    
    $('.NPS button').click(function(){      
        $(this).addClass('active').siblings().removeClass('active');
    });
    var filterValue = $('.NPS .active').attr('data-filter');
    console.log(filterValue);
    return filterValue;
}

// Updates the map when a new legend button is clicked
function updateFilter(data, map, attributes){
    $('.NPS button').click(function(){
        var filter = $('.NPS .active').attr('data-filter');
        var index = $('.range-slider').val();
        map.eachLayer(function (layer) {
            console.log(layer._leaflet_id);
            if (layer._leaflet_id != 21) return map.removeLayer(layer);
        });
        console.log(filter);
        L.geoJson(data, {
            filter: function(feature, layer){
                return filterFeatures(feature, filter);
            },
            pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
            }
        }).addTo(map);
        updatePropSymbols(map, attributes[index]);
    });
}

// Creates the sequence control slider
function createSequenceControls(map, attributes){
    $('#slider').append('<input class="range-slider" type="range">');
    
    
    $('.range-slider').attr({
        max: 9,
        min: 0,
        value: 0,
        step: 1
    });
    
    $('#slider').append('<button class="skip" id="reverse">Reverse</button>');
    $('#slider').append('<button class="skip" id="forward">Skip</button>');
    $('#reverse').html('<img src="images/nps/back_circle.png">');
    $('#forward').html('<img src="images/nps/forward_circle.png">');
    
    $('.skip').click(function(){
        var index = $('.range-slider').val();
        if ($(this).attr('id') == 'forward'){
            index++;

            index = index > 9 ? 0 : index;
        } else if ($(this).attr('id') == 'reverse'){
            index--;

            index = index < 0 ? 9 : index;
        }


        $('.range-slider').val(index);
        updatePropSymbols(map, attributes[index]);
    });
    
    $('.range-slider').on('input', function(){
        var index = $(this).val();
       updatePropSymbols(map, attributes[index]);
    });
    
}

// Creates the options for each circle marker and popup content
function pointToLayer(feature, latlng, attributes){
    var attribute = attributes[0];
    var colorToUse;
    var point = feature.properties.Type;
    
    if (point === "Park") colorToUse = "#550000";
    else if (point === "Monument") colorToUse = "#aa3939";
    else if (point === "Historic") colorToUse = "#552700";
    else if (point === "Memorial") colorToUse = "#aa6c39";
    else if (point === "Military") colorToUse = "#003333";
    else if (point === "Preserve") colorToUse = "#004400";
    else if (point === "Recreation Area") colorToUse = "#2d882d";
    else if (point === "Shoreline") colorToUse = "#226666";
    else colorToUse = "black";
    
    var options = {
        fillColor: colorToUse,
        color: "#ffffff",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };
    
    var attValue = Number(feature.properties[attribute]);
    options.radius = calcPropRadius(attValue);
    var layer = L.circleMarker(latlng, options, {
        title: feature.properties.Name
    });
    
    var year = attribute.split("_")[1];
    $('#slider').append('<a id="Year" align+"text-center"></a>');
    $("#Year").html("<b>Display Year: </b>" + year);
    var popupContent = "<p><b>Park Name:</b><br>"+feature.properties.Name+"</p><p><b>"+year+" Visitation:</b><br>"+Number(feature.properties[attribute]).toLocaleString()+"<br><br>Click for more information";
    layer.bindPopup(popupContent, {
        closeButton: false
    });

    
    layer.on({
        mouseover: function(){
            this.openPopup();
        },
        mouseout: function(){
            this.closePopup();
        },
        click: function(){
            $("#info").remove();
            
            $('#panel').append('<ul id="info"></ul>');
            $('#info').append('<li><a id="Name"></a></li>');
            $('#info').append('<li><a id="Type"></a></li>');
            $('#info').append('<li><a id="State"></a></li>');
            $('#info').append('<li><a id="Region"></a></li>');
            $('#info').append('<li><a id="Vis"></a></li>');
            $('#info').append('<li><a id="URL"></a></li>');
            
            
            $("#Name").html('<mark class="category">Park Name:</mark><br>' + feature.properties.Name);
            $("#Type").html('<mark class="category">Park Type:</mark><br>' + feature.properties.Type);
            $("#State").html('<mark class="category">State:</mark><br>' + feature.properties.STATE);
            $("#Region").html('<mark class="category">Region:</mark><br>' + feature.properties.REGION);
            $("#Vis").html('<mark class="category">Average Visitation:</mark><br>' + Number(feature.properties.Average).toLocaleString());
            $("#URL").html('<mark class="category">NPS Property Website:</mark><br><a href="https://www.nps.gov/' + feature.properties.UNIT_CODE + '/index.htm" target="_blank">www.NPS.gov</a');
        }
    });
    
    return layer;
}

// Creates the proportional circle markers from geJSON and adds it to the map
function createPropSymbols(data, map, attributes){
    var filter = createLegendControls(map);
    L.geoJson(data, {
        filter: function(feature, layer){
            return filterFeatures(feature, filter);
        },
        pointToLayer: function(feature, latlng){
          return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(map);
}

// Updates the proportional symbols and popup content based on slider values
function updatePropSymbols(map, attribute){
    map.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){
            var props = layer.feature.properties;
            
            var radius = calcPropRadius(props[attribute]);
            layer.setRadius(radius);
            
            var year = attribute.split("_")[1];
            $("#Year").html("<b>Display Year: </b>" + year);
            var popupContent = "<p><b>Park Name:</b><br>"+layer.feature.properties.Name+"</p><p><b>"+year+" Visitation:</b><br>"+Number(layer.feature.properties[attribute]).toLocaleString()+"<br><br>Click for more information";
            layer.bindPopup(popupContent, {
                closeButton: false
            });
        }
    });
}


// Grabs the geoJSON data and passes it to other functions
function getData(map){
    $.ajax("data/NPS_Points_Visitation.geojson", {
        dataType: "json",
        success: function(response){
            var attributes = processData(response);
            console.log(attributes);
            createSequenceControls(map, attributes);
            createPropSymbols(response, map, attributes);
            updateFilter(response, map, attributes);
        }
    });
}

$(document).ready(createMap);

//"data/NPS_Points_Visitation.geojson"