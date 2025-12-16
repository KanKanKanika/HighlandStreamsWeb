import { useRef, useEffect } from "react";
import MapView from "@arcgis/core/views/MapView";
import Map from "@arcgis/core/Map";
import Locate from "@arcgis/core/widgets/Locate";
import Graphic from "@arcgis/core/Graphic";
import "@arcgis/core/assets/esri/themes/light/main.css";
import stations from "../data/stations_metadata.json";

const ArcMap = () => {
    const mapDiv = useRef(null);

    useEffect(() => {
        if (!mapDiv.current) return;

        console.log("Stations loaded:", stations.length);

        // Map
        const map = new Map({
            basemap: "topo-vector",
        });

        // View
        const view = new MapView({
            container: mapDiv.current,
            map,
            center: [-4.2026, 56.4907],
            zoom: 5,
        });

        // Locate widget
        const locateWidget = new Locate({
            view,
            useHeadingEnabled: false,
        });
        view.ui.add(locateWidget, "top-left");

        // Add station points and popups
        stations.forEach((station) => {
            const {
                station_longitude,
                station_latitude,
                station_name,
                station_no,
                river_name,
                catchment_name,
            } = station;

            const longitude = Number(station_longitude);
            const latitude = Number(station_latitude);


            const pointGraphic = new Graphic({
                geometry: {
                    type: "point",
                    longitude: station_longitude,
                    latitude: station_latitude,
                },
                symbol: {
                    type: "simple-marker",
                    color: "#aa4242",
                    size: "8px",
                    outline: {
                        color: "white",
                        width: 1,
                    },
                },
                attributes: {
                    name: station_name,
                    id: station_no,
                    river: river_name,
                },
                popupTemplate: {
                    title: "{name}",
                    content: `
            <b>Station ID:</b> {id}<br/>
            <b>River:</b> {river}<br/>
          `,
                },
            });

            view.graphics.add(pointGraphic);
        });

        return () => {
            view.destroy();
        };
    }, []);

    return (
        <div
            ref={mapDiv}
            className="mapDiv"
            style={{ height: "100vh", width: "100vw" }}
        />
    );
};

export default ArcMap;
