//JavaScript by Seth Frame

//layer0, layer1, layer2, layer3, layer4, layer5, layer6
window.currentLoc = undefined;

function createMap() {
    var map = L.map('map', {
        center: [48.01, -88.75],
        zoom: 10.45,
        minZoom: 5,
        maxZoom: 13,
        zoomControl: false
    });
    
    var worldOceans = L.esri.basemapLayer("Oceans").addTo(map),
        streets = L.esri.basemapLayer("Streets").addTo(map)
    
    worldOceans.id = 'oceans';
    streets.id = 'streets';
    
    var baseMaps = {
        "Streets": streets,
        "World Oceans": worldOceans
    };
    
    L.control.layers(baseMaps, null).addTo(map);
    
    addData(map);
    
    var arcgisOnline = L.esri.Geocoding.arcgisOnlineProvider();
    
    var searchControl = L.esri.Geocoding.geosearch({
        providers: [
          L.esri.Geocoding.featureLayerProvider({
            url: 'https://services1.arcgis.com/mwsf7nFERxYpMBQG/arcgis/rest/services/ISRO_Points_of_Interest/FeatureServer/0',
            searchFields: ['type','name'],
            label: 'Points of Interest',
            bufferRadius: 100,
            formatSuggestion: function(feature){
              if(feature.properties.type.toUpperCase() == 'CAMPGROUND' || feature.properties.type.toUpperCase() == 'LOOKOUT'){
                  return feature.properties.type + " - " + feature.properties.latitude + ', ' + feature.properties.longitude;
              } else{return feature.properties.name;}
            }
          })
        ]
      }).addTo(map);
    
    $('#home-extent').click(function(){
      map.setView(map.options.center, map.options.zoom);
    });
    
    $('#zoom-in').click(function(){
      map.setZoom(map.getZoom() + 1)
    });
    
    $('#zoom-out').click(function(){
      map.setZoom(map.getZoom() - 1)
    });
    
    $('#user-loc').click(function(location){
        var userIcon = L.icon({
            iconUrl: 'images/isro/user.png',
            iconSize: [20, 20],
            iconAnchor: [0, -11],
        });
        
      map.locate({setView: true, maxZoom: 13})
        .on('locationfound', function(e){window.currentLoc = L.marker([e.latitude, e.longitude], {icon: userIcon}).addTo(map)})
    });
    
    $('.dropup-content li').click(function(){
        if(this.className == 'enable active'){
            $(this).removeClass('enable active').addClass('enable');
        } else {
            $(this).addClass('active').siblings().removeClass('active').addClass('enable')};
        updateLayers(map);
    });
    
    $('#sighting').click(function(){
        console.log("Wolf Sighting!");
        $('.leaflet-interactive').css('cursor','crosshair');
        $("#info").remove();
        
        map.on('click', function(e){
            window.currentLoc = L.marker(e.latlng);
            console.log(window.currentLoc);
            $('.leaflet-interactive').css('cursor','grab');
        
            $('form').append('<ul id="info"></ul>');
            $('#info').append('<li><a id="SightingType"></a></li>');
            $('#info').append('<li><a id="Description"></a></li>');
            $('#info').append('<button type="button" id="submit" value="Submit">Submit</button>');
            $('#info').append('<button type="button" id="resetForm" value="Reset">Reset</button>');
            $('#info').append('<button type="button" id="close" value="Close">Close</button>')

            $("#SightingType").html('<p>Sighting Type: <select id="sighttype" name="SightingType"></p>');
            $("#sighttype").append('<option class="" disabled selected>Make a selection</option>');
            $("#sighttype").append('<option value="Close">Close</option>');
            $("#sighttype").append('<option value="Middle Distance">Middle Distance</option>');
            $("#sighttype").append('<option value="Distant">Distant</option>');
            $("#Description").html('<p>Description: <input type="text" id="desc" name="Description" placeholder="Enter Description" value=""></p>');

            $('#submit').click(function(){
                console.log("Submit Report");
                event.preventDefault();
                var a = $("#sightingform").serializeArray();
                a = a.filter(function(item){return item.value != '';});
                
                var wolf_layer = undefined;

                map.eachLayer(function (layer) {
                    if (layer.id == 'park_wolf') return wolf_layer = layer;
                });
                
                createNewSighting(a, wolf_layer);

                $("#info").remove();
                alert("Wolf Sighting Submitted!");
                map.setView(map.options.center, map.options.zoom);
            });

            $('#resetForm').click(function(){
                console.log("Reset Report");
                event.preventDefault();
            });

            $('#close').click(function(){
                console.log("Close Sighting Window");
                event.preventDefault();
                $("#info").remove();
                map.setView(map.options.center, map.options.zoom);
                $('.leaflet-interactive').css('cursor','pointer');
            });
        });
    });
}

function createNewSighting(a, layer) {
    var sighting = window.currentLoc.toGeoJSON();
    sighting.properties.layer_ID = 6;
    sighting.properties.sighting_t = a[0].value;
    sighting.properties.descriptio = a[1].value;

    console.log(sighting);
    
    layer.addFeature(sighting, function (err, response) {
        console.log(response);
  });
}

