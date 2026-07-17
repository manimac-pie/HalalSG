// Fills lat/lng in src/data/places.json using the free OneMap SG search API.
// Usage: node scripts/geocode.mjs [--force]
// Query preference: place.geocode override > postal code in address > street address.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/data/places.json');
const force = process.argv.includes('--force');

const places = JSON.parse(await readFile(file, 'utf8'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function search(query) {
  const url = `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(query)}&returnGeom=Y&getAddrDetails=Y&pageNum=1`;
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, { headers: { accept: 'application/json' } });
    if (res.status === 429) {
      await sleep(2000 * (attempt + 1));
      continue;
    }
    if (!res.ok) throw new Error(`OneMap ${res.status} for "${query}"`);
    const data = await res.json();
    return data.results?.[0];
  }
  throw new Error(`OneMap rate limit persisted for "${query}"`);
}

let ok = 0;
const misses = [];
for (const place of places) {
  if (!force && place.lat && place.lng) continue;

  const postal = place.address.match(/Singapore (\d{6})/)?.[1];
  const queries = [place.geocode, postal, place.address.replace(/,?\s*Singapore \d{6}/, '').split(',')[0]]
    .filter(Boolean);

  let hit;
  let used;
  for (const q of queries) {
    try {
      hit = await search(q);
    } catch (err) {
      console.warn(`err   ${place.id} "${q}": ${err.message}`);
    }
    await sleep(400);
    if (hit) {
      used = q;
      break;
    }
  }

  if (hit) {
    place.lat = Number(Number(hit.LATITUDE).toFixed(5));
    place.lng = Number(Number(hit.LONGITUDE).toFixed(5));
    ok++;
    console.log(`ok    ${place.id}  <- "${used}" -> ${hit.SEARCHVAL ?? hit.ADDRESS} (${place.lat}, ${place.lng})`);
  } else {
    misses.push(place.id);
    console.warn(`MISS  ${place.id}  tried: ${queries.join(' | ')}`);
  }
}

await writeFile(file, JSON.stringify(places, null, 2) + '\n', 'utf8');
console.log(`\nGeocoded ${ok}, missed ${misses.length}${misses.length ? ': ' + misses.join(', ') : ''}`);
if (misses.length) process.exitCode = 1;
