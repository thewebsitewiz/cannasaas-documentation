/**
 * Google My Maps to CSV Scraper
 *
 * Downloads KML from any public Google My Maps, parses all markers,
 * and outputs a clean CSV file.
 *
 * Usage:
 *   node scrape-google-my-maps.mjs
 *   node scrape-google-my-maps.mjs "https://www.google.com/maps/d/viewer?mid=YOUR_MAP_ID"
 *
 * Zero dependencies — uses only built-in Node.js APIs.
 */

import { writeFileSync, mkdirSync } from 'fs';

// ── Config ────────────────────────────────────
const DEFAULT_MAP_URL =
  'https://www.google.com/maps/d/viewer?mid=10yxX22qEa2exw8ENNzcZ2d39mq11d2qj';

const OUTPUT_DIR = 'output';
const OUTPUT_FILE = 'pa_medical_marijuana_dispensaries.csv';

// Build XML tag patterns with concatenation so they don't get mangled
const NAME_OPEN = '<' + 'name' + '>';
const NAME_CLOSE = '</' + 'name' + '>';

function extractMapId(url) {
  const match = url.match(/mid=([a-zA-Z0-9_-]+)/);
  if (!match) throw new Error('Could not extract map ID from URL: ' + url);
  return match[1];
}

async function downloadKML(mapId) {
  const kmlUrl = 'https://www.google.com/maps/d/kml?mid=' + mapId + '&forcekml=1';
  console.log('Downloading KML from: ' + kmlUrl);

  const res = await fetch(kmlUrl);
  if (!res.ok) throw new Error('HTTP ' + res.status + ' — is the map public?');

  const text = await res.text();
  console.log('  Downloaded ' + (text.length / 1024).toFixed(1) + ' KB');
  return text;
}

function parseKML(kml) {
  const placemarks = [];

  // Build regexes using string concat for the xml tag
  const nameReCdata = new RegExp(
    escRegex(NAME_OPEN) + '<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>' + escRegex(NAME_CLOSE)
  );
  const nameRePlain = new RegExp(
    escRegex(NAME_OPEN) + '([\\s\\S]*?)' + escRegex(NAME_CLOSE)
  );

  const folderNameRe = new RegExp(
    '<Folder>\\s*' + escRegex(NAME_OPEN) +
    '(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))' +
    escRegex(NAME_CLOSE),
    'gi'
  );

  // Extract layers
  const layers = [];
  let fm;
  while ((fm = folderNameRe.exec(kml)) !== null) {
    layers.push((fm[1] || fm[2]).trim());
  }

  // Extract placemarks
  const pmRegex = /<Placemark>([\s\S]*?)<\/Placemark>/gi;
  let pmMatch;

  while ((pmMatch = pmRegex.exec(kml)) !== null) {
    const block = pmMatch[1];
    const pm = {};

    // Name
    const nMatch = block.match(nameReCdata) || block.match(nameRePlain);
    pm.name = nMatch ? cleanHtml(nMatch[1]).trim() : '';

    // Description
    const descMatch =
      block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) ||
      block.match(/<description>([\s\S]*?)<\/description>/);
    pm.description_raw = descMatch ? descMatch[1].trim() : '';

    // Parse structured data from description HTML
    const descData = parseDescription(pm.description_raw);
    Object.assign(pm, descData);

    // Coordinates (KML format: lng,lat,alt)
    const coordMatch = block.match(/<coordinates>([\s\S]*?)<\/coordinates>/);
    if (coordMatch) {
      const coords = coordMatch[1].trim().split(',');
      pm.longitude = parseFloat(coords[0]) || '';
      pm.latitude = parseFloat(coords[1]) || '';
    }

    // Extended Data
    const extDataRegex = /<Data name="([^"]+)">\s*<value>([\s\S]*?)<\/value>\s*<\/Data>/gi;
    let extMatch;
    while ((extMatch = extDataRegex.exec(block)) !== null) {
      pm[extMatch[1].trim()] = cleanHtml(extMatch[2]).trim();
    }

    // SimpleData
    const simpleRegex = /<SimpleData name="([^"]+)">([\s\S]*?)<\/SimpleData>/gi;
    let simpleMatch;
    while ((simpleMatch = simpleRegex.exec(block)) !== null) {
      pm[simpleMatch[1].trim()] = cleanHtml(simpleMatch[2]).trim();
    }

    // Style (layer/icon indicator)
    const styleMatch = block.match(/<styleUrl>#([^<]+)<\/styleUrl>/);
    pm.style = styleMatch ? styleMatch[1].trim() : '';

    if (pm.name || pm.latitude) {
      // Remove internal fields from CSV output
      const { description_raw, ...clean } = pm;
      placemarks.push(clean);
    }
  }

  return { placemarks, layers };
}

