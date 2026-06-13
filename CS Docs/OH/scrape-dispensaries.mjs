#!/usr/bin/env node

/**
 * Ohio Cannabis Dispensary Map Scraper
 * ====================================
 * Scrapes all dispensary rows from the Ohio DCC ArcGIS-powered map at:
 * https://com.ohio.gov/divisions-and-programs/cannabis-control/about-dcc/licenses/what-we-do/cannabis-dispensary-map
 *
 * Strategy:
 *   1. Launch Puppeteer and navigate to the map page
 *   2. Intercept network requests to discover the ArcGIS FeatureServer URL
 *   3. Query the FeatureServer REST API for ALL rows (handling pagination)
 *   4. Write results to a CSV file
 *
 * Usage:
 *   npm install        # installs puppeteer
 *   node scrape-dispensaries.mjs
 *
 * Output: ohio_dispensaries.csv
 */

import puppeteer from "puppeteer";
import fs from "fs";
import https from "https";
import http from "http";

// ─── Config ──────────────────────────────────────────────────────────────────
const TARGET_URL =
  "https://com.ohio.gov/divisions-and-programs/cannabis-control/about-dcc/licenses/what-we-do/cannabis-dispensary-map";
const OUTPUT_FILE = "ohio_dispensaries.csv";
const PAGE_SIZE = 1000; // ArcGIS max records per request
const DISCOVERY_TIMEOUT_MS = 45_000; // how long to wait for network interception

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Simple promise-based fetch (no node-fetch dependency needed) */
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : http;
    mod
      .get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`JSON parse error: ${e.message}\nBody: ${data.slice(0, 500)}`));
          }
        });
      })
      .on("error", reject);
  });
}

