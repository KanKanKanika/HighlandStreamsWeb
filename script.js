require([
  "esri/Map",
  "esri/views/MapView",
  "esri/Graphic"
], function(Map, MapView, Graphic) {

  // ---------------- CREATE MAP -------------------------
  var map = new Map({
    basemap: "topo-vector"
  });

  var view = new MapView({
    container: "map",
    map: map,
    center: [-4.2026, 56.4907], 
    zoom: 4
  });

});



