import { readFileSync, readdirSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { LANGS } from '../../src/content/langs';
import { calendarTerms, detectLang, loc, lookup, t, tList } from '../../src/i18n';
import { lang, setLang, setTheme, theme } from '../../src/state';

const load = (l: string): unknown => JSON.parse(readFileSync(`content/i18n/${l}.json`, 'utf8'));

/** Deep shape: object keys, list lengths and leaf type. */
function shape(v: unknown, path = ''): string[] {
  if (Array.isArray(v)) return [`${path}[${v.length}]`, ...v.flatMap((x, i) => shape(x, `${path}[${i}]`))];
  if (v && typeof v === 'object')
    return Object.entries(v).flatMap(([k, x]) => shape(x, path ? `${path}.${k}` : k));
  return [`${path}:${typeof v}`];
}

function placeholders(v: unknown): string[] {
  if (typeof v === 'string') return [(v.match(/\{\w+\}/g) ?? []).sort().join(',')];
  if (Array.isArray(v)) return v.flatMap(placeholders);
  if (v && typeof v === 'object') return Object.values(v).flatMap(placeholders);
  return [];
}

describe('i18n files', () => {
  it('has exactly the 7 language files', () => {
    expect(readdirSync('content/i18n').sort()).toEqual(LANGS.map((l) => `${l}.json`).sort());
  });

  it.each(LANGS.filter((l) => l !== 'en'))('%s has exactly the key set of en', (l) => {
    expect(shape(load(l))).toEqual(shape(load('en')));
  });

  it.each(LANGS)('%s has no empty strings and en placeholders are kept', (l) => {
    const walk = (v: unknown): string[] =>
      typeof v === 'string' ? [v] : v && typeof v === 'object' ? Object.values(v).flatMap(walk) : [];
    expect(walk(load(l)).filter((s) => s.trim() === '')).toEqual([]);
    expect(placeholders(load(l))).toEqual(placeholders(load('en')));
  });

  it('has 12 masas, 12 rashis and 7 weekdays in every language', () => {
    for (const l of LANGS) {
      const c = (load(l) as { calendar: Record<string, string[]> }).calendar;
      expect([c.masas!.length, c.rashis!.length, c.weekdaysPlural!.length]).toEqual([12, 12, 7]);
    }
  });
});

describe('detectLang', () => {
  it('matches by primary subtag', () => {
    expect(detectLang(['ta-IN', 'en'])).toBe('ta');
    expect(detectLang(['fr', 'hi-IN'])).toBe('hi');
    expect(detectLang(['GU'])).toBe('gu');
  });
  it('falls back to en', () => {
    expect(detectLang(['fr'])).toBe('en');
    expect(detectLang([])).toBe('en');
  });
});

describe('t / tList / loc / calendarTerms', () => {
  beforeEach(() => setLang('en'));

  it('returns the key when missing', () => {
    expect(t('missing.key')).toBe('missing.key');
  });
  it('interpolates vars', () => {
    expect(t('app.title')).toBe('Shiv-Shakti');
    expect(t('calendar.tpl.sankranti', { rashi: 'X' })).toBe('Sun enters X');
    expect(t('calendar.tpl.sankranti', { other: 'X' })).toBe('Sun enters {rashi}');
    expect(t('calendar.tpl.tithi', { masa: 'M', paksha: 'P', tithi: 3 })).toBe('M P 3');
  });
  it('uses the current language', () => {
    setLang('hi');
    expect(lang.value).toBe('hi');
    expect(t('app.title')).toBe('शिव-शक्ति');
    expect(tList('calendar.masas')[0]).toBe('चैत्र');
  });
  it('lookup falls back to en, then undefined', () => {
    const empty = { en: {}, hi: {}, bn: {}, mr: {}, ta: {}, te: {}, gu: {} };
    const dicts = { ...empty, en: { a: { b: 'EN', c: ['x'] }, only: 'en-only' }, hi: { a: { b: 'HI' } } };
    expect(lookup(dicts, 'hi', 'a.b')).toBe('HI');
    expect(lookup(dicts, 'hi', 'only')).toBe('en-only');
    expect(lookup(dicts, 'hi', 'a.c')).toEqual(['x']);
    expect(lookup(dicts, 'hi', 'nope.x')).toBeUndefined();
  });
  it('tList returns [] for a missing list', () => {
    expect(tList('nope')).toEqual([]);
  });
  it('loc falls back to en and flags it', () => {
    const v = { en: 'Hello', hi: '', bn: '', mr: '', ta: '', te: '', gu: '' };
    expect(loc(v)).toEqual({ text: 'Hello', fallback: false });
    setLang('hi');
    expect(loc(v)).toEqual({ text: 'Hello', fallback: true });
    setLang('hi');
    expect(loc({ ...v, hi: 'नमस्ते' })).toEqual({ text: 'नमस्ते', fallback: false });
  });
  it('calendarTerms builds from calendar.*', () => {
    const c = calendarTerms();
    expect(c.masas).toHaveLength(12);
    expect(c.tpl.withMonths).toBe('{when} ({months})');
    expect(c.shukla).toBe('Shukla');
  });
});

describe('state outside a browser', () => {
  it('setTheme only accepts dark | light', () => {
    setTheme('light');
    expect(theme.value).toBe('light');
    setTheme('evil' as never);
    expect(theme.value).toBe('dark');
  });
});
