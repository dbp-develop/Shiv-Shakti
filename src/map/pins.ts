import type { ExpressionSpecification, LayerSpecification, Map as MlMap, PointLike } from 'maplibre-gl';
import type { Feature, FeatureCollection, Point } from 'geojson';
import type { Lang } from '../content/langs';
import { pinCategory, type PinCategory, type Temple } from '../content/schema';
import { t } from '../i18n';
import type { Theme } from '../state';
import { ICON_IDS, ICON_PIXEL_RATIO, renderIcon } from './icons';
import { PIN_COLORS } from './pinColors';

export type PinKind = PinCategory | 'alternate';
export interface PinProps {
  id: string;
  name: string;
  category: PinKind;
}

export const CLUSTER_OPTIONS = { cluster: true, clusterMaxZoom: 7, clusterRadius: 40 } as const;
/** Zoom on selecting a temple (above clusterMaxZoom, so its pin is single) and the pitch in 3D (2D uses 0). */
export const SELECT_ZOOM = 11;
export const SELECT_PITCH_3D = 60;
/** Minimum tap target: pins are hit-tested in a box this many px square around the tap. */
const HIT_SIZE = 44;

const SOURCE = 'temples';

/** `kedarnath~1` (an alternate site) -> `kedarnath`; real temple ids pass through. */
export function templeIdOf(pinId: string): string {
  const i = pinId.indexOf('~');
  return i < 0 ? pinId : pinId.slice(0, i);
}

const name = (v: Temple['name'], lang: Lang): string => (v[lang] && v[lang].trim() !== '' ? v[lang] : v.en);

/** One point per temple, plus one `<templeId>~<n>` point per alternate site (category 'alternate'). */
export function templesToGeoJSON(ts: Temple[], lang: Lang): FeatureCollection<Point, PinProps> {
  const features: Array<Feature<Point, PinProps>> = [];
  for (const tp of ts) {
    features.push({
      type: 'Feature',
      properties: { id: tp.id, name: name(tp.name, lang), category: pinCategory(tp) },
      geometry: { type: 'Point', coordinates: [tp.location.lng, tp.location.lat] },
    });
    tp.alternateSites.forEach((a, n) =>
      features.push({
        type: 'Feature',
        properties: { id: `${tp.id}~${n}`, name: name(a.name, lang), category: 'alternate' },
        geometry: { type: 'Point', coordinates: [a.lng, a.lat] },
      }),
    );
  }
  return { type: 'FeatureCollection', features };
}

function colors(theme: Theme) {
  const p = PIN_COLORS[theme];
  return { cluster: p.accent, clusterText: p.bg, ring: p.text, text: p.text, halo: p.bg };
}
const DEFAULT_FONT = ['Noto Sans Regular'];
const UNCLUSTERED: ExpressionSpecification = ['!', ['has', 'point_count']];

/** Bottom-to-top: clusters, cluster counts, selection ring, pins, then pin names at close zoom. */
export function pinLayers(theme: Theme, font: string[] = DEFAULT_FONT, selectedId: string | null = null): LayerSpecification[] {
  const c = colors(theme);
  return [
    {
      id: 'pins-cluster',
      type: 'circle',
      source: SOURCE,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': c.cluster,
        'circle-radius': ['step', ['get', 'point_count'], 20, 10, 24, 30, 28],
        'circle-stroke-color': c.ring,
        'circle-stroke-width': 2,
        'circle-opacity': 0.92,
      },
    },
    {
      id: 'pins-cluster-count',
      type: 'symbol',
      source: SOURCE,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': ['get', 'point_count_abbreviated'],
        'text-font': font,
        'text-size': 13,
        'text-allow-overlap': true,
        'text-ignore-placement': true,
      },
      paint: { 'text-color': c.clusterText },
    },
    {
      id: 'pins-selected',
      type: 'circle',
      source: SOURCE,
      filter: ['==', ['get', 'id'], selectedId ?? ''],
      paint: { 'circle-radius': 26, 'circle-color': 'rgba(0,0,0,0)', 'circle-stroke-color': c.ring, 'circle-stroke-width': 3, 'circle-translate': [0, -16] },
    },
    {
      // Pins must never be culled or hidden by the terrain draping or by neighbouring labels:
      // overlap and placement-ignore are on, and the icon stays upright (viewport-aligned) when pitched.
      id: 'pins',
      type: 'symbol',
      source: SOURCE,
      filter: UNCLUSTERED,
      layout: {
        'icon-image': ['concat', 'pin-', ['get', 'category']],
        'icon-size': ['match', ['get', 'category'], 'maha-peetha', 1.4, 1],
        'icon-anchor': 'bottom',
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
        'icon-pitch-alignment': 'viewport',
        'icon-rotation-alignment': 'viewport',
        'symbol-sort-key': ['match', ['get', 'category'], 'alternate', 0, 'peetha', 1, 'maha-peetha', 2, 3],
      },
    },
    {
      id: 'pins-label',
      type: 'symbol',
      source: SOURCE,
      minzoom: 8,
      filter: UNCLUSTERED,
      layout: {
        'text-field': ['get', 'name'],
        'text-font': font,
        'text-size': 12,
        'text-anchor': 'top',
        'text-offset': [0, 0.3],
        'text-optional': true,
      },
      paint: { 'text-color': c.text, 'text-halo-color': c.halo, 'text-halo-width': 1.5 },
    },
  ];
}

