import { describe, expect, it, vi } from 'vitest';
import { allowUntranslated } from '../../../src/content/langs';
import { calendarTerms } from '../../../src/i18n';
import { setLang } from '../../../src/state';
import {
  FestivalSchema,
  festivalWhenText,
  loadFestivals,
  type FestivalDef,
} from '../../../src/content/festivals';

setLang('en');

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
  'rangbhari-ekadashi': 'Phalguna Shukla 11 (Feb–Mar)',
};

const name = { en: 'X', hi: 'X', bn: 'X', mr: 'X', ta: 'X', te: 'X', gu: 'X' };
const untranslated = { ...name, hi: '', bn: '', mr: '', ta: '', te: '', gu: '' };
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
    expect(festivalWhenText(f, calendarTerms(), 'en')).toBe(text);
  });

  it('renders a year-wrapping month range as Dec–Jan', () => {
    const f = FestivalSchema.parse({ ...base, months: [12, 1] }) as FestivalDef;
    expect(festivalWhenText(f, calendarTerms(), 'en')).toBe('Chaitra Shukla 1 (Dec–Jan)');
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
      expect(FestivalSchema.safeParse({ ...base, name: untranslated }).success).toBe(false);
      process.env.ALLOW_UNTRANSLATED = '1';
      expect(FestivalSchema.safeParse({ ...base, name: untranslated }).success).toBe(true);
    } finally {
      if (prev === undefined) delete process.env.ALLOW_UNTRANSLATED;
      else process.env.ALLOW_UNTRANSLATED = prev;
    }
  });

  it('does not touch process when it is undefined (browser)', () => {
    vi.stubGlobal('process', undefined);
    try {
      expect(allowUntranslated()).toBe(false);
      expect(FestivalSchema.safeParse({ ...base, name: untranslated }).success).toBe(false);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
