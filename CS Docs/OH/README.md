# Ohio Cannabis Dispensary Map Scraper

Downloads all dispensary data from the Ohio DCC's ArcGIS-powered map and outputs it as a CSV.

**Source:** https://com.ohio.gov/divisions-and-programs/cannabis-control/about-dcc/licenses/what-we-do/cannabis-dispensary-map

## Quick Start

```bash
npm install
npm start
```

This uses Puppeteer to auto-discover the ArcGIS FeatureServer endpoint by intercepting network requests, then paginates through all records and writes `ohio_dispensaries.csv`.

## If Auto-Discovery Fails

The map is an ArcGIS Experience Builder app — if the Puppeteer discovery doesn't find the URL, grab it manually:

1. Open the dispensary map page in Chrome
2. Open DevTools (`F12`) → **Network** tab
3. Reload the page and wait for the map to load
4. Filter requests by `FeatureServer`
5. Copy the base URL (e.g. `https://services5.arcgis.com/.../FeatureServer/0`)
6. Run the lightweight direct-query script:

```bash
node direct-query.mjs "https://services5.arcgis.com/.../FeatureServer/0"
```

Or via env var:

```bash
ARCGIS_URL="https://services5.arcgis.com/.../FeatureServer/0" npm run direct
```

## Output

`ohio_dispensaries.csv` — all fields from the ArcGIS layer plus `longitude`/`latitude` columns from the geometry.

## Requirements

- Node.js 18+
- Puppeteer (installed via `npm install`)
