import { describe, expect, it } from 'vitest';
import {
  FestivalSchema,
  festivalWhenText,
  loadFestivals,
  type CalendarTerms,
  type FestivalDef,
} from '../../../src/content/festivals';

// Task 7 moves these into content/i18n/en.json under calendar.*
export const EN_TERMS: CalendarTerms = {
  masas: ['Chaitra', 'Vaishakha', 'Jyeshtha', 'Ashadha', 'Shravana', 'Bhadrapada', 'Ashvina', 'Kartika', 'Margashirsha', 'Pausha', 'Magha', 'Phalguna'],
  rashis: ['Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya', 'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena'],
  weekdaysPlural: ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'],
  shukla: 'Shukla',
  krishna: 'Krishna',
  purnima: 'Purnima',
  amavasya: 'Amavasya',
  tpl: {
    tithi: '{masa} {paksha} {tithi}',
    tithiRange: '{masa} {paksha} {from}–{to}',
    special: '{masa} {name}',
    sankranti: 'Sun enters {rashi}',
    sankrantiFrom: 'From day {n} of solar {masa}, {days} days',
    weekdayInMasa: '{weekdays} of {masa}',
    withMonths: '{when} ({months})',
  },
};

const EXPECTED: Record<string, string> = {
  'maha-shivaratri': 'Phalguna Krishna 14 (Feb–Mar)',
  'chaitra-navratri': 'Chaitra Shukla 1–9 (Mar–Apr)',
  'sharad-navratri': 'Ashvina Shukla 1–9 (Sep–Oct)',
  'durga-puja': 'Ashvina Shukla 6–10 (Sep–Oct)',
  diwali: 'Kartika Amavasya (Oct–Nov)',
  'kartik-purnima': 'Kartika Purnima (Oct–Nov)',
  'guru-purnima': 'Ashadha Purnima (Jun–Jul)',
  'nag-panchami': 'Shravana Shukla 5 (Jul–Aug)',
  'shravan-somvar': 'Mondays of Shravana (Jul–Aug)',
  'makar-sankranti': 'Sun enters Makara (Jan)',
  ambubachi: 'From day 7 of solar Ashadha, 4 days (Jun)',
};

const name = { en: 'X', hi: '', bn: '', mr: '', ta: '', te: '', gu: '' };
const base = { id: 'x', name, when: { kind: 'tithi', masa: 0, paksha: 'shukla', tithi: 1 }, months: [3] };

describe('festival data', () => {
  const festivals = loadFestivals();

  it('has unique ids covering the table', () => {
    const ids = festivals.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.sort()).toEqual(Object.keys(EXPECTED).sort());
  });

  it.each(Object.entries(EXPECTED))('renders %s', (id, text) => {
    const f = festivals.find((x) => x.id === id)!;
    expect(festivalWhenText(f, EN_TERMS, 'en')).toBe(text);
  });

  it('renders a year-wrapping month range as Dec–Jan', () => {
    const f = FestivalSchema.parse({ ...base, months: [12, 1] }) as FestivalDef;
    expect(festivalWhenText(f, EN_TERMS, 'en')).toBe('Chaitra Shukla 1 (Dec–Jan)');
  });
});

describe('FestivalSchema', () => {
  it('accepts a valid festival', () => {
    expect(FestivalSchema.safeParse(base).success).toBe(true);
  });

  it.each([
    ['empty months', { months: [] }],
    ['month 13', { months: [13] }],
    ['tithi 16', { when: { kind: 'tithi', masa: 0, paksha: 'shukla', tithi: 16 } }],
    ['masa 12', { when: { kind: 'tithi', masa: 12, paksha: 'shukla', tithi: 1 } }],
    ['missing name.en', { name: { ...name, en: undefined } }],
    ['empty name.en', { name: { ...name, en: '' } }],
    ['missing name.hi key', { name: { ...name, hi: undefined } }],
  ])('rejects %s', (_label, patch) => {
    expect(FestivalSchema.safeParse({ ...base, ...patch }).success).toBe(false);
  });

  it('requires non-en languages unless ALLOW_UNTRANSLATED=1', () => {
    const prev = process.env.ALLOW_UNTRANSLATED;
    try {
      process.env.ALLOW_UNTRANSLATED = '0';
      expect(FestivalSchema.safeParse(base).success).toBe(false);
    } finally {
      process.env.ALLOW_UNTRANSLATED = prev;
    }
  });
});
