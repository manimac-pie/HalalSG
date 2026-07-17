import { useState } from 'react';
import type { Place } from '../data/schema';

// Deterministic per-name palette so every place gets a stable, distinct tile.
const PALETTE = [
  '#b47459',
  '#75744a',
  '#6e4638',
  '#a73430',
  '#9d8a9c',
  '#4a4b32',
  '#4a302b',
];

function colorFor(name: string): string {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.codePointAt(0)!) | 0;
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function initialsFor(name: string): string {
  const words = name
    .replace(/['’]/g, '') // "Arnold's" -> "Arnolds", not a new word
    .replace(/[^\p{L}\p{N} ]/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return (
    words
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join('') || '?'
  );
}

/** Restaurant logo when one exists, otherwise a colored monogram tile. */
export function Avatar({ place, size = 56 }: { place: Place; size?: number }) {
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size };

  if (place.logoUrl && !failed) {
    return (
      <img
        className="avatar avatar-img"
        style={style}
        src={place.logoUrl}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <span
      className="avatar avatar-mono"
      style={{ ...style, background: colorFor(place.name), fontSize: size * 0.34 }}
      aria-hidden="true"
    >
      {initialsFor(place.name)}
    </span>
  );
}
