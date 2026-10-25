import { describe, expect, it } from 'vitest';
import fixture from '../../fixtures/panchang-ujjain.json';
import {
  findAngleCrossing,
  lahiriAyanamsa,
  localDateOf,
  moonrise,
  moonset,
  moonSidereal,
  sunrise,
  sunset,
  sunSidereal,
} from '../../../src/panchang/astro';
import { UJJAIN } from '../../../src/panchang/types';

const TWO_MIN = 2 * 60 * 1000;

/** 'HH:MM' on 'YYYY-MM-DD' in IST -> Date */
function ist(date: string, hm: string): Date {
  return new Date(`${date}T${hm}:00+05:30`);
}

describe('lahiriAyanamsa (true Lahiri)', () => {
  it('is ~23.8531° at J2000 (±0.01)', () => {
    expect(Math.abs(lahiriAyanamsa(new Date('2000-01-01T12:00:00Z')) - 23.8531)).toBeLessThan(0.01);
  });
  it("matches Drik Panchang's published value on 2026-01-03 (24.227111, ±0.002)", () => {
    expect(Math.abs(lahiriAyanamsa(new Date('2026-01-03T00:00:00+05:30')) - 24.227111)).toBeLessThan(0.002);
  });
  it("matches Drik Panchang's published value on 2026-10-25 (24.238394, ±0.002)", () => {
    expect(Math.abs(lahiriAyanamsa(new Date('2026-10-25T00:00:00+05:30')) - 24.238394)).toBeLessThan(0.002);
  });
});

describe('sidereal longitudes', () => {
  it('are normalised to [0, 360)', () => {
    for (let i = 0; i < 40; i++) {
      const d = new Date(Date.UTC(2026, 0, 1) + i * 9.3 * 864e5);
      for (const v of [sunSidereal(d), moonSidereal(d)]) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(360);
      }
    }
  });
  it('puts the Sun in sidereal Mesha (0–30°) shortly after Mesha Sankranti 2026 (~14 Apr)', () => {
    const s = sunSidereal(new Date('2026-04-20T00:00:00Z'));
    expect(s).toBeGreaterThan(0);
    expect(s).toBeLessThan(30);
  });
});

describe('sunrise / sunset vs Drik Panchang (Ujjain)', () => {
  for (const day of fixture.days) {
    it(`${day.date}: sunrise ${day.sunrise}, sunset ${day.sunset} (±2 min)`, () => {
      const rise = sunrise(day.date, UJJAIN);
      const set = sunset(day.date, UJJAIN);
      expect(Math.abs(rise.getTime() - ist(day.date, day.sunrise).getTime())).toBeLessThanOrEqual(TWO_MIN);
      expect(Math.abs(set.getTime() - ist(day.date, day.sunset).getTime())).toBeLessThanOrEqual(TWO_MIN);
    });
  }
});

describe('moonrise / moonset', () => {
  it('returns a time on the requested local date, or null', () => {
    for (const day of fixture.days) {
      for (const t of [moonrise(day.date, UJJAIN), moonset(day.date, UJJAIN)]) {
        if (t !== null) expect(localDateOf(t, UJJAIN.tz)).toBe(day.date);
      }
    }
  });
});

describe('findAngleCrossing', () => {
  it('finds the crossing of a synthetic 1°/hour angle', () => {
    const f = (d: Date) => (d.getTime() / 3.6e6) % 360;
    const got = findAngleCrossing(f, 10, new Date(5 * 3.6e6), 2);
    expect(Math.abs(got.getTime() - 10 * 3.6e6)).toBeLessThanOrEqual(1000);
  });
  it('handles the 360 -> 0 wrap', () => {
    const f = (d: Date) => (d.getTime() / 3.6e6) % 360;
    const got = findAngleCrossing(f, 0, new Date(350 * 3.6e6), 2);
    expect(Math.abs(got.getTime() - 360 * 3.6e6)).toBeLessThanOrEqual(1000);
  });
});

describe('localDateOf', () => {
  it('returns the date in the given time zone', () => {
    expect(localDateOf(new Date('2026-10-25T20:00:00Z'), 'Asia/Kolkata')).toBe('2026-10-26');
    expect(localDateOf(new Date('2026-10-25T18:00:00Z'), 'Asia/Kolkata')).toBe('2026-10-25');
  });
});
