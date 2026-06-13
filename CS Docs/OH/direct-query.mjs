#!/usr/bin/env node

/**
 * Direct ArcGIS FeatureServer Query (No Puppeteer)
 * =================================================
 * If the Puppeteer-based discovery didn't work, use this script instead.
 *
 * HOW TO FIND THE URL:
 *   1. Open https://com.ohio.gov/.../cannabis-dispensary-map in Chrome
 *   2. Open DevTools (F12) → Network tab
 *   3. Reload the page
 *   4. Filter network requests by "FeatureServer"
 *   5. Copy the base URL up to and including /FeatureServer/0
 *   6. Run:  ARCGIS_URL="<paste-url>" node direct-query.mjs
 *      or:   node direct-query.mjs "<paste-url>"
 *
 * Output: ohio_dispensaries.csv
 */

import https from "https";
import http from "http";
import fs from "fs";

// ─── Config ──────────────────────────────────────────────────────────────────
const OUTPUT_FILE = "ohio_dispensaries.csv";
const PAGE_SIZE = 1000;

// Grab URL from env or CLI arg
const ARCGIS_URL = process.env.ARCGIS_URL || process.argv[2] || "";

if (!ARCGIS_URL) {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║  Direct ArcGIS FeatureServer Query                       ║
╚══════════════════════════════════════════════════════════╝

Usage:
  node direct-query.mjs <FeatureServer-URL>

  or:
  ARCGIS_URL="https://services....arcgis.com/.../FeatureServer/0" node direct-query.mjs

How to find the URL:
  1. Open the dispensary map page in Chrome
  2. DevTools → Network → filter "FeatureServer"
  3. Copy the base URL (e.g. https://services5.arcgis.com/.../FeatureServer/0)
`);
  process.exit(1);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
            reject(new Error(`JSON parse error: ${e.message}\n${data.slice(0, 300)}`));
          }
        });
      })
      .on("error", reject);
  });
}

function csvEscape(val) {
  if (val == null) return "";
  const str = String(val);
  if (/[,"\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const baseUrl = ARCGIS_URL.replace(/\/query.*$/, "").replace(/\/$/, "");
  console.log(`\n📡 Endpoint: ${baseUrl}`);

  // Get layer info
  console.log("📋 Fetching layer metadata...");
  const info = await fetchJSON(`${baseUrl}?f=json`);
  if (info.error) {
    console.error("❌ Error:", JSON.stringify(info.error));
    process.exit(1);
  }
  console.log(`   Layer: "${info.name || "unknown"}" | ${(info.fields || []).length} fields`);

  // Count records
  const countData = await fetchJSON(
    `${baseUrl}/query?where=1%3D1&returnCountOnly=true&f=json`
  );
  const totalCount = countData.count || "unknown";
  console.log(`   Total records: ${totalCount}\n`);

  // Fetch all with pagination
  let allFeatures = [];
  let fields = info.fields || [];
  let offset = 0;

  while (true) {
    const params = new URLSearchParams({
      where: "1=1",
      outFields: "*",
      returnGeometry: "true",
      resultOffset: String(offset),
      resultRecordCount: String(PAGE_SIZE),
      f: "json",
    });

    console.log(`   Fetching offset=${offset}...`);
    const data = await fetchJSON(`${baseUrl}/query?${params}`);

    if (data.error) {
      console.error("❌ Query error:", JSON.stringify(data.error));
      break;
    }

    if (!fields.length && data.fields) fields = data.fields;
    const features = data.features || [];
    allFeatures.push(...features);
    console.log(`   → ${features.length} features (total: ${allFeatures.length})`);

    if (features.length < PAGE_SIZE && !data.exceededTransferLimit) break;
    offset += PAGE_SIZE;
  }

  if (allFeatures.length === 0) {
    console.log("\n⚠️  No features returned.");
    process.exit(1);
  }

  // Build CSV
  const fieldNames = fields.length
    ? fields.map((f) => f.name)
    : Object.keys(allFeatures[0]?.attributes || {});

  const hasGeo = allFeatures.some((f) => f.geometry?.x != null);
  const headers = [...fieldNames, ...(hasGeo ? ["longitude", "latitude"] : [])];

  const rows = [headers.map(csvEscape).join(",")];

  for (const f of allFeatures) {
    const a = f.attributes || {};
    const vals = fieldNames.map((k) => csvEscape(a[k]));
    if (hasGeo) {
      vals.push(csvEscape(f.geometry?.x), csvEscape(f.geometry?.y));
    }
    rows.push(vals.join(","));
  }

  fs.writeFileSync(OUTPUT_FILE, rows.join("\n"), "utf-8");
  console.log(`\n✅ Wrote ${allFeatures.length} rows → ${OUTPUT_FILE}`);
  console.log(`   Columns: ${headers.join(", ")}\n`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
