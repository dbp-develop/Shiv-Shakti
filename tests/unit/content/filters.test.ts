import { describe, expect, it } from 'vitest';
import { applyFilters, type Filters } from '../../../src/content/filters';
import { searchTemples } from '../../../src/content/search';
import { nearestTemples } from '../../../src/content/geo';
import { loadFestivals } from '../../../src/content/festivals';
import type { PinCategory, Temple } from '../../../src/content/schema';
import mahakal from '../../fixtures/temples/mahakaleshwar.json';
import kedar from '../../fixtures/temples/kedarnath.json';
import kamakhya from '../../fixtures/temples/kamakhya.json';

const all = [mahakal, kedar, kamakhya] as Temple[];
const festivals = loadFestivals();
const cats = (...c: PinCategory[]): Filters['categories'] => new Set(c);
const everything = cats('jyotirlinga', 'maha-peetha', 'peetha');
const ids = (ts: Temple[]) => ts.map((t) => t.id);

describe('applyFilters', () => {
  it('drops kamakhya when only jyotirlingas are selected', () => {
    expect(ids(applyFilters(all, { categories: cats('jyotirlinga') }, festivals))).toEqual(['mahakaleshwar', 'kedarnath']);
  });
  it('filters by list and region', () => {
    expect(ids(applyFilters(all, { categories: everything, list: 'adi-4' }, festivals))).toEqual(['kamakhya']);
    expect(ids(applyFilters(all, { categories: everything, region: 'Uttarakhand' }, festivals))).toEqual(['kedarnath']);
  });
  it('festival month keeps a multi-month festival in both months and drops it outside', () => {
    const f = (festivalMonth: number) => ids(applyFilters(all, { categories: cats('jyotirlinga'), festivalMonth }, festivals));
    expect(f(2)).toEqual(['mahakaleshwar', 'kedarnath']);
    expect(f(3)).toEqual(['mahakaleshwar', 'kedarnath']);
    expect(f(8)).toEqual([]);
  });
});

describe('searchTemples', () => {
  it('finds kedarnath by Devanagari prefix and Latin', () => {
    expect(ids(searchTemples(all, 'केदार'))).toEqual(['kedarnath']);
    expect(ids(searchTemples(all, 'kedar'))).toEqual(['kedarnath']);
  });
  it('is case- and diacritic-insensitive and matches aliases and deities', () => {
    expect(ids(searchTemples(all, 'KĀMAKHYĀ'))).toEqual(['kamakhya']);
    expect(ids(searchTemples(all, 'kamarupa'))).toEqual(['kamakhya']);
    expect(ids(searchTemples(all, 'mahakala'))).toEqual(['mahakaleshwar']);
  });
  it('keeps Devanagari vowel signs significant', () => {
    expect(searchTemples(all, 'केदर')).toEqual([]);
  });
});

describe('nearestTemples', () => {
  it('puts mahakaleshwar first from Ujjain', () => {
    const r = nearestTemples(all, { lat: 23.1828, lng: 75.7682 });
    expect(r[0]!.temple.id).toBe('mahakaleshwar');
    expect(r[0]!.km).toBeLessThan(1);
    expect(r).toHaveLength(3);
    expect(nearestTemples(all, { lat: 23.1828, lng: 75.7682 }, 2)).toHaveLength(2);
  });
});
