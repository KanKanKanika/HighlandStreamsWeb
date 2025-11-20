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

  // ------------- ADD STATIONS  -------------
  view.when(function () {

    fetch('Data/stations_for_sql.csv')
      .then(response => response.text())
      .then(text => {
        
        const rows = text.trim().split(/\r?\n/);
        const headers = rows.shift().split(',');
        const stations = rows.map(line => {
          const cols = line.split(',');
          const obj = {};
          headers.forEach((h, i) => {
            obj[h.trim()] = cols[i] ? cols[i].trim() : '';
          });
          return obj;
        });

        stations.forEach(st => {
          const lat = parseFloat(st.lat);
          const lon = parseFloat(st.lon);

          if (!isNaN(lat) && !isNaN(lon)) {

            const pointGraphic = new Graphic({
              geometry: {
                type: "point",
                latitude: lat,
                longitude: lon
              },
              symbol: {
                type: "simple-marker",
                color: "#aa4242",
                size: "10px",
                outline: {
                  color: "white",
                  width: 1
                }
              }
            });

            view.graphics.add(pointGraphic);
          }
        });

        console.log("✔ Station points added to map.");
      })
      .catch(err => console.error("Error loading stations:", err));
  });

});
