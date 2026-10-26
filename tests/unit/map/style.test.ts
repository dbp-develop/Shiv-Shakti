import { describe, expect, it } from 'vitest';
import type { StyleSpecification } from 'maplibre-gl';
import { PALETTES, transformBaseStyle } from '../../../src/map/style';

const fixture = (): StyleSpecification => ({
  version: 8,
  sources: { openmaptiles: { type: 'vector', url: 'https://example.invalid/tiles' } },
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': '#fff' } },
    { id: 'water', type: 'fill', source: 'openmaptiles', 'source-layer': 'water', paint: { 'fill-color': '#aaf' } },
    {
      id: 'boundary_country',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'boundary',
      filter: ['==', 'admin_level', 2],
      paint: { 'line-color': '#999' },
    },
    {
      id: 'boundary_country_z0',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'boundary',
      filter: ['all', ['<=', 'admin_level', 2], ['!=', 'maritime', 1]],
      paint: { 'line-color': '#999' },
    },
    {
      id: 'boundary_state',
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'boundary',
      filter: ['==', 'admin_level', 4],
      paint: { 'line-color': '#bbb' },
    },
    { id: 'label', type: 'symbol', source: 'openmaptiles', 'source-layer': 'place', paint: { 'text-color': '#000' } },
  ],
});

describe('transformBaseStyle', () => {
  it('removes country-level boundary layers and keeps state-level ones', () => {
    const ids = transformBaseStyle(fixture(), 'dark').layers.map((l) => l.id);
    expect(ids).not.toContain('boundary_country');
    expect(ids).not.toContain('boundary_country_z0');
    expect(ids).toContain('boundary_state');
  });

  it('recolours the background to the dark token', () => {
    const bg = transformBaseStyle(fixture(), 'dark').layers.find((l) => l.type === 'background');
    expect(bg && bg.type === 'background' && bg.paint?.['background-color']).toBe('#12142B');
  });

  it('uses the light token for the light theme', () => {
    const bg = transformBaseStyle(fixture(), 'light').layers.find((l) => l.type === 'background');
    expect(bg && bg.type === 'background' && bg.paint?.['background-color']).toBe('#FBF5E9');
  });

  it('does not mutate its input', () => {
    const input = fixture();
    transformBaseStyle(input, 'dark');
    expect(input.layers).toHaveLength(6);
    expect((input.layers[0] as unknown as { paint: Record<string, string> }).paint['background-color']).toBe('#fff');
  });

  const boundary = (id: string, filter?: unknown): StyleSpecification['layers'][number] =>
    ({
      id,
      type: 'line',
      source: 'openmaptiles',
      'source-layer': 'boundary',
      ...(filter === undefined ? {} : { filter }),
      paint: { 'line-color': '#999' },
    }) as StyleSpecification['layers'][number];

  const idsFor = (layers: StyleSpecification['layers']) =>
    transformBaseStyle({ ...fixture(), layers }, 'dark').layers.map((l) => l.id);

  it('hides disputed, unfiltered and unprovable boundary layers', () => {
    const ids = idsFor([
      boundary('disputed', ['all', ['==', ['get', 'disputed'], 1]]),
      boundary('nofilter'),
      boundary('maritime_only', ['==', ['get', 'maritime'], 1]),
      boundary('string_level', ['==', 'admin_level', '2']),
      boundary('opaque', ['in', 'class', 'x']),
    ]);
    expect(ids).toEqual([]);
  });

  it('hides a disputed layer even when its admin_level looks sub-national', () => {
    expect(
      idsFor([boundary('disputed_state', ['all', ['==', ['get', 'admin_level'], 4], ['==', ['get', 'disputed'], 1]])]),
    ).toEqual([]);
  });

  it('hides expression-style country filters and keeps expression-style state filters', () => {
    const ids = idsFor([
      boundary('country_expr', ['all', ['==', ['get', 'admin_level'], 2], ['!=', ['get', 'maritime'], 1]]),
      boundary('lt3', ['<', 'admin_level', 3]),
      boundary('state_expr', ['all', ['>=', ['get', 'admin_level'], 3], ['<=', ['get', 'admin_level'], 4]]),
      boundary('state4', ['==', 'admin_level', 4]),
    ]);
    expect(ids).toEqual(['state_expr', 'state4']);
  });

  it('recolours water, lines and labels with the dark palette', () => {
    const out = transformBaseStyle(
      {
        ...fixture(),
        layers: [
          ...fixture().layers.filter((l) => l.id === 'water' || l.id === 'label'),
          { id: 'road', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation', paint: { 'line-color': '#fff' } },
        ],
      },
      'dark',
    );
    const paint = (id: string) => (out.layers.find((l) => l.id === id) as unknown as { paint: Record<string, string> }).paint;
    expect(paint('water')['fill-color']).toBe(PALETTES.dark.water);
    expect(paint('road')['line-color']).toBe(PALETTES.dark.road);
    expect(paint('label')['text-color']).toBe(PALETTES.dark.text);
    expect(paint('label')['text-halo-color']).toBe(PALETTES.dark.halo);
  });
});
