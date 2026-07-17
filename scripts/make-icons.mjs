// Generates PWA PNG icons (green tile + white crescent) without any image
// libraries, by writing raw RGBA scanlines through zlib into PNG chunks.
// Usage: node scripts/make-icons.mjs

import { writeFile } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const outDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/icons');

const BG = [117, 116, 74, 255]; // --primary olive (#75744a)
const FG = [255, 255, 255, 255];

function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function makePng(size) {
  const px = Buffer.alloc(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size * 0.3;
  // crescent = outer circle minus a circle offset to the upper right
  const bite = { x: cx + size * 0.13, y: cy - size * 0.13, r: size * 0.26 };
  const corner = size * 0.18; // rounded tile corners (transparent outside)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      let color = BG;

      // rounded-corner mask
      const rx = Math.max(corner - x, x - (size - 1 - corner), 0);
      const ry = Math.max(corner - y, y - (size - 1 - corner), 0);
      if (rx * rx + ry * ry > corner * corner) {
        continue; // transparent
      }

      const dOuter = Math.hypot(x - cx, y - cy);
      const dBite = Math.hypot(x - bite.x, y - bite.y);
      if (dOuter <= rOuter && dBite > bite.r) color = FG;

      px[i] = color[0];
      px[i + 1] = color[1];
      px[i + 2] = color[2];
      px[i + 3] = color[3];
    }
  }

  // add filter byte 0 per scanline
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    px.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const [name, size] of [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['apple-touch-icon.png', 180],
]) {
  await writeFile(path.join(outDir, name), makePng(size));
  console.log(`wrote public/icons/${name}`);
}