/** Escape a value for CSV (handles commas, quotes, newlines) */
function csvEscape(val) {
  if (val == null) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// ─── Step 1: Discover the ArcGIS FeatureServer URL via Puppeteer ─────────────

async function discoverFeatureServerURL() {
  console.log("🔍 Launching browser to discover ArcGIS FeatureServer URL...");
  console.log(`   Target: ${TARGET_URL}\n`);

  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });

  const page = await browser.newPage();

  // Collect all candidate FeatureServer URLs from network traffic
  const featureServerURLs = new Set();

  page.on("request", (req) => {
    const url = req.url();
    // Match ArcGIS FeatureServer query endpoints
    if (/FeatureServer\/\d+\/query/i.test(url) || /FeatureServer\/?\d*$/i.test(url)) {
      // Extract the base FeatureServer/N URL
      const match = url.match(/(https?:\/\/[^?#]*FeatureServer\/\d+)/i);
      if (match) {
        featureServerURLs.add(match[1]);
        console.log(`   ✅ Found endpoint: ${match[1]}`);
      }
    }
  });

  // Also check responses for FeatureServer references (iframe embeds, JSON configs)
  page.on("response", async (res) => {
    const url = res.url();
    const ct = res.headers()["content-type"] || "";
    if (ct.includes("json") || ct.includes("javascript")) {
      try {
        const text = await res.text();
        const matches = text.match(/https?:\/\/[^"'\s]*FeatureServer\/\d+/gi);
        if (matches) {
          for (const m of matches) {
            const clean = m.replace(/\\u002F/g, "/").replace(/\\/g, "");
            featureServerURLs.add(clean);
            console.log(`   ✅ Found endpoint (from response body): ${clean}`);
          }
        }
      } catch {
        // ignore - some responses can't be read
      }
    }
  });

  try {
    await page.goto(TARGET_URL, { waitUntil: "networkidle2", timeout: DISCOVERY_TIMEOUT_MS });
  } catch (e) {
    console.log(`   ⚠️  Page load timeout/error (may still have captured URLs): ${e.message}`);
  }

  // Wait a bit more for lazy-loaded map data
  console.log("   ⏳ Waiting for map data requests...");
  await new Promise((r) => setTimeout(r, 10_000));

  // Try scrolling / clicking to trigger data load
  try {
    // Look for iframes (ArcGIS Experience Builder often embeds in an iframe)
    const frames = page.frames();
    for (const frame of frames) {
      const frameUrl = frame.url();
      if (frameUrl.includes("arcgis.com") || frameUrl.includes("experience.arcgis")) {
        console.log(`   🖼️  Found ArcGIS iframe: ${frameUrl}`);
      }
    }
  } catch {
    // ignore
  }

  await new Promise((r) => setTimeout(r, 5_000));
  await browser.close();

  if (featureServerURLs.size === 0) {
    console.log("\n❌ Could not auto-discover a FeatureServer URL.");
    console.log("   Falling back to known Ohio DCC ArcGIS endpoints...\n");
    return null;
  }

  // Prefer dispensary-related URLs
  const urls = [...featureServerURLs];
  console.log(`\n📡 Discovered ${urls.length} FeatureServer endpoint(s):`);
  urls.forEach((u, i) => console.log(`   [${i}] ${u}`));

  return urls;
}

// ─── Step 2: Probe an endpoint to see if it has dispensary data ──────────────

async function probeEndpoint(baseUrl) {
  const infoUrl = `${baseUrl}?f=json`;
  try {
    const info = await fetchJSON(infoUrl);
    const name = info.name || info.description || "";
    console.log(`   Layer name: "${name}" | Fields: ${(info.fields || []).length}`);
    return info;
  } catch (e) {
    console.log(`   ❌ Probe failed for ${baseUrl}: ${e.message}`);
    return null;
  }
}

// ─── Step 3: Query all features with pagination ──────────────────────────────

async function fetchAllFeatures(baseUrl) {
  let allFeatures = [];
  let offset = 0;
  let fields = null;

  console.log(`\n📥 Fetching all records from: ${baseUrl}`);

  while (true) {
    const queryUrl =
      `${baseUrl}/query?` +
      new URLSearchParams({
        where: "1=1",
        outFields: "*",
        returnGeometry: "true",
        resultOffset: String(offset),
        resultRecordCount: String(PAGE_SIZE),
        f: "json",
      }).toString();

    console.log(`   Fetching offset=${offset}...`);
    const data = await fetchJSON(queryUrl);

    if (data.error) {
      console.error(`   ❌ ArcGIS error: ${JSON.stringify(data.error)}`);
      break;
    }

    if (!fields && data.fields) {
      fields = data.fields;
    }

    const features = data.features || [];
    allFeatures = allFeatures.concat(features);
    console.log(`   Got ${features.length} features (total: ${allFeatures.length})`);

    // Stop if we got fewer than PAGE_SIZE (last page) or if exceededTransferLimit is false
    if (features.length < PAGE_SIZE && !data.exceededTransferLimit) {
      break;
    }
    offset += PAGE_SIZE;
  }

  return { features: allFeatures, fields };
}

// ─── Step 4: Write CSV ───────────────────────────────────────────────────────

function writeCSV(features, fields, outputPath) {
  if (features.length === 0) {
    console.log("⚠️  No features to write.");
    return;
  }

  // Build column list from fields metadata, plus geometry columns
  const fieldNames = (fields || []).map((f) => f.name || f.alias);

  // Check if features have geometry
  const hasGeometry = features.some((f) => f.geometry);

  // Build header
  const headers = [...fieldNames];
  if (hasGeometry) {
    // Check geometry type
    const sampleGeo = features.find((f) => f.geometry)?.geometry;
    if (sampleGeo) {
      if ("x" in sampleGeo && "y" in sampleGeo) {
        headers.push("longitude", "latitude");
      } else if ("rings" in sampleGeo) {
        headers.push("geometry_rings");
      }
    }
  }

  // If fields metadata wasn't returned, infer from first feature attributes
  if (fieldNames.length === 0 && features[0]?.attributes) {
    headers.splice(0, 0, ...Object.keys(features[0].attributes));
    if (hasGeometry) headers.push("longitude", "latitude");
  }

  const rows = [headers.map(csvEscape).join(",")];

  for (const feature of features) {
    const attrs = feature.attributes || {};
    const values = [];

    // Attribute columns
    const attrKeys = fieldNames.length > 0 ? fieldNames : Object.keys(attrs);
    for (const key of attrKeys) {
      values.push(csvEscape(attrs[key]));
    }

    // Geometry columns
    if (hasGeometry && feature.geometry) {
      if ("x" in feature.geometry) {
        values.push(csvEscape(feature.geometry.x));
        values.push(csvEscape(feature.geometry.y));
      } else if ("rings" in feature.geometry) {
        values.push(csvEscape(JSON.stringify(feature.geometry.rings)));
      }
    } else if (hasGeometry) {
      values.push("", "");
    }

    rows.push(values.join(","));
  }

  fs.writeFileSync(outputPath, rows.join("\n"), "utf-8");
  console.log(`\n✅ Wrote ${features.length} rows to ${outputPath}`);
  console.log(`   Columns: ${headers.join(", ")}`);
}

// ─── Known fallback URLs to try ──────────────────────────────────────────────
// These are common Ohio DCC ArcGIS service patterns found in the wild.

const FALLBACK_SEARCH_URLS = [
  "https://www.arcgis.com/sharing/rest/search?q=ohio+dispensary+cannabis+owner%3AOhioDCC+OR+owner%3AOhioCommerce&f=json&num=20&sortField=modified&sortOrder=desc",
  "https://www.arcgis.com/sharing/rest/search?q=ohio+dispensary+cannabis&f=json&num=20&sortField=modified&sortOrder=desc",
];

async function searchArcGISPortal() {
  console.log("🔎 Searching ArcGIS Online portal for Ohio dispensary services...\n");

  for (const searchUrl of FALLBACK_SEARCH_URLS) {
    try {
      const data = await fetchJSON(searchUrl);
      if (data.results && data.results.length > 0) {
        for (const item of data.results) {
          if (item.type === "Feature Service" && item.url) {
            console.log(`   Found: "${item.title}" → ${item.url}`);
            return item.url;
          }
        }
        // Also check for web maps that reference feature services
        for (const item of data.results) {
          if (item.url && item.url.includes("FeatureServer")) {
            console.log(`   Found: "${item.title}" → ${item.url}`);
            return item.url;
          }
        }
      }
    } catch (e) {
      console.log(`   Search failed: ${e.message}`);
    }
  }
  return null;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║  Ohio Cannabis Dispensary Map Scraper            ║");
  console.log("╚══════════════════════════════════════════════════╝\n");

  // Step 1: Try Puppeteer-based discovery
  let endpointUrls = await discoverFeatureServerURL();

  // Step 2: If Puppeteer didn't find anything, try ArcGIS portal search
  if (!endpointUrls || endpointUrls.length === 0) {
    const portalUrl = await searchArcGISPortal();
    if (portalUrl) {
      // Try layer 0 by default
      const base = portalUrl.replace(/\/$/, "");
      endpointUrls = [
        base.includes("/0") ? base : `${base}/0`,
      ];
    }
  }

  if (!endpointUrls || endpointUrls.length === 0) {
    console.log("\n❌ Could not discover the FeatureServer URL automatically.");
    console.log("   You can manually provide it. To find it:");
    console.log("   1. Open the dispensary map page in Chrome");
    console.log("   2. Open DevTools → Network tab → filter by 'FeatureServer'");
    console.log("   3. Copy the base URL (up to /FeatureServer/0)");
    console.log("   4. Set it as MANUAL_URL below and re-run.\n");

    // ── MANUAL OVERRIDE ──
    // If auto-discovery fails, paste the FeatureServer URL here:
    const MANUAL_URL = process.env.ARCGIS_URL || "";
    if (MANUAL_URL) {
      endpointUrls = [MANUAL_URL];
    } else {
      process.exit(1);
    }
  }

  // Step 3: Probe each endpoint and pick the best one
  let bestUrl = null;
  let bestInfo = null;

  for (const url of endpointUrls) {
    console.log(`\n🔬 Probing: ${url}`);
    const info = await probeEndpoint(url);
    if (info && info.fields && info.fields.length > 0) {
      if (!bestUrl || (info.fields.length > (bestInfo?.fields?.length || 0))) {
        bestUrl = url;
        bestInfo = info;
      }
    }
  }

  if (!bestUrl) {
    console.log("\n❌ None of the discovered endpoints returned valid layer info.");
    process.exit(1);
  }

  // Step 4: Fetch all features
  const { features, fields } = await fetchAllFeatures(bestUrl);

  // Step 5: Write CSV
  writeCSV(features, fields || bestInfo?.fields, OUTPUT_FILE);

  console.log("\n🎉 Done!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
