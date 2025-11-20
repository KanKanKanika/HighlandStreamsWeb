// scripts/getAllStations.js

const fs = require('fs-extra');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const path = require('path');

// ---------------- Configuration ----------------------

const BASE_URL = "https://timeseries.sepa.org.uk/KiWIS/KiWIS";
const DEFAULT_PARAMS = {
    service: 'kisters',
    type: 'queryServices',
    datasource: '0',
    format: 'json'  // SEPA supports JSON
};

const OUT_DIR = path.join(__dirname, '../data');

// ---------------- Functions -------------------------

/**
 * Makes an API request with retries
 */
async function callAPI(params, maxRetries = 3) {
    const query = new URLSearchParams(params).toString();
    const url = `${BASE_URL}?${query}`;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(url, {timeout: 30000});
            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            return data;
        } catch (err) {
            console.log(`Attempt ${attempt} failed: ${err.message}`);
            if (attempt < maxRetries) {
                console.log("Retrying in 2 seconds...");
                await new Promise(res => setTimeout(res, 2000));
            } else {
                console.error("All retries failed.");
                return null;
            }
        }
    }
}

/**
 * Fetch all stations, extract names, save for SQL
 */
async function getAllStations() {
    const params = {
        ...DEFAULT_PARAMS,
        request: 'getStationList',
        // no station_name filter = all stations
        returnfields: 'station_no,station_name,station_latitude,station_longitude',
        flatten: 'true'
    };

    const data = await callAPI(params);

    if (!data) {
        console.error("No data returned from SEPA API");
        return;
    }

    // Extract station names
    // SEPA returns a 2D array: first row = headers, rest = data
    const headers = data[0]; // ['station_no','station_name','station_latitude','station_longitude']
    const stationData = data.slice(1).map(row => ({
        station_no: row[headers.indexOf('station_no')],
        station_name: row[headers.indexOf('station_name')],
        lat: parseFloat(row[headers.indexOf('station_latitude')]),
        lon: parseFloat(row[headers.indexOf('station_longitude')])
    }));

    // Save as JSON
    await fs.ensureDir(OUT_DIR);
    const jsonPath = path.join(OUT_DIR, 'stations_for_sql.json');
    await fs.writeJson(jsonPath, stationData, {spaces: 2});
    console.log(`✔ Station list saved to ${jsonPath}`);

    // Save as CSV (optional for SQL import)
    const csvPath = path.join(OUT_DIR, 'stations_for_sql.csv');
    const csvContent = [
        'station_no,station_name,lat,lon',
        ...stationData.map(s => `${s.station_no},"${s.station_name}",${s.lat},${s.lon}`)
    ].join('\n');
    await fs.writeFile(csvPath, csvContent, 'utf8');
    console.log(`✔ CSV version saved to ${csvPath}`);
}

// ---------------- Main ------------------------------

getAllStations();
