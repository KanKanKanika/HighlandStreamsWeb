import { useRef, useEffect } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import Graphic from "@arcgis/core/Graphic";

function ArcGISMap() {
  const mapDiv = useRef(null);

  useEffect(() => {
    if (!mapDiv.current) return;

    const map = new Map({
      basemap: "topo-vector",
    });

    const view = new MapView({
      container: mapDiv.current,
      map: map,
      center: [-4.2026, 56.4907],
      zoom: 5,
    });

    // -----------------------------------------------------
    // LOAD STATIONS + ADD MARKERS
    // -----------------------------------------------------
    view.when(function () {
      console.log("Map loaded — loading station markers...");

      // Load JSON dynamically (React-friendly import)
      import("../data/stations_metadata_all.json")
        .then((module) => {
          const stations = module.default;
          console.log("Stations loaded:", stations);

          stations.forEach((st) => {
            const lat = parseFloat(st.lat);
            const lon = parseFloat(st.lon);
            if (isNaN(lat) || isNaN(lon)) return;

            addStationMarker(lat, lon, st);
          });
        })
        .catch((err) => console.error("Failed loading stations:", err));


      // -----------------------------------------------------
      // FUNCTION → Add a marker for each station
      // -----------------------------------------------------
      function addStationMarker(lat, lon, attributes) {
        const pointGraphic = new Graphic({
          geometry: {
            type: "point",
            latitude: lat,
            longitude: lon,
          },
          symbol: {
            type: "simple-marker",
            color: "#aa4242",
            size: "10px",
            outline: {
              color: "white",
              width: 1,
            },
          },
          attributes: {
            station_no:(attributes.station_no),
            station_name: attributes.station_name,
            catchment_name: attributes.catchment_name,
          },
          popupTemplate: {
            title: "{station_name}",
            content:
              "<b>Station No:</b> {station_no}<br>" +
              "<b>Catchment:</b> {catchment_name}",
          },
          
        });

        view.graphics.add(pointGraphic);
      }
    });

    //------------------------------------------------------
    // CLEANUP WHEN COMPONENT UNMOUNTS
    //------------------------------------------------------
    return () => {
      if (view) view.destroy();
    };
  }, []);

  return (
    <div
      ref={mapDiv}
      style={{ width: "100%", height: "100vh" }}
    ></div>
  );
}

export default ArcGISMap;
