// Builds public/data/muis-places.json from the raw MUIS directory dump.
// - keeps public eating establishments only (no catering/central kitchens,
//   staff canteens, supermarket halal sections, or delivery-only virtual brands)
// - joins lat/lng from MUIS's own postal-code geodata file
// - derives a display area from the postal sector
// Usage: node scripts/fetch-muis.mjs raw.json && node scripts/build-muis-dataset.mjs raw.json

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rawPath = process.argv[2];
if (!rawPath) {
  console.error('usage: node scripts/build-muis-dataset.mjs <muis-raw.json>');
  process.exit(1);
}
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outPath = path.join(root, 'public', 'data', 'muis-places.json');

// MUIS postal geodata (postal -> {lat,lng}), cached locally by fetch step or fetched here
const GEODATA_URL = 'https://halal.muis.gov.sg/assets/geodata.js';
console.log('fetching postal geodata…');
const geodataJs = await (await fetch(GEODATA_URL, { headers: { 'user-agent': 'HalalSG community app' } })).text();
const geodata = new Function(`${geodataJs}; return geodata;`)();
console.log(`geodata: ${Object.keys(geodata).length} postal codes`);

const KEEP_SUBSCHEMES = new Set([
  'Hawker',
  'Restaurant',
  'Snack Bar / Bakery',
  'Food Station',
  'Canteen',
  'Food Kiosk',
]);

// Postal sector (first 2 digits) -> display area
const SECTOR_AREAS = {
  '01': 'Raffles Place', '02': 'Raffles Place', '03': 'Tanjong Pagar', '04': 'Telok Blangah',
  '05': 'Pasir Panjang', '06': 'City Hall', '07': 'Bugis', '08': 'Little India',
  '09': 'Orchard', '10': 'Tanglin', '11': 'Pasir Panjang', '12': 'Clementi',
  '13': 'Buona Vista', '14': 'Queenstown', '15': 'Tiong Bahru', '16': 'Queenstown',
  '17': 'City Hall', '18': 'Bugis', '19': 'Rochor', '20': 'Little India',
  '21': 'Farrer Park', '22': 'Orchard', '23': 'River Valley', '24': 'Tanglin',
  '25': 'Bukit Timah', '26': 'Bukit Timah', '27': 'Holland Village', '28': 'Newton',
  '29': 'Novena', '30': 'Thomson', '31': 'Balestier', '32': 'Toa Payoh',
  '33': 'Serangoon', '34': 'Macpherson', '35': 'Braddell', '36': 'Potong Pasir',
  '37': 'Potong Pasir', '38': 'Geylang', '39': 'Geylang', '40': 'Paya Lebar',
  '41': 'Geylang Serai', '42': 'Joo Chiat', '43': 'Katong', '44': 'Marine Parade',
  '45': 'Marine Parade', '46': 'Bedok', '47': 'Siglap', '48': 'Bedok',
  '49': 'Changi', '50': 'Loyang', '51': 'Pasir Ris', '52': 'Tampines',
  '53': 'Hougang', '54': 'Sengkang', '55': 'Serangoon', '56': 'Ang Mo Kio',
  '57': 'Bishan', '58': 'Upper Bukit Timah', '59': 'Clementi', '60': 'Jurong East',
  '61': 'Jurong', '62': 'Jurong West', '63': 'Jurong West', '64': 'Boon Lay',
  '65': 'Bukit Batok', '66': 'Bukit Panjang', '67': 'Choa Chu Kang', '68': 'Choa Chu Kang',
  '69': 'Tengah', '70': 'Kranji', '71': 'Kranji', '72': 'Woodlands',
  '73': 'Woodlands', '75': 'Sembawang', '76': 'Yishun', '77': 'Upper Thomson',
  '78': 'Seletar', '79': 'Yio Chu Kang', '80': 'Seletar', '81': 'Changi',
  '82': 'Punggol',
};

function titleCase(text) {
  return text
    .split(/\s+/)
    .map((word) => {
      if (/\d/.test(word)) return word.toUpperCase(); // unit numbers, blocks
      if (word.length <= 2) return word.toUpperCase() === word ? word : word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

const raw = JSON.parse(await readFile(rawPath, 'utf8'));
const rows = [];
let noCoords = 0;
let filtered = 0;

for (const r of raw) {
  if (r.schemeText !== 'Eating Establishment') continue;
  if (!KEEP_SUBSCHEMES.has(r.subSchemeText)) continue;
  if (r.typeText !== 'Default') continue; // skip delivery-only virtual brands
  filtered++;

  const postal = r.postal ?? r.address?.match(/(\d{6})\s*$/)?.[1];
  const geo = postal && geodata[postal];
  if (!geo) {
    noCoords++;
    continue;
  }

  const address = titleCase(r.address.replace(/\s*\d{6}\s*$/, '').trim());
  rows.push({
    n: titleCase(r.name),
    a: `${address}, Singapore ${postal}`,
    p: postal,
    lat: geo.lat,
    lng: geo.lng,
    c: r.number || undefined,
    s: r.subSchemeText,
    ar: SECTOR_AREAS[postal.slice(0, 2)] ?? '',
  });
}

rows.sort((a, b) => a.n.localeCompare(b.n));
await mkdir(path.dirname(outPath), { recursive: true });
await writeFile(outPath, JSON.stringify(rows), 'utf8');

const size = (await readFile(outPath)).length;
console.log(`kept ${rows.length} of ${filtered} public eateries (${noCoords} without coordinates)`);
console.log(`wrote ${outPath} (${(size / 1024).toFixed(0)} KB)`);
