import type { ExpressionSpecification, LayerSpecification, Map as MlMap, PointLike } from 'maplibre-gl';
import type { FeatureCollection } from 'geojson';
import type { L10n, Lang } from '../content/langs';
import type { Theme } from '../state';
import brahmaputra from '../../content/rivers/brahmaputra.geojson?raw';
import ganga from '../../content/rivers/ganga.geojson?raw';
import godavari from '../../content/rivers/godavari.geojson?raw';
import kaveri from '../../content/rivers/kaveri.geojson?raw';
import narmada from '../../content/rivers/narmada.geojson?raw';
import saraswati from '../../content/rivers/saraswati.geojson?raw';
import shipra from '../../content/rivers/shipra.geojson?raw';
import yamuna from '../../content/rivers/yamuna.geojson?raw';

export const RIVER_IDS = ['ganga', 'yamuna', 'narmada', 'godavari', 'kaveri', 'shipra', 'brahmaputra', 'saraswati'] as const;
export type RiverId = (typeof RIVER_IDS)[number];

/** Shipra comes from OpenStreetMap (ODbL); see content/rivers/SOURCE.md. */
export const RIVERS_ATTRIBUTION = '© OpenStreetMap contributors';

/** Where the Ganga, Yamuna and (traditionally) the Saraswati meet at Prayagraj. Not tappable. */
export const TRIVENI_SANGAM: { coordinates: [number, number]; name: L10n } = {
  coordinates: [81.885, 25.4246],
  name: {
    en: 'Triveni Sangam',
    hi: 'त्रिवेणी संगम',
    bn: 'ত্রিবেণী সঙ্গম',
    mr: 'त्रिवेणी संगम',
    ta: 'திரிவேணி சங்கமம்',
    te: 'త్రివేణి సంగమం',
    gu: 'ત્રિવેણી સંગમ',
  },
};

const RAW: Record<RiverId, string> = { ganga, yamuna, narmada, godavari, kaveri, shipra, brahmaputra, saraswati };

/** All river features in one collection (small: well under 100 KB in total). */
export function riversData(): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: RIVER_IDS.flatMap((id) => (JSON.parse(RAW[id]) as FeatureCollection).features),
  };
}

function trivenData(): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { name: TRIVENI_SANGAM.name }, geometry: { type: 'Point', coordinates: TRIVENI_SANGAM.coordinates } },
    ],
  };
}

interface Palette {
  glow: string;
  line: string;
  ancientGlow: string;
  ancient: string;
  text: string;
  halo: string;
  point: string;
}

const COLORS: Record<Theme, Palette> = {
  dark: { glow: '#2AA8C4', line: '#7FDDF0', ancientGlow: '#E8B44C', ancient: '#FFF1C9', text: '#BFEBF5', halo: '#12142B', point: '#FFF1C9' },
  light: { glow: '#3AA4C0', line: '#14677F', ancientGlow: '#D9A93A', ancient: '#8A5C00', text: '#0F5266', halo: '#FBF5E9', point: '#8A5C00' },
};

const DEFAULT_FONT = ['Noto Sans Regular'];

/** The river's name in `lang`, falling back to English when that translation is empty. */
function nameExpr(lang: Lang): ExpressionSpecification {
  const en: ExpressionSpecification = ['get', 'en', ['get', 'name']];
  if (lang === 'en') return en;
  const own: ExpressionSpecification = ['get', lang, ['get', 'name']];
  return ['case', ['all', ['has', lang, ['get', 'name']], ['!=', own, '']], own, en];
}

const LIVING: ExpressionSpecification = ['==', ['get', 'kind'], 'living'];
const ANCIENT: ExpressionSpecification = ['==', ['get', 'kind'], 'ancient'];
const WIDTH = (a: number, b: number): ExpressionSpecification => ['interpolate', ['linear'], ['zoom'], 3, a, 8, b];
const LINE_LAYOUT = { 'line-cap': 'round', 'line-join': 'round' } as const;

