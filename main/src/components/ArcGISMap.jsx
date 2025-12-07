import { useRef, useEffect } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";

function ArcGISMap() {
  const mapDiv = useRef(null);

  useEffect(() => {
    if (mapDiv.current) {

      const map = new Map({
        basemap: "topo-vector", 
      });

      const view = new MapView({
        container: mapDiv.current, 
        map: map,
        center: [-4.2026, 56.4907], 
        zoom: 5, 
      });

    }
  }, []);

  return (
    <div
      ref={mapDiv}
      style={{ width: "100%", height: "100vh" }}
    ></div>
  );
}

export default ArcGISMap;