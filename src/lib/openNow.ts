import type { DayKey, Hours, TimeRange } from '../data/schema';
import { DAY_KEYS } from '../data/schema';

export interface SgTime {
  day: DayKey;
  minutes: number; // minutes since midnight
}

const WEEKDAY_TO_KEY: Record<string, DayKey> = {
  Mon: 'mon',
  Tue: 'tue',
  Wed: 'wed',
  Thu: 'thu',
  Fri: 'fri',
  Sat: 'sat',
  Sun: 'sun',
};

/** Current day + time in Singapore, regardless of the device's timezone. */
export function nowInSingapore(date: Date = new Date()): SgTime {
  const parts = new Intl.DateTimeFormat('en-SG', {
    timeZone: 'Asia/Singapore',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const day = WEEKDAY_TO_KEY[get('weekday')];
  // "24" can appear for midnight with hour12: false in some engines
  const hour = Number(get('hour')) % 24;
  const minute = Number(get('minute'));
  return { day, minutes: hour * 60 + minute };
}

export function parseTime(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function rangesFor(hours: Hours, day: DayKey): TimeRange[] {
  const specific = hours[day];
  const resolved = specific !== undefined ? specific : hours.daily;
  return resolved ?? [];
}

function prevDay(day: DayKey): DayKey {
  const i = DAY_KEYS.indexOf(day);
  return DAY_KEYS[(i + 6) % 7];
}

function nextDay(day: DayKey): DayKey {
  const i = DAY_KEYS.indexOf(day);
  return DAY_KEYS[(i + 1) % 7];
}

export type OpenState = 'open' | 'closing-soon' | 'closed' | 'unknown';

export interface OpenStatus {
  state: OpenState;
  /** When open: today's closing time, e.g. "22:00" (may be past midnight). */
  closesAt?: string;
  /** When closed: next opening, e.g. "11:30" or "Fri 07:00". */
  opensAt?: string;
}

export const CLOSING_SOON_MINUTES = 45;

const DAY_LABELS: Record<DayKey, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
};

/**
 * Whether the place is open at the given Singapore time.
 * Handles multiple ranges per day and overnight ranges (close <= open,
 * e.g. ["18:00","02:00"] keeps the place open into the next day).
 * Places without stored hours (bulk MUIS imports) report 'unknown'.
 */
export function getOpenStatus(hours: Hours | null | undefined, at: SgTime): OpenStatus {
  if (!hours) return { state: 'unknown' };
  const { day, minutes } = at;

  // Ranges starting today
  for (const [open, close] of rangesFor(hours, day)) {
    const o = parseTime(open);
    const c = parseTime(close);
    if (c > o) {
      if (minutes >= o && minutes < c) {
        return withClosingSoon(c - minutes, close);
      }
    } else {
      // overnight: open from o until midnight
      if (minutes >= o) {
        return withClosingSoon(24 * 60 - minutes + c, close);
      }
    }
  }

  // Overnight ranges that started yesterday
  for (const [open, close] of rangesFor(hours, prevDay(day))) {
    const o = parseTime(open);
    const c = parseTime(close);
    if (c <= o && minutes < c) {
      return withClosingSoon(c - minutes, close);
    }
  }

  return { state: 'closed', opensAt: findNextOpening(hours, at) };
}

function withClosingSoon(minutesLeft: number, closesAt: string): OpenStatus {
  return {
    state: minutesLeft <= CLOSING_SOON_MINUTES ? 'closing-soon' : 'open',
    closesAt,
  };
}

function findNextOpening(hours: Hours, at: SgTime): string | undefined {
  // Later today
  const todayNext = rangesFor(hours, at.day)
    .map(([open]) => parseTime(open))
    .filter((o) => o > at.minutes)
    .sort((a, b) => a - b)[0];
  if (todayNext !== undefined) return formatMinutes(todayNext);

  // Following days
  let day = at.day;
  for (let i = 0; i < 7; i++) {
    day = nextDay(day);
    const ranges = rangesFor(hours, day);
    if (ranges.length > 0) {
      const first = ranges.map(([open]) => parseTime(open)).sort((a, b) => a - b)[0];
      const label = i === 0 ? 'tomorrow' : DAY_LABELS[day];
      return `${label} ${formatMinutes(first)}`;
    }
  }
  return undefined;
}

function formatMinutes(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

/** "07:00 – 19:30, 20:00 – 22:00" or "Closed" for display. */
export function formatDayRanges(hours: Hours, day: DayKey): string {
  const ranges = rangesFor(hours, day);
  if (ranges.length === 0) return 'Closed';
  return ranges.map(([o, c]) => `${o} – ${c}`).join(', ');
}
