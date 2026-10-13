locationiq.key = mapToken;
//Define the map and configure the map's theme
var map = new maplibregl.Map({
    container: 'map',
    style: locationiq.getLayer("Streets"),
    zoom: 12,
    center: [80.8322, 24.6005] //Format (E, N)
});

//Add markers from geojson. This list can be generated dynamically with an AJAX call as well.
var geojson = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": {
                "message": "Foo",
                "iconSize": [60, 60]
            },
            "geometry": {
                "type": "Point",
                "coordinates": [
                    -122.421953,
                    37.764966
                ]
            }
        },
        {
            "type": "Feature",
            "properties": {
                "message": "Bar",
                "iconSize": [50, 50]
            },
            "geometry": {
                "type": "Point",
                "coordinates": [
                    -122.464677,
                    37.777209
                ]
            }
        },
        {
            "type": "Feature",
            "properties": {
                "message": "Baz",
                "iconSize": [40, 40]
            },
            "geometry": {
                "type": "Point",
                "coordinates": [
                    -122.484948,
                    37.780090
                ]
            }
        }
    ]
};

//Add markers to map
//https://www.mapbox.com/mapbox-gl-js/api#marker
geojson.features.forEach(function(marker) {
    // create a DOM element for the marker
    var el = document.createElement('div');
    el.className = 'marker';
    el.style.backgroundImage = 'url(https://tiles.locationiq.com/static/images/marker50px.png)';
    el.style.width = '50px';
    el.style.height = '50px';

    //Instead of this click listener, we can attach a popup / infowindow to this marker (see next section)
    el.addEventListener('click', function() {
        window.alert(marker.properties.message);
    });

    // add marker to map
    new maplibregl.Marker(el)
        .setLngLat(marker.geometry.coordinates)
        .addTo(map);
});
