import fs from "fs";
import fetch from "node-fetch";

const BASE_URL = "https://timeseries.sepa.org.uk/KiWIS/KiWIS";
const OUTPATH = "../data";

const DEFAULT_PARAMS = {
  service: "kisters",
  format: "json",
};

// API WITH RETRIES 
async function callAPI(params, maxRetries = 5) {
  const url = `${BASE_URL}?${new URLSearchParams(params).toString()}`;
  let delay = 2000;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, { timeout: 30000 });

      if (!response.ok) {
        if ((response.status === 500 || response.status === 429) && attempt < maxRetries - 1) {
          console.log(`⚠ Server busy or rate-limited, retrying in ${delay / 1000}s...`);
          await new Promise((r) => setTimeout(r, delay));
          delay *= 2; 
          continue;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      if (attempt === maxRetries - 1) {
        console.error("API request failed:", err.message);
        return null;
      }
      console.log(`⚠ Error, retrying (${attempt + 1})...`);
      await new Promise((r) => setTimeout(r, delay));
      delay *= 2;
    }
  }
}

// GET STATION METADATA
async function getAllStations() {
  const params = {
    ...DEFAULT_PARAMS,
    request: "getStationList",
    returnfields:
      "station_no,station_name,station_latitude,station_longitude,catchment_name,river_name",
    flatten: "true",
  };

  const output = await callAPI(params);

  if (!output) throw new Error("Failed to fetch station list");

  const [columns, ...rows] = output;

  const stations = rows.map((row) =>
    Object.fromEntries(row.map((v, i) => [columns[i], v]))
  );

  return stations;
}

// MAIN
async function main() {
  fs.mkdirSync(OUTPATH, { recursive: true });

  console.log("1️.Fetching all stations...");
  const stations = await getAllStations();

  fs.writeFileSync(
    `${OUTPATH}/station_metadata.json`,
    JSON.stringify(stations, null, 2)
  );

  console.log(` Saved ${stations.length} stations to ${OUTPATH}/station_metadata.json`);
}

main().catch(console.error);
