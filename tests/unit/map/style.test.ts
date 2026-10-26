import { describe, expect, it } from 'vitest';
import type { StyleSpecification } from 'maplibre-gl';
import { transformBaseStyle } from '../../../src/map/style';

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

  it('adds no boundary-country layer and does not mutate its input', () => {
    const input = fixture();
    const out = transformBaseStyle(input, 'dark');
    expect(out.layers.some((l) => l.id.startsWith('boundary-country'))).toBe(false);
    expect(input.layers).toHaveLength(6);
    expect((input.layers[0] as unknown as { paint: Record<string, string> }).paint['background-color']).toBe('#fff');
  });
});
