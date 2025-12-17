import fs from "fs";
import fetch from "node-fetch";

const BASE_URL = "https://timeseries.sepa.org.uk/KiWIS/KiWIS";

const OUTPATH = "../data";

const DEFAULT_PARAMS = {
  service: "kisters",
  format: "json",
};

// Stations to extract (same as Python)
const STATIONS = ["Woodend", "Park", "Polhollick", "Mar Lodge", "Garthdee"];

// --------------------------------------------------
// Utility: API call with retries (like Python)
// --------------------------------------------------
async function callAPI(params, maxRetries = 3) {
  const url = `${BASE_URL}?${new URLSearchParams(params).toString()}`;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, { timeout: 30000 });

      if (!response.ok) {
        if (response.status === 500 && attempt < maxRetries - 1) {
          console.log(`⚠ Server error, retrying (${attempt + 1})`);
          await new Promise((r) => setTimeout(r, 2000));
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
    }
  }
}

// --------------------------------------------------
// 1. Station metadata
// --------------------------------------------------
async function getStationData() {
  const params = {
    ...DEFAULT_PARAMS,
    request: "getStationList",
    station_name: STATIONS.join(","),
    returnfields:
      "station_no,station_name,station_latitude,station_longitude",
    flatten: "true",
  };

  const output = await callAPI(params);
  const [cols, ...rows] = output;

  return rows.map((r) =>
    Object.fromEntries(r.map((v, i) => [cols[i], v]))
  );
}

// --------------------------------------------------
// 2. Timeseries metadata
// --------------------------------------------------
async function getTimeseriesData(stations) {
  const params = {
    ...DEFAULT_PARAMS,
    request: "getTimeseriesList",
    station_no: stations.map((s) => s.station_no).join(","),
    returnfields:
      "station_name,ts_name,ts_path,stationparameter_name,coverage",
    dateformat: "yyyy-MM-dd",
  };

  const output = await callAPI(params);
  const [cols, ...rows] = output;

  return rows.map((r) =>
    Object.fromEntries(r.map((v, i) => [cols[i], v]))
  );
}

// --------------------------------------------------
// 3. Timeseries values
// --------------------------------------------------
async function getTimeseriesValues(tsList) {
  const allData = [];

  for (const ts of tsList) {
    console.log(`📈 ${ts.station_name} – ${ts.ts_name}`);

    for (let year = 2014; year <= 2020; year++) {
      const params = {
        ...DEFAULT_PARAMS,
        request: "getTimeseriesValues",
        ts_path: ts.ts_path,
        from: `${year}-01-01`,
        period: "P1Y",
        metadata: "true",
        returnfields: "Timestamp,Value,Quality Code",
        md_returnfields: "station_name,stationparameter_name,ts_name",
        dateformat: "yyyy-MM-dd HH:mm:ss",
      };

      const meta = (await callAPI(params))?.[0];
      if (!meta) continue;

      const columns = meta.columns.split(",");
      const rows = meta.data || [];

      rows.forEach((row) => {
        const record = Object.fromEntries(
          row.map((v, i) => [columns[i], v])
        );
        allData.push({
          ...record,
          station_name: meta.station_name,
          stationparameter_name: meta.stationparameter_name,
          ts_name: meta.ts_name,
        });
      });
    }
  }

  return allData;
}

// --------------------------------------------------
// Main
// --------------------------------------------------
async function main() {
  fs.mkdirSync(`${OUTPATH}/metadata`, { recursive: true });
  fs.mkdirSync(`${OUTPATH}/data/byStation`, { recursive: true });
  fs.mkdirSync(`${OUTPATH}/data/byTimeseries`, { recursive: true });

  console.log("1️⃣ Retrieving station metadata...");
  const stations = await getStationData();
  fs.writeFileSync(
    `${OUTPATH}/metadata/stations.json`,
    JSON.stringify(stations, null, 2)
  );

  console.log("2️⃣ Retrieving timeseries metadata...");
  const tsList = await getTimeseriesData(stations);
  fs.writeFileSync(
    `${OUTPATH}/metadata/timeseries.json`,
    JSON.stringify(tsList, null, 2)
  );

  console.log("3️⃣ Retrieving timeseries values...");
  const values = await getTimeseriesValues(tsList);

  fs.writeFileSync(
    `${OUTPATH}/data/Full.json`,
    JSON.stringify(values, null, 2)
  );

  // Split by station
  [...new Set(values.map((v) => v.station_name))].forEach((station) => {
    const filtered = values.filter((v) => v.station_name === station);
    fs.writeFileSync(
      `${OUTPATH}/data/byStation/${station}.json`,
      JSON.stringify(filtered, null, 2)
    );
  });

  // Split by timeseries
  [...new Set(values.map((v) => v.ts_name))].forEach((ts) => {
    const filtered = values.filter((v) => v.ts_name === ts);
    fs.writeFileSync(
      `${OUTPATH}/data/byTimeseries/${ts}.json`,
      JSON.stringify(filtered, null, 2)
    );
  });

  console.log("✅ Extraction complete");
}

main().catch(console.error);