function parseDescription(html) {
  const result = {};
  if (!html) return result;

  result.description = cleanHtml(html).trim();

  // Extract key-value pairs from HTML tables
  const rowRegex = /<tr>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/gi;
  let rowMatch;
  while ((rowMatch = rowRegex.exec(html)) !== null) {
    const key = cleanHtml(rowMatch[1]).trim();
    const val = cleanHtml(rowMatch[2]).trim();
    if (key && val) {
      result[safeKey(key)] = val;
    }
  }

  // Extract from <b>Label:</b> Value patterns
  const labelRegex = /<b>([^<]+)<\/b>:?\s*([^<]+)/gi;
  let labelMatch;
  while ((labelMatch = labelRegex.exec(html)) !== null) {
    const key = labelMatch[1].trim();
    const val = labelMatch[2].trim();
    if (key && val) result[safeKey(key)] = val;
  }

  // Phone numbers
  const phoneMatch =
    html.match(/(?:phone|tel)[:\s]*([0-9()+\-.\s]{7,20})/i) ||
    html.match(/\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/);
  if (phoneMatch) result.phone = (phoneMatch[1] || phoneMatch[0]).trim();

  // URLs
  const urlMatch = html.match(/https?:\/\/[^\s"<]+/);
  if (urlMatch) result.url = urlMatch[0];

  // Address lines (split by <br>)
  const parts = html.split(/<br\s*\/?>/i).map(p => cleanHtml(p).trim()).filter(Boolean);
  if (parts.length > 1) result.address = parts.join(', ');

  return result;
}

function safeKey(key) {
  return key.replace(/[^a-zA-Z0-9_]/g, '_').replace(/_+/g, '_').toLowerCase();
}

function cleanHtml(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toCSV(placemarks) {
  if (placemarks.length === 0) return '';

  // Collect all keys, priority columns first
  const priority = ['name', 'latitude', 'longitude', 'description', 'address', 'phone', 'url'];
  const allKeys = new Set(priority);
  for (const pm of placemarks) {
    for (const key of Object.keys(pm)) {
      if (key !== 'style') allKeys.add(key);
    }
  }
  const columns = [...allKeys];

  const escape = (val) => {
    const s = String(val);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };

  const header = columns.map(escape).join(',');
  const rows = placemarks.map(pm =>
    columns.map(col => escape(pm[col] ?? '')).join(',')
  );

  return [header, ...rows].join('\n');
}

// ── Main ──────────────────────────────────────
async function main() {
  const inputUrl = process.argv[2] || DEFAULT_MAP_URL;
  const mapId = extractMapId(inputUrl);
  console.log('Map ID: ' + mapId);

  const kml = await downloadKML(mapId);

  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(OUTPUT_DIR + '/raw_map_data.kml', kml);
  console.log('  Saved raw KML');

  const { placemarks, layers } = parseKML(kml);
  console.log('\nFound ' + placemarks.length + ' locations across ' + layers.length + ' layers');
  if (layers.length > 0) console.log('Layers: ' + layers.join(', '));

  if (placemarks.length === 0) {
    console.log('\nNo placemarks found. Check output/raw_map_data.kml');
    return;
  }

  console.log('\nSample:');
  console.log(JSON.stringify(placemarks[0], null, 2));

  const csv = toCSV(placemarks);
  writeFileSync(OUTPUT_DIR + '/' + OUTPUT_FILE, csv);
  console.log('\n✓ ' + placemarks.length + ' records → ' + OUTPUT_DIR + '/' + OUTPUT_FILE);

  writeFileSync(OUTPUT_DIR + '/pa_medical_marijuana_dispensaries.json', JSON.stringify(placemarks, null, 2));
  console.log('✓ JSON → ' + OUTPUT_DIR + '/pa_medical_marijuana_dispensaries.json');

  const withCoords = placemarks.filter(p => p.latitude && p.longitude).length;
  console.log('\nSummary: ' + placemarks.length + ' locations, ' + withCoords + ' with coordinates');
}

main().catch((err) => { console.error('Error:', err.message); process.exit(1); });
