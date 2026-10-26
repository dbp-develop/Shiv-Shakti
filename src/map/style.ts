import type { LayerSpecification, StyleSpecification } from 'maplibre-gl';
import type { Theme } from '../state';

export const OPENFREEMAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';

interface Palette {
  background: string;
  water: string;
  land: string; // parks, woods, residential tint
  building: string;
  road: string;
  roadCasing: string;
  text: string;
  halo: string;
  stateLine: string;
}

export const PALETTES: Record<Theme, Palette> = {
  dark: {
    background: '#12142B',
    water: '#0B1030',
    land: '#1A1D3A',
    building: '#1F2347',
    road: '#3A3E66',
    roadCasing: '#12142B',
    text: '#C9BFAE',
    halo: '#12142B',
    stateLine: '#4A4E7A',
  },
  light: {
    background: '#FBF5E9',
    water: '#CFE2E6',
    land: '#EFE8D4',
    building: '#E6DCC4',
    road: '#FFFFFF',
    roadCasing: '#D9CDB3',
    text: '#6E4A3C',
    halo: '#FBF5E9',
    stateLine: '#B9A98A',
  },
};

type Expr = unknown;

const CMP = new Set(['==', '<=', '<', '>=', '>', '!=']);

function isAdminLevelRef(e: Expr): boolean {
  return (
    e === 'admin_level' ||
    (Array.isArray(e) && (e[0] === 'get' || e[0] === 'to-number') && (e[1] === 'admin_level' || isAdminLevelRef(e[1])))
  );
}

/** Collects (operator, number) comparisons on admin_level from a legacy or expression filter. */
function adminComparisons(f: Expr, out: Array<[string, number]> = []): Array<[string, number]> {
  if (!Array.isArray(f)) return out;
  const op = f[0];
  if (typeof op === 'string' && CMP.has(op) && f.length === 3) {
    const [, a, b] = f;
    if (isAdminLevelRef(a) && typeof b === 'number') out.push([op, b]);
    else if (isAdminLevelRef(b) && typeof a === 'number') out.push([op, a]);
  }
  for (const child of f) adminComparisons(child, out);
  return out;
}

function mentions(f: Expr, word: string): boolean {
  return JSON.stringify(f ?? null).includes(`"${word}"`);
}

/** True for boundary layers that draw country-level, disputed or unfiltered borders. */
function isInternationalBoundary(layer: LayerSpecification): boolean {
  if (!('source-layer' in layer) || layer['source-layer'] !== 'boundary') return false;
  const filter = (layer as { filter?: Expr }).filter;
  if (filter === undefined || mentions(filter, 'disputed')) return true;
  const cmps = adminComparisons(filter);
  if (cmps.length === 0) return true; // cannot prove it is sub-national: hide it
  return cmps.some(
    ([op, n]) => ((op === '==' || op === '<=') && n <= 2) || (op === '<' && n <= 3),
  );
}

function recolour(layer: LayerSpecification, p: Palette): LayerSpecification {
  const next = structuredClone(layer) as LayerSpecification & { paint?: Record<string, unknown> };
  const paint: Record<string, unknown> = next.paint ?? {};
  const id = layer.id;
  switch (layer.type) {
    case 'background':
      paint['background-color'] = p.background;
      break;
    case 'fill':
      if (id.startsWith('water')) paint['fill-color'] = p.water;
      else if (id.startsWith('building')) {
        paint['fill-color'] = p.building;
        paint['fill-outline-color'] = p.building;
      } else paint['fill-color'] = p.land;
      break;
    case 'line':
      if (id.startsWith('waterway')) paint['line-color'] = p.water;
      else if (id.startsWith('boundary')) paint['line-color'] = p.stateLine;
      else if (id.includes('casing')) paint['line-color'] = p.roadCasing;
      else paint['line-color'] = p.road;
      break;
    case 'symbol':
      paint['text-color'] = p.text;
      paint['text-halo-color'] = p.halo;
      break;
    default:
      return next;
  }
  next.paint = paint;
  return next;
}

/** Pure: returns a recoloured copy of the base style with international boundary layers removed. */
export function transformBaseStyle(base: StyleSpecification, theme: Theme): StyleSpecification {
  const p = PALETTES[theme];
  return {
    ...structuredClone(base),
    layers: base.layers.filter((l) => !isInternationalBoundary(l)).map((l) => recolour(l, p)),
  };
}
