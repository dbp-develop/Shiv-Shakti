import type { Map as MlMap } from 'maplibre-gl';
import type { Theme } from '../state';
import indiaUrl from '../../content/boundary/india.geojson?url';
import neighboursUrl from '../../content/boundary/neighbours.geojson?url';

/** Must match content/boundary/SOURCE.md: Natural Earth, India point of view (not Survey of India data). */
export const BOUNDARY_ATTRIBUTION = 'Boundary: Natural Earth (India point of view)';

const COLORS: Record<Theme, { gold: string; neighbourFill: string; neighbourLine: string }> = {
  dark: { gold: '#E8B44C', neighbourFill: '#12142B', neighbourLine: '#6E7299' },
  light: { gold: '#9A6A00', neighbourFill: '#FBF5E9', neighbourLine: '#8A7650' },
};

/** Adds India + neighbour fill/line layers below the first symbol layer. Call on every style load. */
export function installBoundary(map: MlMap, theme: Theme): void {
  const c = COLORS[theme];
  const before = map.getStyle().layers.find((l) => l.type === 'symbol')?.id;
  if (!map.getSource('boundary-neighbours')) {
    map.addSource('boundary-neighbours', { type: 'geojson', data: neighboursUrl, attribution: BOUNDARY_ATTRIBUTION });
  }
  if (!map.getSource('boundary-india')) map.addSource('boundary-india', { type: 'geojson', data: indiaUrl });
  const add = (spec: Parameters<MlMap['addLayer']>[0]) => {
    if (!map.getLayer(spec.id)) map.addLayer(spec, before);
  };
  add({ id: 'neighbours-fill', type: 'fill', source: 'boundary-neighbours', paint: { 'fill-color': c.neighbourFill, 'fill-opacity': 0.25 } });
  add({ id: 'neighbours-line', type: 'line', source: 'boundary-neighbours', paint: { 'line-color': c.neighbourLine, 'line-width': 1, 'line-opacity': 0.8 } });
  add({ id: 'india-line', type: 'line', source: 'boundary-india', layout: { 'line-join': 'round' }, paint: { 'line-color': c.gold, 'line-width': 1.5 } });
}
