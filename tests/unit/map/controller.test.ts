// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

const MapCtor = vi.hoisted(() => vi.fn());
vi.mock('maplibre-gl', () => ({ default: { Map: MapCtor } }));
vi.mock('maplibre-gl/dist/maplibre-gl.css', () => ({}));

vi.mock('../../../src/map/terrain', () => ({ DEFAULT_PITCH: 45, installTerrain: vi.fn(), setTerrainEnabled: vi.fn() }));
vi.mock('../../../src/map/boundary', () => ({ installBoundary: vi.fn() }));
vi.mock('../../../src/map/icons', () => ({ ICON_IDS: ['pin-jyotirlinga'], ICON_PIXEL_RATIO: 1.5, renderIcon: () => ({}) }));

import { createMap } from '../../../src/map/controller';

describe('createMap', () => {
  it('rejects without constructing a map when WebGL is unavailable', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    await expect(
      createMap(document.createElement('div'), { theme: 'dark', lang: 'en', reducedMotion: false }),
    ).rejects.toThrow(/WebGL/);
    expect(MapCtor).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('temple pins in the controller', () => {
  const temple: any = {
    id: 'kedarnath',
    type: 'jyotirlinga',
    lists: [],
    name: { en: 'Kedarnath', hi: '', bn: '', mr: '', ta: '', te: '', gu: '' },
    location: { lat: 30.7352, lng: 79.0669 },
    alternateSites: [],
  };

  async function setup(reducedMotion = false) {
    vi.restoreAllMocks();
    MapCtor.mockReset();
    const handlers: Record<string, Array<(e?: any) => void>> = {};
    const fake: any = {
      on: vi.fn((ev: string, cb: any) => {
        (handlers[ev] ??= []).push(cb);
        if (ev === 'load') queueMicrotask(() => cb());
      }),
      off: vi.fn(),
      getStyle: () => ({ layers: [] }),
      getSource: vi.fn(() => ({ setData: vi.fn(), getClusterExpansionZoom: vi.fn(async () => 6) })),
      getLayer: vi.fn(() => ({})),
      hasImage: vi.fn(() => true),
      setFilter: vi.fn(),
      setStyle: vi.fn(),
      queryRenderedFeatures: vi.fn(() => []),
      getCanvas: () => ({ style: {} }),
      flyTo: vi.fn(),
      getBearing: () => 0,
      setLayoutProperty: vi.fn(),
      jumpTo: vi.fn(),
      easeTo: vi.fn(),
      isStyleLoaded: () => true,
      remove: vi.fn(),
    };
    MapCtor.mockImplementation(function () {
      return fake;
    });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({} as any);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ version: 8, sources: {}, layers: [] }) } as any);
    const el = document.createElement('div');
    const c = await createMap(el, { theme: 'dark', lang: 'en', reducedMotion });
    const click = () => handlers.click.forEach((h) => h({ point: { x: 1, y: 1 } }));
    return { c, fake, el, click };
  }
  const pinFeature = { properties: { id: 'kedarnath' }, geometry: { type: 'Point', coordinates: [79.06, 30.73] } };
  const riverFeature = { properties: { id: 'ganga' } };
  function queryBy(fake: any, byLayer: Record<string, any[]>) {
    fake.queryRenderedFeatures.mockImplementation((_p: any, o: any) => (byLayer[o.layers[0]] ?? byLayer[o.layers.join()] ?? []));
  }

  it('a tap on a pin selects the temple and does not open a river card', async () => {
    const { c, fake, click } = await setup();
    const onSelect = vi.fn();
    const onRiver = vi.fn();
    c.onSelect(onSelect);
    c.onRiver(onRiver);
    c.setTemples([temple]);
    fake.queryRenderedFeatures.mockImplementation((_p: any, o: any) =>
      o.layers.includes('pins') ? [pinFeature] : o.layers.includes('rivers-hit') ? [riverFeature] : [],
    );
    click();
    expect(onSelect).toHaveBeenCalledWith('kedarnath');
    expect(onRiver).not.toHaveBeenCalled();
  });

  it('a tap on a cluster zooms in and opens neither a card nor a river', async () => {
    const { c, fake, click } = await setup();
    const onSelect = vi.fn();
    const onRiver = vi.fn();
    c.onSelect(onSelect);
    c.onRiver(onRiver);
    fake.queryRenderedFeatures.mockImplementation((_p: any, o: any) =>
      o.layers.includes('pins')
        ? [{ properties: { cluster: true, cluster_id: 3 }, geometry: { type: 'Point', coordinates: [80, 20] } }]
        : [riverFeature],
    );
    click();
    await new Promise((r) => setTimeout(r, 0));
    expect(fake.easeTo).toHaveBeenCalledWith(expect.objectContaining({ center: [80, 20], zoom: 6 }));
    expect(onSelect).not.toHaveBeenCalled();
    expect(onRiver).not.toHaveBeenCalled();
  });

  it('still opens the river card when no pin is under the tap', async () => {
    const { c, fake, click } = await setup();
    const onRiver = vi.fn();
    c.onRiver(onRiver);
    fake.queryRenderedFeatures.mockImplementation((_p: any, o: any) => (o.layers.includes('rivers-hit') ? [riverFeature] : []));
    click();
    expect(onRiver).toHaveBeenCalledWith('ganga');
  });

  it('select flies to zoom 11 at pitch 60, and jumps when reduced motion is on', async () => {
    const a = await setup(false);
    a.c.setTemples([temple]);
    a.c.select('kedarnath');
    expect(a.fake.flyTo).toHaveBeenCalledWith({ center: [79.0669, 30.7352], zoom: 11, pitch: 60 });
    const b = await setup(true);
    b.c.setTemples([temple]);
    b.c.select('kedarnath');
    expect(b.fake.jumpTo).toHaveBeenCalledWith({ center: [79.0669, 30.7352], zoom: 11, pitch: 60 });
    expect(b.fake.flyTo).not.toHaveBeenCalled();
  });

  it('select falls back to the given coordinates when the pin is not in the filtered set', async () => {
    const { c, fake } = await setup();
    c.setTemples([]);
    c.select('kedarnath', { at: { lat: 30.7352, lng: 79.0669 } });
    expect(fake.flyTo).toHaveBeenCalledWith({ center: [79.0669, 30.7352], zoom: 11, pitch: 60 });
  });

  it('select uses pitch 0 once 3D is turned off, and 60 when back on', async () => {
    const { c, fake } = await setup();
    c.setTemples([temple]);
    c.set3D(false);
    c.select('kedarnath');
    expect(fake.flyTo).toHaveBeenLastCalledWith({ center: [79.0669, 30.7352], zoom: 11, pitch: 0 });
    c.set3D(true);
    c.select('kedarnath');
    expect(fake.flyTo).toHaveBeenLastCalledWith({ center: [79.0669, 30.7352], zoom: 11, pitch: 60 });
  });

  it('setTemples and setLang rebuild the marker list; a list button reaches onSelect', async () => {
    const { c, el } = await setup();
    const onSelect = vi.fn();
    c.onSelect(onSelect);
    expect(el.querySelectorAll('li button')).toHaveLength(0);
    const t2 = { ...temple, name: { ...temple.name, hi: 'केदारनाथ' } };
    c.setTemples([t2]);
    const btn = () => el.querySelector('li button') as HTMLButtonElement;
    expect(btn().getAttribute('aria-label')).toBe('Kedarnath, Jyotirlinga');
    c.setLang('hi');
    expect(btn().getAttribute('aria-label')).toContain('केदारनाथ');
    btn().click();
    expect(onSelect).toHaveBeenCalledWith('kedarnath');
  });

  it('select(id, {animate:false}) jumps, and select(null) does not move the camera', async () => {
    const { c, fake } = await setup();
    c.setTemples([temple]);
    c.select('kedarnath', { animate: false });
    expect(fake.jumpTo).toHaveBeenCalled();
    c.select(null);
    expect(fake.flyTo).not.toHaveBeenCalled();
  });

  it('keeps temples and selection across a theme switch (installer re-runs with them)', async () => {
    const { c, fake } = await setup();
    c.setTemples([temple]);
    c.select('kedarnath');
    c.setTheme('light');
    fake.getSource.mockReturnValue(undefined);
    fake.getLayer.mockReturnValue(undefined);
    fake.addSource = vi.fn();
    fake.addLayer = vi.fn();
    fake.addImage = vi.fn();
    fake.hasImage = vi.fn(() => false);
    fake.on.mock.calls.filter((c2: any[]) => c2[0] === 'style.load').forEach((c2: any[]) => c2[1]());
    const call = fake.addSource.mock.calls.find((a: any[]) => a[0] === 'temples');
    expect(call[1].data.features.map((f: any) => f.properties.id)).toEqual(['kedarnath']);
    const sel = fake.addLayer.mock.calls.find((a: any[]) => a[0].id === 'pins-selected');
    expect(sel[0].filter).toEqual(['==', ['get', 'id'], 'kedarnath']);
    expect(fake.addImage).toHaveBeenCalled();
  });
});
