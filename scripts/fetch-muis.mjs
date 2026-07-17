// Dumps the full MUIS halal establishments directory via its public search API.
// Enumerates postal-code prefixes (000-999), drilling deeper wherever a query
// hits the 200-result cap, and dedupes by establishment id.
// Usage: node scripts/fetch-muis.mjs <output.json>

import { writeFile } from 'node:fs/promises';

const BASE = 'https://halal.muis.gov.sg';
const UA = 'HalalSG community app (github.com/manimac-pie/HalalSG)';
const CAP = 200;
const out = process.argv[2] ?? 'muis-raw.json';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let session; // { cookie, token }

async function bootstrap() {
  const res = await fetch(`${BASE}/halal/establishments`, {
    headers: { 'user-agent': UA },
  });
  if (!res.ok) throw new Error(`bootstrap ${res.status}`);
  const cookies = res.headers.getSetCookie().map((c) => c.split(';')[0]);
  const html = await res.text();
  const token = html.match(/name="__RequestVerificationToken"[^>]*value="([^"]+)"/)?.[1];
  if (!token) throw new Error('no CSRF token in page');
  session = { cookie: cookies.join('; '), token };
  console.log('session established');
}

async function search(text, retried = false) {
  const res = await fetch(`${BASE}/api/halal/establishments`, {
    method: 'POST',
    headers: {
      'user-agent': UA,
      'content-type': 'application/json',
      'x-csrf-token': session.token,
      cookie: session.cookie,
    },
    body: JSON.stringify({ text }),
  });
  if ((res.status === 400 || res.status === 403) && !retried) {
    console.warn(`  ${res.status} for "${text}" — refreshing session`);
    await sleep(2000);
    await bootstrap();
    return search(text, true);
  }
  if (!res.ok) throw new Error(`search "${text}" -> ${res.status}`);
  return res.json();
}

await bootstrap();

const byId = new Map();
const queue = [];
for (let i = 0; i < 1000; i++) queue.push(String(i).padStart(3, '0'));

let done = 0;
let drills = 0;
while (queue.length) {
  const prefix = queue.shift();
  let result;
  try {
    result = await search(prefix);
  } catch (err) {
    console.warn(`  FAILED "${prefix}": ${err.message} — requeueing once`);
    await sleep(5000);
    queue.push(prefix);
    continue;
  }
  const rows = result.data ?? [];
  for (const row of rows) byId.set(row.id, row);

  if (rows.length >= CAP && prefix.length < 6) {
    for (let d = 0; d <= 9; d++) queue.push(prefix + d);
    drills++;
  }

  done++;
  if (done % 50 === 0) {
    console.log(`${done} queries, ${byId.size} unique, ${queue.length} queued, ${drills} drilled`);
  }
  await sleep(250);
}

const all = [...byId.values()];
await writeFile(out, JSON.stringify(all, null, 1), 'utf8');

const bySch = {};
for (const r of all) {
  const key = `${r.schemeText} / ${r.subSchemeText} / type=${r.typeText}`;
  bySch[key] = (bySch[key] ?? 0) + 1;
}
console.log(`\nTotal unique establishments: ${all.length}`);
console.log('Breakdown:');
for (const [k, v] of Object.entries(bySch).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(v).padStart(5)}  ${k}`);
}
