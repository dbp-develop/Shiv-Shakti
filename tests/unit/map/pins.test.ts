// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import type { Map as MlMap } from 'maplibre-gl';
import type { Temple } from '../../../src/content/schema';

vi.mock('../../../src/map/icons', () => ({
  ICON_PIXEL_RATIO: 1.5,
  ICON_IDS: ['pin-jyotirlinga', 'pin-maha-peetha', 'pin-peetha', 'pin-alternate'],
  renderIcon: (id: string) => ({ width: 1, height: 1, data: new Uint8ClampedArray(4), id }),
}));

import {
  buildMarkerList,
  installPins,
  pinHitAt,
  pinLayers,
  setPinsData,
  setPinsSelected,
  templesToGeoJSON,
  templeIdOf,
} from '../../../src/map/pins';

const fx = (n: string): Temple => JSON.parse(readFileSync(`tests/fixtures/temples/${n}.json`, 'utf8'));
const mahakal = fx('mahakaleshwar');
const kedar = fx('kedarnath');
const kamakhya = fx('kamakhya');

describe('templesToGeoJSON', () => {
  it('has one feature per temple plus one per alternate site', () => {
    const withAlt: Temple = {
      ...kedar,
      alternateSites: [
        { name: { ...kedar.name, en: 'Alt A' }, lat: 30.1, lng: 79.1, note: kedar.name },
        { name: { ...kedar.name, en: 'Alt B' }, lat: 30.2, lng: 79.2, note: kedar.name },
      ],
    };
    const fc = templesToGeoJSON([mahakal, withAlt, kamakhya], 'en');
    expect(fc.features).toHaveLength(3 + 2);
    const alts = fc.features.filter((f) => f.properties.category === 'alternate');
    expect(alts.map((f) => f.properties.id)).toEqual([`${kedar.id}~0`, `${kedar.id}~1`]);
    expect(alts[0].geometry.coordinates).toEqual([79.1, 30.1]);
    expect(alts[0].properties.name).toBe('Alt A');
  });

  it('maps categories and [lng, lat] coordinates', () => {
    const fc = templesToGeoJSON([mahakal, kamakhya], 'en');
    expect(fc.features[0].properties).toMatchObject({ id: mahakal.id, category: 'jyotirlinga' });
    expect(fc.features[1].properties).toMatchObject({ id: 'kamakhya', category: 'maha-peetha' });
    expect(fc.features[1].geometry.coordinates).toEqual([91.7058, 26.1664]);
  });

  it('classifies a peetha outside the 18 as peetha', () => {
    const plain: Temple = { ...kamakhya, lists: ['peetha-nirnaya-51'] };
    expect(templesToGeoJSON([plain], 'en').features[0].properties.category).toBe('peetha');
  });

  it('follows the language with an English fallback', () => {
    expect(templesToGeoJSON([kamakhya], 'hi').features[0].properties.name).toBe('कामाख्या');
    expect(templesToGeoJSON([kamakhya], 'bn').features[0].properties.name).toBe('Kamakhya');
  });
});

describe('templeIdOf', () => {
  it('maps alternate ids to their parent', () => {
    expect(templeIdOf('kedarnath~2')).toBe('kedarnath');
    expect(templeIdOf('kedarnath')).toBe('kedarnath');
  });
});

describe('pin layers and settings', () => {
  it('shows a count on clusters, never hides pins, and scales the maha-peetha pin 1.4x', () => {
    const layers = pinLayers('dark');
    const ids = layers.map((l) => l.id);
    expect(ids).toEqual(expect.arrayContaining(['pins-cluster', 'pins-cluster-count', 'pins']));
    const pins = layers.find((l) => l.id === 'pins') as any;
    expect(pins.layout['icon-allow-overlap']).toBe(true);
    expect(JSON.stringify(pins.layout['icon-size'])).toContain('1.4');
    const count = layers.find((l) => l.id === 'pins-cluster-count') as any;
    expect(JSON.stringify(count.layout['text-field'])).toContain('point_count_abbreviated');
  });
});

function fakeMap(opts: { hasImage?: boolean } = {}) {
  const sources: Record<string, any> = {};
  const layers: any[] = [];
  const images = new Set<string>();
  const map: any = {
    getSource: vi.fn((id: string) => sources[id]),
    addSource: vi.fn((id: string, spec: any) => {
      sources[id] = { spec, setData: vi.fn() };
    }),
    getLayer: vi.fn((id: string) => layers.find((l) => l.id === id)),
    addLayer: vi.fn((l: any) => layers.push(l)),
    hasImage: vi.fn((id: string) => images.has(id) || !!opts.hasImage),
    addImage: vi.fn((id: string) => images.add(id)),
    setFilter: vi.fn(),
    getStyle: () => ({ layers: [{ id: 'lbl', type: 'symbol', layout: { 'text-font': ['Noto Sans Regular'] } }] }),
    queryRenderedFeatures: vi.fn(() => []),
  };
  return { map: map as MlMap & typeof map, sources, layers };
}

