import fs from "fs";
import path from "path";

const DATA_FILE = path.join("../data", "station_metadata.json");

function cleanStationData() {
    const rawData = fs.readFileSync(DATA_FILE, "utf-8");
    const stations = JSON.parse(rawData);
    console.log(`Stations before cleaning: ${stations.length}`);

    const cleanedStations = stations.filter(
        (s) =>
            s.river_name && s.river_name.trim() !== "" &&
            s.catchment_name && s.catchment_name.trim() !== ""
    );
    console.log(`Stations after cleaning: ${cleanedStations.length}`);

    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(cleanedStations, null, 2),
        "utf-8"
    );
    console.log(`Updated`);
}
cleanStationData();