function addData(map) {
    var wolf = $('#wolf'),
        poi = $('#poi'),
        ferry = $('#ferry'),
        trail = $('#trail'),
        stream = $('#stream'),
        lake = $('#lake'),
        bound = $('#bound');
    
    var icons = {
        Campground: L.icon({
            iconUrl: 'images/isro/campsite-black-22.svg',
            iconSize: [14, 14],
            popupAnchor: [0, -11],
        }),
        Lighthouse: L.icon({
            iconUrl: 'images/isro/lighthouse-black-22.svg',
            iconSize: [14, 14],
            popupAnchor: [0, -11],
        }),
        Lookout: L.icon({
            iconUrl: 'images/isro/lookout-tower-black-22.svg',
            iconSize: [14, 14],
            popupAnchor: [0, -11],
        }),
        Visitor: L.icon({
            iconUrl: 'images/isro/ranger-station-black-22.svg',
            iconSize: [14, 14],
            popupAnchor: [0, -11],
        }),
        Mine: L.icon({
            iconUrl: 'images/isro/dot-black-22.svg',
            iconSize: [14, 14],
            popupAnchor: [0, -11],
        }),
        Peak: L.icon({
            iconUrl: 'images/isro/peak.png',
            iconSize: [14, 14],
            popupAnchor: [0, -11],
        }),
    };
    
    var park_boundary = L.esri.featureLayer({
        url: 'https://services1.arcgis.com/mwsf7nFERxYpMBQG/arcgis/rest/services/ISRO_Park_Boundary/FeatureServer/0',
        style: {color: 'green', weight: 1, opacity: 0}
    });
    park_boundary.id = 'park_boundary';
    
    var park_lakes = L.esri.featureLayer({
        url: 'https://services1.arcgis.com/mwsf7nFERxYpMBQG/arcgis/rest/services/lakes/FeatureServer/0',
        style: {color: 'blue', weight: 1}
    });
    park_lakes.id = 'park_lakes';
    
    var park_streams = L.esri.featureLayer({
        url: 'https://services1.arcgis.com/mwsf7nFERxYpMBQG/arcgis/rest/services/streams/FeatureServer/0',
        style: {color: 'blue', weight: 1}
    });
    park_streams.id = 'park_streams';
    
    var park_trails = L.esri.featureLayer({
        url: 'https://services1.arcgis.com/mwsf7nFERxYpMBQG/arcgis/rest/services/ISRO_Trails/FeatureServer/0',
        style: {color: 'brown', weight: 1, dashArray: 4}
    });
    park_trails.id = 'park_trails';
    
    var park_ferry_routes = L.esri.featureLayer({
        url: 'https://services1.arcgis.com/mwsf7nFERxYpMBQG/arcgis/rest/services/ISRO_Ferry_Routes/FeatureServer/0',
        style: {color: 'blue', weight: 1, dashArray: 4}
    });
    park_ferry_routes.id = 'park_ferry_routes';
    
    var park_poi = L.esri.featureLayer({
        url: 'https://services1.arcgis.com/mwsf7nFERxYpMBQG/arcgis/rest/services/ISRO_Points_of_Interest/FeatureServer/0',
        pointToLayer: function (geojson, latlng) {
          return L.marker(latlng, {
            icon: icons[geojson.properties.type]
          });
        },
    });
    park_poi.id = 'park_poi';
    
    park_poi.bindPopup(function(evt) {
        if(evt.feature.properties.type.toUpperCase() == 'CAMPGROUND' || evt.feature.properties.type.toUpperCase() == 'LOOKOUT'){
            return L.Util.template('<h3>{type}</h3><hr>Latitude: </hr>{latitude}<br><hr>Longitude: </hr>{longitude}', evt.feature.properties);
        }else{return L.Util.template('<h3>{type}</h3><hr>Name: </hr>{name}', evt.feature.properties);}
    });
    
    var park_wolf = L.esri.featureLayer({
        url: 'https://services1.arcgis.com/mwsf7nFERxYpMBQG/arcgis/rest/services/ISRO_Wolf_Sightings/FeatureServer/0',
        pointToLayer: function (geojson, latlng) {
            return L.marker(latlng, {
            icon: L.icon({
                    iconUrl: 'images/isro/wolf.png',
                    iconSize: [16, 16],
                    popupAnchor: [0, -11],
                }),
            });
        }
    });
    park_wolf.id = 'park_wolf';
    
    park_wolf.bindPopup(function(evt) {
        return L.Util.template('<h3>Wolf Sighting</h3><hr>Type: </hr>{sighting_t}<br><hr>Description: </hr>{descriptio}', evt.feature.properties);
    });
    
    if(wolf.attr('class') == 'enable'&& poi.attr('class') == 'enable' && ferry.attr('class') == 'enable' && trail.attr('class') == 'enable' && stream.attr('class') == 'enable' && lake.attr('class') == 'enable' && bound.attr('class') == 'enable'){
        park_wolf.addTo(map);
        park_poi.addTo(map);
        park_ferry_routes.addTo(map);
        park_trails.addTo(map);
        park_streams.addTo(map);
        park_lakes.addTo(map);
        park_boundary.addTo(map);
    } else {
       if(wolf.attr('class') == 'enable active'){
           park_wolf.addTo(map); 
        }else {}
        if(poi.attr('class') == 'enable active'){
           park_poi.addTo(map); 
        }else {}
        if(ferry.attr('class') == 'enable active'){
           park_ferry_routes.addTo(map); 
        }else {}
        if(trail.attr('class') == 'enable active'){
           park_trails.addTo(map); 
        }else {}
        if(stream.attr('class') == 'enable active'){
           park_streams.addTo(map); 
        }else {}
        if(lake.attr('class') == 'enable active'){
           park_lakes.addTo(map); 
        }else {}
        if(bound.attr('class') == 'enable active'){
           park_boundary.addTo(map); 
        }else {}
    }
}

function updateLayers(map){
    map.eachLayer(function (layer) {
        if (layer.id == 'oceans' || layer.id == 'streets') {
            
        }else {return map.removeLayer(layer)};
    });
    addData(map);
}

$(document).ready(createMap);