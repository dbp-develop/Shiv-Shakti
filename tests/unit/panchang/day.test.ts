import { describe, expect, it } from 'vitest';
import fixture from '../../fixtures/panchang-ujjain.json';
import { karanaName, panchangForDay } from '../../../src/panchang';
import type { Span } from '../../../src/panchang';

const TWO_MIN = 2 * 60 * 1000;
const MASAS = [
  'Chaitra',
  'Vaishakha',
  'Jyeshtha',
  'Ashadha',
  'Shravana',
  'Bhadrapada',
  'Ashwina',
  'Kartika',
  'Margashirsha',
  'Pausha',
  'Magha',
  'Phalguna',
];

const ist = (s: string) => new Date(`${s}${s.length === 16 ? ':00' : ''}+05:30`);
const istOn = (date: string, hm: string) => ist(`${date}T${hm}`);

interface FixtureSpan {
  index: number;
  end: string;
}

function expectSpans(label: string, got: Span[], want: FixtureSpan[]) {
  expect(
    got.map((s) => s.index),
    `${label} indices`,
  ).toEqual(want.map((w) => w.index));
  got.forEach((s, i) => {
    const err = Math.abs(s.end.getTime() - ist(want[i].end).getTime());
    expect(err, `${label}[${i}] end off by ${err / 1000}s`).toBeLessThanOrEqual(TWO_MIN);
  });
}

describe('panchangForDay vs Drik Panchang fixture', () => {
  for (const day of fixture.days) {
    it(day.date, () => {
      const p = panchangForDay(day.date);
      expect(Math.abs(p.sunrise.getTime() - istOn(day.date, day.sunrise).getTime())).toBeLessThanOrEqual(TWO_MIN);
      expect(Math.abs(p.sunset.getTime() - istOn(day.date, day.sunset).getTime())).toBeLessThanOrEqual(TWO_MIN);
      expectSpans('tithi', p.tithi, day.tithi);
      expectSpans('nakshatra', p.nakshatra, day.nakshatra);
      expectSpans('yoga', p.yoga, day.yoga);
      expectSpans('karana', p.karana, day.karana);
      expect(MASAS[p.amantaMasa.index]).toBe(day.amantaMasa);
      expect(p.amantaMasa.adhik).toBe(day.adhik);
      expect(p.vikramSamvat).toBe(day.vikramSamvat);
      expect(p.shakaSamvat).toBe(p.vikramSamvat - 135);
    });
  }

  it('has two tithis ending between sunrises on every kshaya-tithi day', () => {
    for (const day of fixture.days.filter((d) => d.tags.includes('kshaya-tithi'))) {
      const p = panchangForDay(day.date);
      const ending = p.tithi.filter((s) => s.end >= p.sunrise && s.end < p.nextSunrise);
      expect(ending.length, day.date).toBe(2);
    }
  });

  it('shows the same tithi at two consecutive sunrises on vriddhi days', () => {
    for (const day of fixture.days.filter((d) => d.tags.includes('vriddhi-tithi'))) {
      const p = panchangForDay(day.date);
      const prevDay = new Date(Date.parse(`${day.date}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
      expect(panchangForDay(prevDay).tithi.at(-1)!.index, day.date).toBe(p.tithi[0].index);
    }
  });
});

describe('panchangForDay derived fields', () => {
  it('gives weekday, paksha, purnimanta month, ritu and ayana', () => {
    expect(panchangForDay('2026-10-25').vara).toBe(0); // a Sunday
    const q = panchangForDay('2026-01-03'); // Purnima, Pausha, winter
    expect(q.paksha).toBe('shukla');
    expect(q.purnimantaMasa.index).toBe(q.amantaMasa.index);
    expect(q.ayana).toBe('dakshinayana'); // sidereal Makara starts mid-January
    expect(panchangForDay('2026-01-25').ayana).toBe('uttarayana');
    expect(q.ritu).toBe(Math.floor(q.amantaMasa.index / 2));
    const k = panchangForDay('2026-01-06'); // Krishna paksha: purnimanta is one month ahead
    expect(k.paksha).toBe('krishna');
    expect(k.purnimantaMasa.index).toBe((k.amantaMasa.index + 1) % 12);
    expect(panchangForDay('2026-08-10').ayana).toBe('dakshinayana');
  });
});

describe('karanaName', () => {
  it('names the 60 half-tithis', () => {
    expect(karanaName(1)).toBe('kimstughna');
    expect(karanaName(2)).toBe('bava');
    expect(karanaName(8)).toBe('vishti');
    expect(karanaName(9)).toBe('bava');
    expect(karanaName(57)).toBe('vishti');
    expect(karanaName(58)).toBe('shakuni');
    expect(karanaName(59)).toBe('chatushpada');
    expect(karanaName(60)).toBe('naga');
    expect(() => karanaName(0)).toThrow(RangeError);
    expect(() => karanaName(61)).toThrow(RangeError);
  });
});
