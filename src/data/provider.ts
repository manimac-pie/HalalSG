import type { Place } from './schema';
import placesJson from './places.json';

/**
 * Data source abstraction. v1 ships a curated JSON dataset bundled with the
 * app plus a bulk import of the MUIS certified directory fetched at runtime;
 * a future provider (e.g. Google Places) can implement the same interface to
 * supply live hours/photos without touching the UI.
 */
export interface PlacesProvider {
  getPlaces(): Promise<Place[]>;
}

/** Compact row shape of public/data/muis-places.json (built by scripts/build-muis-dataset.mjs). */
interface MuisRow {
  n: string; // name
  a: string; // address
  p: string; // postal
  lat: number;
  lng: number;
  c?: string; // certificate number
  s?: string; // sub-scheme, e.g. "Restaurant"
  ar?: string; // area derived from postal district
  l?: string; // MUIS logo id, present for the few places that uploaded one
}

const norm = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

function isDuplicateOfCurated(row: MuisRow, curatedKeys: Map<string, string[]>): boolean {
  const names = curatedKeys.get(row.p);
  if (!names) return false;
  const m = norm(row.n);
  return names.some((c) => m.includes(c.slice(0, 10)) || c.includes(m.slice(0, 10)));
}

function toPlace(row: MuisRow, index: number): Place {
  return {
    id: `muis-${row.c || index}`,
    name: row.n,
    status: 'muis-certified',
    cuisine: [],
    address: row.a,
    area: row.ar ?? '',
    lat: row.lat,
    lng: row.lng,
    hours: null,
    source: 'muis',
    certNumber: row.c,
    category: row.s,
    logoUrl: row.l ? `https://halal.muis.gov.sg/logo/${row.l}?size=96` : undefined,
  };
}

export const staticJsonProvider: PlacesProvider = {
  async getPlaces() {
    const curated = placesJson as Place[];

    let muis: Place[] = [];
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}data/muis-places.json`);
      if (res.ok) {
        const rows = (await res.json()) as MuisRow[];
        const curatedKeys = new Map<string, string[]>();
        for (const place of curated) {
          const postal = place.address.match(/Singapore (\d{6})/)?.[1];
          if (!postal) continue;
          curatedKeys.set(postal, [...(curatedKeys.get(postal) ?? []), norm(place.name)]);
        }
        muis = rows
          .filter((row) => row.lat && row.lng && !isDuplicateOfCurated(row, curatedKeys))
          .map(toPlace);
      }
    } catch {
      // offline or file missing — curated list still works
    }

    return [...curated, ...muis];
  },
};

export const placesProvider: PlacesProvider = staticJsonProvider;