/** Bottom-to-top: glow, sharp line, Saraswati, tap target, Triveni point, then labels. */
export function riverLayers(theme: Theme, lang: Lang = 'en', font: string[] = DEFAULT_FONT): LayerSpecification[] {
  const c = COLORS[theme];
  const text = {
    layout: { 'text-field': nameExpr(lang), 'text-font': font, 'text-size': 12, 'text-letter-spacing': 0.05 },
    paint: { 'text-color': c.text, 'text-halo-color': c.halo, 'text-halo-width': 1.5 },
  };
  return [
    { id: 'rivers-glow', type: 'line', source: 'rivers', filter: LIVING, layout: LINE_LAYOUT, paint: { 'line-color': c.glow, 'line-width': WIDTH(5, 12), 'line-blur': 5, 'line-opacity': 0.55 } },
    { id: 'rivers-line', type: 'line', source: 'rivers', filter: LIVING, layout: LINE_LAYOUT, paint: { 'line-color': c.line, 'line-width': WIDTH(1.2, 2.6), 'line-opacity': 0.95 } },
    { id: 'saraswati-glow', type: 'line', source: 'rivers', filter: ANCIENT, layout: LINE_LAYOUT, paint: { 'line-color': c.ancientGlow, 'line-width': WIDTH(4, 9), 'line-blur': 4, 'line-opacity': 0.35 } },
    { id: 'saraswati-line', type: 'line', source: 'rivers', filter: ANCIENT, layout: { 'line-join': 'round' }, paint: { 'line-color': c.ancient, 'line-width': WIDTH(1.5, 3), 'line-dasharray': [2, 2], 'line-opacity': 0.95 } },
    { id: 'rivers-hit', type: 'line', source: 'rivers', layout: LINE_LAYOUT, paint: { 'line-color': '#000000', 'line-width': 18, 'line-opacity': 0.01 } },
    { id: 'triveni-circle', type: 'circle', source: 'triveni', paint: { 'circle-radius': 4.5, 'circle-color': c.point, 'circle-stroke-color': c.ancientGlow, 'circle-stroke-width': 2 } },
    { id: 'rivers-label', type: 'symbol', source: 'rivers', minzoom: 4.5, layout: { ...text.layout, 'symbol-placement': 'line', 'symbol-spacing': 350 }, paint: text.paint },
    {
      id: 'triveni-label',
      type: 'symbol',
      source: 'triveni',
      minzoom: 5.5,
      layout: { ...text.layout, 'text-anchor': 'left', 'text-offset': [0.8, 0], 'text-optional': true },
      paint: text.paint,
    },
  ];
}

const LABEL_LAYERS = ['rivers-label', 'triveni-label'];

/** Adds the river and Triveni sources and layers. Safe to call on every style load. */
export function installRivers(map: MlMap, theme: Theme, lang: Lang): void {
  const symbol = map.getStyle().layers.find((l) => l.type === 'symbol');
  const font = (symbol?.layout as { 'text-font'?: string[] } | undefined)?.['text-font'];
  if (!map.getSource('rivers')) map.addSource('rivers', { type: 'geojson', data: riversData(), attribution: RIVERS_ATTRIBUTION });
  if (!map.getSource('triveni')) map.addSource('triveni', { type: 'geojson', data: trivenData() });
  for (const spec of riverLayers(theme, lang, font)) {
    if (map.getLayer(spec.id)) continue;
    map.addLayer(spec, spec.type === 'line' ? symbol?.id : undefined);
  }
}

/** Points the river and Triveni labels at `lang` (English when that name is empty). */
export function setRiversLang(map: MlMap, lang: Lang): void {
  for (const id of LABEL_LAYERS) if (map.getLayer(id)) map.setLayoutProperty(id, 'text-field', nameExpr(lang));
}

/** The id of the river line under a tap, or null. The Triveni point is deliberately not tappable. */
export function riverIdAt(map: MlMap, point: PointLike): string | null {
  if (!map.getLayer('rivers-hit')) return null;
  const hit = map.queryRenderedFeatures(point, { layers: ['rivers-hit'] })[0];
  const id = hit?.properties?.id;
  return typeof id === 'string' ? id : null;
}
