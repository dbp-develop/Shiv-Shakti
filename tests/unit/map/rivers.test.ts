import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import type { LineLayerSpecification, Map as MlMap } from 'maplibre-gl';
import { l10nSchema, LANGS } from '../../../src/content/langs';
import { saraswatiSchema } from '../../../src/content/saraswati';
import {
  RIVER_IDS,
  RIVERS_ATTRIBUTION,
  TRIVENI_SANGAM,
  installRivers,
  riverIdAt,
  riverLayers,
  setRiversLang,
} from '../../../src/map/rivers';

const readJson = (p: string): any => JSON.parse(readFileSync(p, 'utf8'));
const FILES = ['ganga', 'yamuna', 'narmada', 'godavari', 'kaveri', 'shipra', 'brahmaputra', 'saraswati'];

function coords(g: any): number[][] {
  if (g.type === 'LineString') return g.coordinates;
  if (g.type === 'MultiLineString') return g.coordinates.flat();
  throw new Error(`unexpected geometry ${g.type}`);
}

describe('river data files', () => {
  it('lists the 8 rivers', () => {
    expect([...RIVER_IDS].sort()).toEqual([...FILES].sort());
  });

  it.each(FILES)('%s.geojson parses with id, kind and all 7 name keys', (id) => {
    const fc = readJson(`content/rivers/${id}.geojson`);
    expect(fc.type).toBe('FeatureCollection');
    expect(fc.features.length).toBeGreaterThan(0);
    for (const f of fc.features) {
      expect(f.properties.id).toBe(id);
      expect(['living', 'ancient']).toContain(f.properties.kind);
      expect(Object.keys(f.properties.name).sort()).toEqual([...LANGS].sort());
      expect(() => l10nSchema().parse(f.properties.name)).not.toThrow();
      expect(f.properties.name.en.length).toBeGreaterThan(0);
    }
  });

  it('only the Saraswati is ancient', () => {
    for (const id of FILES) {
      const kind = readJson(`content/rivers/${id}.geojson`).features[0].properties.kind;
      expect(kind).toBe(id === 'saraswati' ? 'ancient' : 'living');
    }
  });

  it.each(FILES)('%s stays inside the map bounds', (id) => {
    for (const f of readJson(`content/rivers/${id}.geojson`).features)
      for (const [x, y] of coords(f.geometry)) {
        expect(x).toBeGreaterThanOrEqual(55);
        expect(x).toBeLessThanOrEqual(105);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(40);
      }
  });

  it('the Saraswati runs from Adi Badri to the Rann of Kutch via the brief waypoints', () => {
    const c = coords(readJson('content/rivers/saraswati.geojson').features[0].geometry);
    expect(c[0]).toEqual([77.33, 30.45]);
    expect(c[c.length - 1]).toEqual([70.5, 24.5]);
    expect(c.length).toBeGreaterThan(8); // smoothed, not just the raw waypoints
  });

  it('keeps every file small', () => {
    for (const id of FILES) expect(readFileSync(`content/rivers/${id}.geojson`).length).toBeLessThan(300_000);
  });
});

