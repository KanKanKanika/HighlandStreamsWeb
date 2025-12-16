import fs from "fs";
import fetch from "node-fetch";

const BASE_URL = "https://timeseries.sepa.org.uk/KiWIS/KiWIS";

const params = {
  service: "kisters",
  request: "getStationList",
  format: "json",
  returnfields:
    "station_no,station_name,station_latitude,station_longitude,catchment_name,river_name",
  flatten: "true"
};

async function fetchStationMetadata() {
  const queryString = new URLSearchParams(params).toString();
  const url = `${BASE_URL}?${queryString}`;

  console.log("🔗 Requesting:", url);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`SEPA KiWIS returned HTTP ${response.status}`);
  }

  const output = await response.json();

  const [columns, ...rows] = output;

  const stations = rows.map(row =>
    Object.fromEntries(row.map((value, i) => [columns[i], value]))
  );

  return stations;
}

fetchStationMetadata()
  .then((stations) => {
    fs.writeFileSync(
      "../data/stations_metadata.json",
      JSON.stringify(stations, null, 2),
      "utf-8"
    );

    console.log(`✅ Saved ${stations.length} stations`);
  })
  .catch(console.error);