describe('installPins', () => {
  it('adds the clustered source, the images and the layers, and is idempotent', () => {
    const { map, sources, layers } = fakeMap();
    installPins(map, 'dark', [kamakhya], 'en', null);
    expect(sources.temples.spec).toMatchObject({ type: 'geojson', cluster: true, clusterMaxZoom: 7, clusterRadius: 40 });
    expect(map.addImage).toHaveBeenCalledTimes(4);
    const n = layers.length;
    installPins(map, 'dark', [kamakhya], 'en', null);
    expect(layers).toHaveLength(n);
    expect(map.addSource).toHaveBeenCalledTimes(1);
    expect(map.addImage).toHaveBeenCalledTimes(4);
  });

  it('re-adds images after a style reset (images wiped, source gone)', () => {
    const a = fakeMap();
    installPins(a.map, 'dark', [], 'en', null);
    const b = fakeMap();
    installPins(b.map, 'light', [kamakhya], 'en', 'kamakhya');
    expect(b.map.addImage).toHaveBeenCalledTimes(4);
    expect(b.sources.temples.spec.data.features).toHaveLength(1);
    expect(b.layers.find((l) => l.id === 'pins-selected').filter).toEqual(['==', ['get', 'id'], 'kamakhya']);
  });

  it('setPinsData and setPinsSelected update the live map', () => {
    const { map, sources } = fakeMap();
    installPins(map, 'dark', [], 'en', null);
    setPinsData(map, [mahakal], 'en');
    expect(sources.temples.setData).toHaveBeenCalledWith(expect.objectContaining({ type: 'FeatureCollection' }));
    setPinsSelected(map, 'x');
    expect(map.setFilter).toHaveBeenCalledWith('pins-selected', ['==', ['get', 'id'], 'x']);
  });
});

describe('pinHitAt', () => {
  it('reports clusters, pins and misses', () => {
    const { map, layers } = fakeMap();
    installPins(map, 'dark', [], 'en', null);
    expect(pinHitAt(map, [1, 1])).toBeNull();
    (map.queryRenderedFeatures as any).mockReturnValueOnce([
      { properties: { cluster: true, cluster_id: 7 }, geometry: { type: 'Point', coordinates: [80, 20] } },
    ]);
    expect(pinHitAt(map, [1, 1])).toEqual({ kind: 'cluster', clusterId: 7, center: [80, 20] });
    (map.queryRenderedFeatures as any).mockReturnValueOnce([
      { properties: { id: 'kedarnath~1' }, geometry: { type: 'Point', coordinates: [79, 30] } },
    ]);
    expect(pinHitAt(map, [1, 1])).toEqual({ kind: 'pin', id: 'kedarnath~1', templeId: 'kedarnath' });
    expect(layers.length).toBeGreaterThan(0);
  });
  it('returns null before the layers exist', () => {
    const { map } = fakeMap();
    expect(pinHitAt(map, [0, 0])).toBeNull();
  });
});

describe('padded hit test', () => {
  it('queries a box of at least 44x44 px around the tap', () => {
    const { map } = fakeMap();
    installPins(map, 'dark', [], 'en', null);
    pinHitAt(map, [100, 200]);
    const [box] = (map.queryRenderedFeatures as any).mock.calls.at(-1);
    const [[x0, y0], [x1, y1]] = box;
    expect(x1 - x0).toBeGreaterThanOrEqual(44);
    expect(y1 - y0).toBeGreaterThanOrEqual(44);
    expect(x0 <= 100 && 100 <= x1 && y0 <= 200 && 200 <= y1).toBe(true);
  });
  it('selects a pin whose icon is 15px off the tap', () => {
    const { map } = fakeMap();
    installPins(map, 'dark', [], 'en', null);
    const iconAt = { x: 115, y: 200 };
    (map.queryRenderedFeatures as any).mockImplementation((box: any) => {
      const [[x0, y0], [x1, y1]] = box;
      const inside = iconAt.x >= x0 && iconAt.x <= x1 && iconAt.y >= y0 && iconAt.y <= y1;
      return inside ? [{ properties: { id: 'kedarnath' }, geometry: { type: 'Point', coordinates: [79, 30] } }] : [];
    });
    expect(pinHitAt(map, [100, 200])).toMatchObject({ kind: 'pin', templeId: 'kedarnath' });
    expect(pinHitAt(map, [100, 300])).toBeNull();
  });
});

describe('buildMarkerList', () => {
  it('starts with a skip button that calls onSkip', () => {
    const host = document.createElement('div');
    const onSkip = vi.fn();
    buildMarkerList(host, [mahakal], 'en', vi.fn(), onSkip);
    const first = host.querySelector('button') as HTMLButtonElement;
    expect(first.textContent).toBe('Skip temple list');
    first.click();
    expect(onSkip).toHaveBeenCalled();
    expect(host.querySelectorAll('li button')).toHaveLength(1);
  });
  it('renders a labelled, focusable button per pin that selects the parent on Enter/click', () => {
    const host = document.createElement('div');
    const onPick = vi.fn();
    const withAlt: Temple = {
      ...kedar,
      alternateSites: [{ name: { ...kedar.name, en: 'Alt A' }, lat: 30.1, lng: 79.1, note: kedar.name }],
    };
    buildMarkerList(host, [mahakal, withAlt], 'en', onPick);
    const buttons = host.querySelectorAll<HTMLButtonElement>('li button');
    expect(buttons).toHaveLength(3);
    expect(host.querySelector('ul')?.getAttribute('aria-label')).toBeTruthy();
    expect(buttons[0].getAttribute('aria-label')).toContain(mahakal.name.en);
    expect(buttons[0].getAttribute('aria-label')).toContain('Jyotirlinga');
    expect(buttons[1].getAttribute('aria-label')).toBe('Kedarnath, Jyotirlinga');
    expect(buttons[2].getAttribute('aria-label')).toBe('Alt A, Other claimed site');
    for (const b of buttons) {
      expect(b.tagName).toBe('BUTTON'); // natively focusable and Enter/Space-activatable
      expect(b.getAttribute('tabindex')).not.toBe('-1');
    }
    buttons[2].click();
    expect(onPick).toHaveBeenCalledWith('kedarnath');
    // rebuild replaces rather than appends
    buildMarkerList(host, [mahakal], 'en', onPick);
    expect(host.querySelectorAll('li button')).toHaveLength(1);
  });
});