describe('saraswati.json', () => {
  const data = readJson('content/rivers/saraswati.json');
  it('matches the schema', () => {
    expect(() => saraswatiSchema().parse(data)).not.toThrow();
  });
  it('cites hymns, ISRO findings and the debate, each section with sources', () => {
    const body = (id: string): string => data.sections.find((s: any) => s.id === id).body.en;
    expect(body('rigveda')).toMatch(/2\.41\.16/);
    expect(body('rigveda')).toMatch(/6\.61/);
    expect(body('rigveda')).toMatch(/7\.95/);
    expect(body('science')).toMatch(/ISRO/);
    expect(body('science')).toMatch(/CGWB|Central Ground Water Board/);
    expect(body('debated')).toMatch(/reconstruction/i);
    expect(body('debated')).toMatch(/debat/i);
    for (const s of data.sections) {
      expect(s.sources.length).toBeGreaterThan(0);
      for (const src of s.sources) expect(src.url).toMatch(/^https:\/\//);
    }
  });
});

describe('riverLayers', () => {
  const lines = (theme: 'dark' | 'light') =>
    riverLayers(theme).filter((l): l is LineLayerSpecification => l.type === 'line');

  it('draws ancient rivers dashed', () => {
    const dashed = lines('dark').filter((l) => l.paint?.['line-dasharray']);
    expect(dashed.length).toBeGreaterThan(0);
    for (const l of dashed) expect(JSON.stringify(l.filter)).toContain('ancient');
  });

  it('draws living rivers as a blurred glow stacked under a sharp line', () => {
    const living = riverLayers('dark')
      .map((l, i) => ({ l, i }))
      .filter((x): x is { l: LineLayerSpecification; i: number } => x.l.type === 'line' && String(JSON.stringify(x.l.filter)).includes('living') && !!x.l.paint?.['line-color']);
    const glow = living.filter((x) => (x.l.paint?.['line-blur'] as number | undefined) !== undefined && (x.l.paint?.['line-blur'] as number) > 0);
    const sharp = living.filter((x) => !x.l.paint?.['line-blur'] && (x.l.paint?.['line-opacity'] as number) !== 0 && !x.l.paint?.['line-dasharray'] && x.l.id.includes('line'));
    expect(glow.length).toBe(1);
    expect(sharp.length).toBe(1);
    expect(glow[0].i).toBeLessThan(sharp[0].i);
    expect(living.every((x) => !x.l.paint?.['line-dasharray'])).toBe(true);
  });

  it('uses different colours per theme', () => {
    const c = (t: 'dark' | 'light') => lines(t).map((l) => l.paint?.['line-color']);
    expect(c('dark')).not.toEqual(c('light'));
  });

  it('has an invisible tap target for rivers but none for the Triveni Sangam point', () => {
    const hit = riverLayers('dark').filter((l) => l.id.includes('hit'));
    expect(hit.length).toBe(1);
    expect((hit[0] as any).source).toBe('rivers');
    expect(riverLayers('dark').some((l) => l.id.startsWith('triveni'))).toBe(true);
  });

  it('labels use the lang name with an English fallback', () => {
    const label = riverLayers('dark', 'hi').find((l) => l.id === 'rivers-label') as any;
    expect(label?.type).toBe('symbol');
    const s = JSON.stringify(label?.layout?.['text-field']);
    expect(s).toContain('"hi"');
    expect(s).toContain('"en"');
    expect(JSON.stringify((riverLayers('dark', 'en').find((l) => l.id === 'rivers-label') as any)?.layout?.['text-field'])).not.toContain('"hi"');
  });

  it('Triveni Sangam is at Prayagraj', () => {
    expect(TRIVENI_SANGAM.coordinates).toEqual([81.885, 25.4246]);
    for (const l of LANGS) expect(TRIVENI_SANGAM.name[l].length).toBeGreaterThan(0);
  });
});

function fakeMap() {
  const sources = new Map<string, any>();
  const layers: any[] = [{ id: 'place', type: 'symbol' }];
  const map = {
    getStyle: () => ({ layers }),
    getSource: vi.fn((id: string) => sources.get(id)),
    getLayer: vi.fn((id: string) => layers.find((l) => l.id === id)),
    addSource: vi.fn((id: string, spec: any) => sources.set(id, spec)),
    addLayer: vi.fn((spec: any, before?: string) => {
      const i = before ? layers.findIndex((l) => l.id === before) : -1;
      i >= 0 ? layers.splice(i, 0, spec) : layers.push(spec);
    }),
    setLayoutProperty: vi.fn(),
    queryRenderedFeatures: vi.fn(),
  };
  return map;
}

describe('installRivers', () => {
  it('adds the sources and layers once, with OSM attribution', () => {
    const m = fakeMap();
    installRivers(m as unknown as MlMap, 'dark', 'en');
    const n = m.addLayer.mock.calls.length;
    expect(n).toBe(riverLayers('dark').length);
    expect(m.addSource.mock.calls[0][1].attribution).toBe(RIVERS_ATTRIBUTION);
    expect(RIVERS_ATTRIBUTION).toContain('© OpenStreetMap contributors');
    installRivers(m as unknown as MlMap, 'dark', 'en');
    expect(m.addLayer.mock.calls.length).toBe(n);
    expect(m.addSource).toHaveBeenCalledTimes(2);
    // line layers go under the first symbol layer
    expect(m.addLayer.mock.calls.find((c) => c[0].id === 'rivers-line')?.[1]).toBe('place');
  });

  it('reinstalls after a style wipe', () => {
    const m = fakeMap();
    installRivers(m as unknown as MlMap, 'dark', 'en');
    m.getStyle().layers.splice(1);
    (m.getSource as any).mockImplementation(() => undefined);
    installRivers(m as unknown as MlMap, 'light', 'en');
    expect(m.addSource).toHaveBeenCalledTimes(4);
  });

  it('setRiversLang rewrites the label text fields', () => {
    const m = fakeMap();
    installRivers(m as unknown as MlMap, 'dark', 'en');
    setRiversLang(m as unknown as MlMap, 'ta');
    const calls = m.setLayoutProperty.mock.calls;
    expect(calls.map((c) => c[0]).sort()).toEqual(['rivers-label', 'triveni-label']);
    expect(JSON.stringify(calls[0][2])).toContain('"ta"');
  });
});

describe('riverIdAt', () => {
  it('returns the id of the river under the tap, or null', () => {
    const m = fakeMap();
    installRivers(m as unknown as MlMap, 'dark', 'en');
    m.queryRenderedFeatures.mockReturnValueOnce([{ properties: { id: 'saraswati' } }]);
    expect(riverIdAt(m as unknown as MlMap, [1, 2])).toBe('saraswati');
    expect(m.queryRenderedFeatures).toHaveBeenCalledWith(expect.anything(), { layers: ['rivers-hit'] });
    m.queryRenderedFeatures.mockReturnValueOnce([]);
    expect(riverIdAt(m as unknown as MlMap, [1, 2])).toBeNull();
  });
  it('is null when the layer is not installed yet', () => {
    expect(riverIdAt(fakeMap() as unknown as MlMap, [0, 0])).toBeNull();
  });
});
