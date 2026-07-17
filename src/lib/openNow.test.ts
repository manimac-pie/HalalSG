import { describe, expect, it } from 'vitest';
import type { Hours } from '../data/schema';
import { formatDayRanges, getOpenStatus, nowInSingapore, rangesFor } from './openNow';

const at = (day: Parameters<typeof getOpenStatus>[1]['day'], hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return { day, minutes: h * 60 + m };
};

describe('nowInSingapore', () => {
  it('converts a UTC instant to Singapore time (UTC+8)', () => {
    // 2026-07-15 is a Wednesday; 23:30 UTC = Thu 07:30 SGT
    const sg = nowInSingapore(new Date('2026-07-15T23:30:00Z'));
    expect(sg.day).toBe('thu');
    expect(sg.minutes).toBe(7 * 60 + 30);
  });

  it('handles midnight in Singapore', () => {
    // 16:00 UTC = 00:00 SGT next day
    const sg = nowInSingapore(new Date('2026-07-15T16:00:00Z'));
    expect(sg.day).toBe('thu');
    expect(sg.minutes).toBe(0);
  });
});

describe('rangesFor', () => {
  it('falls back to daily and lets day keys override', () => {
    const hours: Hours = { daily: [['09:00', '18:00']], fri: [['09:00', '12:30'], ['14:00', '18:00']], sun: null };
    expect(rangesFor(hours, 'mon')).toEqual([['09:00', '18:00']]);
    expect(rangesFor(hours, 'fri')).toHaveLength(2);
    expect(rangesFor(hours, 'sun')).toEqual([]);
  });
});

describe('getOpenStatus', () => {
  const normal: Hours = { daily: [['11:00', '22:00']] };

  it('is open within normal hours', () => {
    expect(getOpenStatus(normal, at('mon', '12:00')).state).toBe('open');
    expect(getOpenStatus(normal, at('mon', '12:00')).closesAt).toBe('22:00');
  });

  it('is closed outside normal hours, reporting next opening today', () => {
    const s = getOpenStatus(normal, at('mon', '09:00'));
    expect(s.state).toBe('closed');
    expect(s.opensAt).toBe('11:00');
  });

  it('is closed after hours, reporting tomorrow opening', () => {
    const s = getOpenStatus(normal, at('mon', '23:00'));
    expect(s.state).toBe('closed');
    expect(s.opensAt).toBe('tomorrow 11:00');
  });

  it('is closing-soon within 45 minutes of close', () => {
    expect(getOpenStatus(normal, at('mon', '21:20')).state).toBe('closing-soon');
    expect(getOpenStatus(normal, at('mon', '21:14')).state).toBe('open');
  });

  it('treats exact closing time as closed and exact opening time as open', () => {
    expect(getOpenStatus(normal, at('mon', '22:00')).state).toBe('closed');
    expect(getOpenStatus(normal, at('mon', '11:00')).state).not.toBe('closed');
  });

  it('handles split Friday-prayer hours', () => {
    const hours: Hours = { daily: [['07:00', '20:00']], fri: [['07:00', '12:30'], ['14:00', '20:00']] };
    expect(getOpenStatus(hours, at('fri', '13:00')).state).toBe('closed');
    expect(getOpenStatus(hours, at('fri', '13:00')).opensAt).toBe('14:00');
    expect(getOpenStatus(hours, at('fri', '15:00')).state).toBe('open');
  });

  it('handles overnight hours before midnight', () => {
    const hours: Hours = { daily: [['18:00', '02:00']] };
    const s = getOpenStatus(hours, at('sat', '23:30'));
    expect(s.state).toBe('open');
    expect(s.closesAt).toBe('02:00');
  });

  it('overnight spill: open at 00:30, closing-soon at 01:30, closed at 02:00', () => {
    const hours: Hours = { daily: [['18:00', '02:00']] };
    expect(getOpenStatus(hours, at('sun', '00:30')).state).toBe('open');
    expect(getOpenStatus(hours, at('sun', '01:30')).state).toBe('closing-soon');
    expect(getOpenStatus(hours, at('sun', '02:00')).state).toBe('closed');
  });

  it('does not spill overnight when previous day range is not overnight', () => {
    const hours: Hours = { daily: [['09:00', '18:00']] };
    expect(getOpenStatus(hours, at('tue', '01:00')).state).toBe('closed');
  });

  it('handles a closed day, reporting the next open day', () => {
    const hours: Hours = { daily: [['09:00', '18:00']], sun: null };
    const s = getOpenStatus(hours, at('sun', '12:00'));
    expect(s.state).toBe('closed');
    expect(s.opensAt).toBe('tomorrow 09:00');
  });

  it('reports unknown when hours are missing (MUIS imports)', () => {
    expect(getOpenStatus(null, at('mon', '12:00')).state).toBe('unknown');
    expect(getOpenStatus(undefined, at('mon', '12:00')).state).toBe('unknown');
  });

  it('skips multiple closed days to find next opening', () => {
    const hours: Hours = { daily: null, sat: [['10:00', '16:00']] };
    const s = getOpenStatus(hours, at('mon', '12:00'));
    expect(s.state).toBe('closed');
    expect(s.opensAt).toBe('Sat 10:00');
  });
});

describe('formatDayRanges', () => {
  it('formats ranges and closed days', () => {
    const hours: Hours = { daily: [['07:00', '12:30'], ['14:00', '20:00']], sun: null };
    expect(formatDayRanges(hours, 'mon')).toBe('07:00 – 12:30, 14:00 – 20:00');
    expect(formatDayRanges(hours, 'sun')).toBe('Closed');
  });
});
