import fs from "fs-extra";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------- Configuration ----------------------

const BASE_URL = "https://timeseries.sepa.org.uk/KiWIS/KiWIS";
const DEFAULT_PARAMS = {
    service: "kisters",
    type: "queryServices",
    datasource: "0",
    format: "json",
};

const OUT_DIR = path.join(__dirname, "src", "data");

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------- API call with retries ----------------------

async function callAPI(params, maxRetries = 5) {
    const query = new URLSearchParams(params).toString();
    const url = `${BASE_URL}?${query}`;

    const retryDelays = [2000, 5000, 10000, 15000, 20000];

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`📡 Requesting SEPA API (Attempt ${attempt})...`);

            const response = await fetch(url, {
                headers: {
                    "User-Agent": "HighlandStreamsWeb (contact: email@example.com)",
                },
            });

            if (response.status === 429) throw new Error("HTTP 429: Rate limit exceeded");
            if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);

            return await response.json();
        } catch (err) {
            console.warn(`⚠ Attempt ${attempt} failed: ${err.message}`);

            if (attempt < maxRetries) {
                const delay = retryDelays[attempt - 1];
                console.log(`⏳ Waiting ${delay / 1000}s before retry...`);
                await wait(delay);
            } else {
                console.error("❌ All retries failed. SEPA may be offline.");
                return null;
            }
        }
    }
}

// ---------------- Main function ----------------------

async function getAllStations() {
    console.log("📡 Fetching full SEPA station list...");

    const params = {
        ...DEFAULT_PARAMS,
        request: "getStationList",
        returnfields:
            "station_no,station_name,station_latitude,station_longitude,catchment_name,river_name",
        maxresults: 2000,
        flatten: "true",
    };

    const data = await callAPI(params);

    if (!data || data.length <= 1) {
        console.error("❌ No data returned.");
        return;
    }

    const headers = data[0];

    const stations = data.slice(1).map((row) => ({
        station_no: row[headers.indexOf("station_no")],
        station_name: row[headers.indexOf("station_name")],
        lat: parseFloat(row[headers.indexOf("station_latitude")]),
        lon: parseFloat(row[headers.indexOf("station_longitude")]),
        catchment_name: row[headers.indexOf("catchment_name")],
        river_name: row[headers.indexOf("river_name")],
    }));

    await fs.ensureDir(OUT_DIR);

    // JSON
    await fs.writeJson(path.join(OUT_DIR, "stations_metadata_all.json"), stations, {
        spaces: 2,
    });

    // CSV
    const csv = [
        "station_no,station_name,lat,lon,catchment_name,river_name",
        ...stations.map(
            (s) =>
                `${s.station_no},"${s.station_name}",${s.lat},${s.lon},"${s.catchment_name}","${s.river_name}"`
        ),
    ].join("\n");

    await fs.writeFile(path.join(OUT_DIR, "stations_metadata_all.csv"), csv);

    console.log(`\n🎉 SUCCESS: Saved ${stations.length} stations to src/data/`);
}

// Run
getAllStations();
