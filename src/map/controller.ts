import maplibregl from 'maplibre-gl';
import type { Map as MlMap, StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Lang } from '../content/langs';
import type { Temple } from '../content/schema';
import type { GeoJSONSource } from 'maplibre-gl';
import type { Theme } from '../state';
import { installBoundary } from './boundary';
import { SELECT_PITCH_3D, SELECT_ZOOM, buildMarkerList, installPins, pinHitAt, setPinsData, setPinsSelected, templeIdOf } from './pins';
import { installRivers, riverIdAt, setRiversLang } from './rivers';
import { OPENFREEMAP_STYLE_URL, transformBaseStyle } from './style';
import { DEFAULT_PITCH, installTerrain, setTerrainEnabled } from './terrain';

export interface MapController {
  setTheme(t: Theme): void;
  setLang(l: Lang): void;
  set3D(on: boolean): void;
  resetView(): void;
  setTemples(ts: Temple[]): void;
  select(id: string | null, opts?: { animate: boolean }): void;
  onSelect(cb: (id: string) => void): void;
  onRiver(cb: (riverId: string) => void): void;
  /** Runs after every (re)load of the style; later tasks add their sources and layers here. */
  onStyleReady(cb: (map: MlMap, theme: Theme) => void): void;
  /** Called once if the terrain tiles fail, after the map has fallen back to flat. */
  onTerrainFail(cb: () => void): void;
  readonly map: MlMap;
  destroy(): void;
}

export interface MapInit {
  theme: Theme;
  lang: Lang;
  reducedMotion: boolean;
  /** Where "Skip temple list" sends focus; default is the map canvas. */
  onSkip?: () => void;
}

const HOME = { center: [80, 23] as [number, number], zoom: 4, pitch: DEFAULT_PITCH, bearing: 0 };
const MAX_BOUNDS: [[number, number], [number, number]] = [[55, 0], [105, 40]];

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

export async function createMap(el: HTMLElement, init: MapInit): Promise<MapController> {
  if (!hasWebGL()) throw new Error('WebGL is unavailable');
  const res = await fetch(OPENFREEMAP_STYLE_URL);
  if (!res.ok) throw new Error(`Basemap style failed to load (${res.status})`);
  const base = (await res.json()) as StyleSpecification;

  let theme = init.theme;
  let lang = init.lang;
  let is3D = true;
  let reduced = init.reducedMotion;
  let terrainFailed = false;
  const styleHooks: Array<(map: MlMap, t: Theme) => void> = [];
  const terrainFailHooks: Array<() => void> = [];
  const riverHooks: Array<(id: string) => void> = [];
  const selectHooks: Array<(id: string) => void> = [];
  let temples: Temple[] = [];
  let selectedId: string | null = null;

  const dur = (ms: number) => (reduced ? 0 : ms);

  const map = new maplibregl.Map({
    container: el,
    style: transformBaseStyle(base, theme),
    ...HOME,
    maxBounds: MAX_BOUNDS,
    maxPitch: 75,
    attributionControl: { compact: true },
  });

  function applyLang(): void {
    for (const layer of map.getStyle().layers) {
      if (layer.type === 'symbol' && layer['source-layer'] === 'place') {
        map.setLayoutProperty(layer.id, 'text-field', [
          'coalesce',
          ['get', `name:${lang}`],
          ['get', 'name_en'],
          ['get', 'name'],
        ]);
      }
    }
  }

  function onStyleLoad(): void {
    installTerrain(map, theme, is3D && !terrainFailed);
    installBoundary(map, theme);
    installRivers(map, theme, lang);
    installPins(map, theme, temples, lang, selectedId);
    applyLang();
    for (const cb of styleHooks) cb(map, theme);
  }
  map.on('style.load', onStyleLoad);

  const markerHost = document.createElement('div');
  markerHost.className = 'sr-only';
  el.append(markerHost);
  const rebuildMarkers = () => buildMarkerList(markerHost, temples, lang, (id) => pick(id), () => (init.onSkip ? init.onSkip() : map.getCanvas().focus()));

  // Pins and clusters take precedence over rivers: a tap on one never also opens a river card.
  map.on('click', (e) => {
    const hit = pinHitAt(map, e.point);
    if (hit?.kind === 'cluster') {
      const src = map.getSource('temples') as GeoJSONSource | undefined;
      void src?.getClusterExpansionZoom(hit.clusterId).then((zoom) => map.easeTo({ center: hit.center, zoom, duration: dur(500) }));
      return;
    }
    if (hit) {
      pick(hit.templeId);
      return;
    }
    const id = riverIdAt(map, e.point);
    if (id) for (const cb of riverHooks) cb(id);
  });
  map.on('mousemove', (e) => {
    map.getCanvas().style.cursor = pinHitAt(map, e.point) || riverIdAt(map, e.point) ? 'pointer' : '';
  });

  map.on('error', (e) => {
    const src = (e as { sourceId?: string }).sourceId;
    if (src === 'dem' && !terrainFailed) {
      terrainFailed = true;
      setTerrainEnabled(map, false);
      for (const cb of terrainFailHooks) cb();
    }
  });

  await new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      map.off('load', onLoad);
      map.off('error', onError);
    };
    const onLoad = () => {
      cleanup();
      resolve();
    };
    // Only style-level failures (no sourceId) abort; tile/source errors (e.g. the DEM) are
    // absorbed by the terrain fallback above.
    const onError = (e: { sourceId?: string; error: Error }) => {
      if (e.sourceId) return;
      cleanup();
      map.remove();
      reject(e.error);
    };
    map.on('load', onLoad);
    map.on('error', onError);
  });

  function select(id: string | null, opts?: { animate: boolean }): void {
    selectedId = id;
    setPinsSelected(map, id);
    const tp = id ? temples.find((x) => x.id === id) : undefined;
    if (!tp) return;
    const cam = { center: [tp.location.lng, tp.location.lat] as [number, number], zoom: SELECT_ZOOM, pitch: is3D ? SELECT_PITCH_3D : 0 };
    if (reduced || opts?.animate === false) map.jumpTo(cam);
    else map.flyTo(cam);
  }
  /** A pin, cluster-free tap or marker-list activation: fly there and tell the listeners. */
  function pick(id: string): void {
    select(templeIdOf(id));
    for (const cb of selectHooks) cb(templeIdOf(id));
  }

  return {
    map,
    setTheme(t) {
      if (t === theme) return;
      theme = t;
      map.setStyle(transformBaseStyle(base, theme), { diff: false });
    },
    setLang(l) {
      lang = l;
      applyLang();
      setRiversLang(map, lang);
      setPinsData(map, temples, lang);
      rebuildMarkers();
    },
    set3D(on) {
      is3D = on;
      setTerrainEnabled(map, on && !terrainFailed);
      map.easeTo({ pitch: on ? DEFAULT_PITCH : 0, bearing: on ? map.getBearing() : 0, duration: dur(600) });
    },
    resetView() {
      map.easeTo({ ...HOME, pitch: is3D ? DEFAULT_PITCH : 0, duration: dur(800) });
    },
    setTemples(ts) {
      temples = ts;
      setPinsData(map, temples, lang);
      rebuildMarkers();
    },
    select,
    onSelect(cb) {
      selectHooks.push(cb);
    },
    onRiver(cb) {
      riverHooks.push(cb);
    },
    onStyleReady(cb) {
      styleHooks.push(cb);
      if (map.isStyleLoaded()) cb(map, theme);
    },
    onTerrainFail(cb) {
      terrainFailHooks.push(cb);
    },
    destroy() {
      markerHost.remove();
      map.remove();
    },
  };
}
