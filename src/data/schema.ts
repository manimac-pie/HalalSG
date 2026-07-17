export type TimeRange = [string, string]; // ["HH:MM", "HH:MM"], close < open means it spills past midnight

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export const DAY_KEYS: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

/**
 * Per-day opening ranges. `daily` is the default; a specific day key overrides it.
 * `null` means closed that day. Multiple ranges support e.g. Friday-prayer breaks.
 */
export interface Hours {
  daily?: TimeRange[] | null;
  mon?: TimeRange[] | null;
  tue?: TimeRange[] | null;
  wed?: TimeRange[] | null;
  thu?: TimeRange[] | null;
  fri?: TimeRange[] | null;
  sat?: TimeRange[] | null;
  sun?: TimeRange[] | null;
}

export type HalalStatus = 'muis-certified' | 'muslim-owned';

export interface Place {
  id: string;
  name: string;
  status: HalalStatus;
  cuisine: string[];
  address: string;
  area: string;
  /** Optional override query for the OneMap geocoding script. */
  geocode?: string;
  lat: number;
  lng: number;
  /** Absent/null for bulk-imported MUIS listings — open status is unknown. */
  hours?: Hours | null;
  priceRange?: '$' | '$$' | '$$$';
  phone?: string;
  website?: string;
  notes?: string;
  /** 'muis' = imported from the MUIS directory; absent = hand-curated. */
  source?: 'muis';
  /** MUIS certificate number, for imported listings. */
  certNumber?: string;
  /** MUIS sub-scheme, e.g. "Restaurant", "Hawker", for imported listings. */
  category?: string;
}