function addImages(map: MlMap, theme: Theme): void {
  for (const id of ICON_IDS) if (!map.hasImage(id)) map.addImage(id, renderIcon(id, theme), { pixelRatio: ICON_PIXEL_RATIO });
}

/**
 * Adds the pin images, the clustered source and the layers. Safe to call on every style load:
 * `setStyle` wipes images, sources and layers, so each is re-added behind its own guard.
 */
export function installPins(map: MlMap, theme: Theme, temples: Temple[], lang: Lang, selectedId: string | null): void {
  addImages(map, theme);
  if (!map.getSource(SOURCE)) map.addSource(SOURCE, { type: 'geojson', data: templesToGeoJSON(temples, lang), ...CLUSTER_OPTIONS });
  const symbol = map.getStyle().layers.find((l) => l.type === 'symbol');
  const font = (symbol?.layout as { 'text-font'?: string[] } | undefined)?.['text-font'];
  for (const spec of pinLayers(theme, font, selectedId)) {
    if (!map.getLayer(spec.id)) map.addLayer(spec);
  }
}

export function setPinsData(map: MlMap, temples: Temple[], lang: Lang): void {
  const src = map.getSource(SOURCE) as { setData?: (d: FeatureCollection) => void } | undefined;
  src?.setData?.(templesToGeoJSON(temples, lang));
}

export function setPinsSelected(map: MlMap, id: string | null): void {
  if (map.getLayer('pins-selected')) map.setFilter('pins-selected', ['==', ['get', 'id'], id ?? '']);
}

export type PinHit =
  | { kind: 'cluster'; clusterId: number; center: [number, number] }
  | { kind: 'pin'; id: string; templeId: string };

/** The pin or cluster under a screen point, or null. Clusters and single pins are mutually exclusive in the source. */
export function pinHitAt(map: MlMap, point: PointLike): PinHit | null {
  if (!map.getLayer('pins')) return null;
  const [x, y] = Array.isArray(point) ? point : [point.x, point.y];
  const r = HIT_SIZE / 2;
  const box: [PointLike, PointLike] = [[x - r, y - r], [x + r, y + r]];
  const hit = map.queryRenderedFeatures(box, { layers: ['pins-cluster', 'pins'] })[0];
  if (!hit) return null;
  const p = hit.properties ?? {};
  if (p.cluster) return { kind: 'cluster', clusterId: Number(p.cluster_id), center: (hit.geometry as Point).coordinates as [number, number] };
  if (typeof p.id !== 'string') return null;
  return { kind: 'pin', id: p.id, templeId: templeIdOf(p.id) };
}

const CATEGORY_KEY: Record<PinKind, string> = {
  jyotirlinga: 'pins.jyotirlinga',
  'maha-peetha': 'pins.mahaPeetha',
  peetha: 'pins.peetha',
  alternate: 'pins.alternate',
};

/**
 * Fills `host` with a visually hidden (class `sr-only`), keyboard-focusable list that mirrors the pins.
 * Each button's ARIA label is "<name>, <category>" and selects the (parent) temple on Enter or click.
 */
export function buildMarkerList(
  host: HTMLElement,
  temples: Temple[],
  lang: Lang,
  onPick: (templeId: string) => void,
  onSkip?: () => void,
): void {
  host.replaceChildren();
  const skip = document.createElement('button');
  skip.type = 'button';
  skip.textContent = t('pins.skip');
  skip.addEventListener('click', () => onSkip?.());
  host.append(skip);
  const ul = document.createElement('ul');
  ul.setAttribute('aria-label', t('pins.listLabel'));
  for (const f of templesToGeoJSON(temples, lang).features) {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = f.properties.name;
    b.setAttribute('aria-label', `${f.properties.name}, ${t(CATEGORY_KEY[f.properties.category])}`);
    b.addEventListener('click', () => onPick(templeIdOf(f.properties.id)));
    li.append(b);
    ul.append(li);
  }
  host.append(ul);
}
