import { useRef, useEffect } from "react";
import MapView from "@arcgis/core/views/MapView";
import Map from "@arcgis/core/Map";
import Locate from "@arcgis/core/widgets/Locate";
import "@arcgis/core/assets/esri/themes/light/main.css";
import("../data/stations_metadata.json")

const ArcMap = () => {
    const mapDiv = useRef(null);

    useEffect(() => {
        if (mapDiv.current) {
            // Map
            const map = new Map({
                basemap: "topo-vector"
            });
            // View
            const view = new MapView({
                container: mapDiv.current,
                map: map,
                center: [-4.2026, 56.4907], 
                zoom: 5,
            });
            // Locate Widget
            const locateWidget = new Locate({
                view: view,
                useHeadingEnabled: false,
                goToOverride: function(view, options) {
                    options.target.scale = 1500;
                    return view.goTo(options.target);
                }
        });

            view.ui.add(locateWidget, "top-left");

            return () => view && view.destroy();
        }
    }, []);

    return <div 
              className="mapDiv"
                ref={mapDiv}
                style={{ height: "100vh", width: "100vw" }}
           ></div>;
};

export default ArcMap;  
