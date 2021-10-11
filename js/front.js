$(function () {

    // ---------------------------------------------- //
    // Navbar
    // ---------------------------------------------- //

    $(document).scroll(function () {
        if ($(window).scrollTop() >= $('header').offset().top) {
            $('nav').addClass('sticky');
        } else {
            $('nav').removeClass('sticky');
        }
    });


    // ---------------------------------------------- //
    // Scroll Spy
    // ---------------------------------------------- //

    $('body').scrollspy({
        target: '.navbar',
        offset: 80
    });

    // ---------------------------------------------- //
    // Preventing URL update on navigation link click
    // ---------------------------------------------- //

    $('.navbar-nav a, #scroll-down').bind('click', function (e) {
        var anchor = $(this);
        $('html, body').stop().animate({
            scrollTop: $(anchor.attr('href')).offset().top
        }, 1000);
        e.preventDefault();
    });

    // ------------------------------------------------------ //
    // styled Google Map
    // ------------------------------------------------------ //

    map();


    // ------------------------------------------------------ //
    // For demo purposes, can be deleted
    // ------------------------------------------------------ //

    var stylesheet = $('link#theme-stylesheet');
    $("<link id='new-stylesheet' rel='stylesheet'>").insertAfter(stylesheet);
    var alternateColour = $('link#new-stylesheet');

    if ($.cookie("theme_csspath")) {
        alternateColour.attr("href", $.cookie("theme_csspath"));
    }

    $("#colour").change(function () {

        if ($(this).val() !== '') {

            var theme_csspath = 'css/style.' + $(this).val() + '.css';

            alternateColour.attr("href", theme_csspath);

            $.cookie("theme_csspath", theme_csspath, {
                expires: 365,
                path: document.URL.substr(0, document.URL.lastIndexOf('/'))
            });

        }

        return false;
    });

});


// ------------------------------------------------------ //
// styled Google Map
// ------------------------------------------------------ //

function map() {

    var mapId = 'map';

    if ($('#' + mapId).length > 0) {

        var dragging = false,
            tap = false;

        if ($(window).width() > 700) {
            dragging = true;
            tap = true;
        }

        var map = L.map(mapId, {
            center: [40, -96],
            zoom: 4,
            dragging: dragging,
            tap: tap,
            zoomControl: false,
            scrollWheelZoom: false
        });
        
        var zoomHome = L.Control.zoomHome();
        zoomHome.addTo(map);

        L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1Ijoic2ZyYW1lOTM4IiwiYSI6ImNqN2RweG9ydjBkenIycWt5Z2c5NWtsajcifQ.bA0BviPhPcygQREBZd0cdQ', {
            minZoom: 3,
            maxZoom: 14,
            detectRetina: true
        }).addTo(map);

        map.once('focus', function () {
            map.scrollWheelZoom.enable();
        });
    
        
        getData(map);
    }

}

// Creates an array of all of the columns
function processData(data){
    var attributes = [];

    var properties = data.features[0].properties;

    for (var attribute in properties){
        attributes.push(attribute); 
    }
    return attributes;
}

// Creates the options for each circle marker and popup content
function pointToLayer(feature, latlng, attributes, map){
    var attribute = attributes[0];
    var colorToUse;
    var point = feature.properties.TYPE;
    
    if (point === "job") urlToUse = "img/work.png";
    else if (point === "school") urlToUse = "img/school.png";
    else urlToUse = "img/marker.png";
    
    var icon = L.icon({
        iconUrl: urlToUse,
        iconSize: [15, 15],
        popupAnchor: [0, -18],
        tooltipAnchor: [0, 19]
    })
    
    var layer = L.marker(latlng, {
        icon: icon,
        title: feature.properties.Name
    }).addTo(map);
    
    layer.bindPopup("<div class='p-4'><br><strong>"+feature.properties.Position+"<br><i>"+feature.properties.Name+"</i></strong><p><i>"+feature.properties.Location+"</i>", {
        minwidth: 200,
        maxWidth: 600,
        className: 'map-custom-popup'
    })
    
    layer.on('click', function(e){
        map.flyTo(e.latlng, 8);
        $(".show").removeClass("show");
        $("#"+feature.properties.Id).addClass("show");
    })
    
    layer.getPopup().on('remove', function() {
        map.flyTo([40, -96], 4);
        $(".show").removeClass("show");
    });
    
    return layer;
}

// Creates the  markers from geJSON and adds it to the map
function createPropSymbols(data, map, attributes){
    L.geoJson(data, {
        pointToLayer: function(feature, latlng){
          return pointToLayer(feature, latlng, attributes, map);
        }
    }).addTo(map);
}


// Grabs the geoJSON data and passes it to other functions
function getData(map){
    $.ajax("data/mapLocations.geojson", {
        dataType: "json",
        success: function(response){
            var attributes = processData(response);
            createPropSymbols(response, map, attributes);
        }
    });
}
