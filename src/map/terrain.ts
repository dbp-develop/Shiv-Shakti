import type { Map as MlMap, RasterDEMSourceSpecification } from 'maplibre-gl';
import type { Theme } from '../state';

export const DEM_URL = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';
export const EXAGGERATION = 1.5;
export const DEFAULT_PITCH = 45;
const DEM_ATTRIBUTION = 'Terrain: Mapzen / AWS Terrain Tiles';

const SKY: Record<Theme, { sky: string; horizon: string; fog: string }> = {
  dark: { sky: '#0B1030', horizon: '#2A2F5E', fog: '#12142B' },
  light: { sky: '#BFD9E6', horizon: '#F4E7C8', fog: '#FBF5E9' },
};

function firstLayerOfType(map: MlMap, types: string[]): string | undefined {
  return map.getStyle().layers.find((l) => types.includes(l.type))?.id;
}

/** Adds the DEM sources, hillshade layer and sky. Call on every style load. */
export function installTerrain(map: MlMap, theme: Theme, on: boolean): void {
  const dem: RasterDEMSourceSpecification = { type: 'raster-dem', tiles: [DEM_URL], encoding: 'terrarium', tileSize: 256, maxzoom: 15, attribution: DEM_ATTRIBUTION };
  if (!map.getSource('dem')) map.addSource('dem', dem);
  if (!map.getSource('dem-hillshade')) map.addSource('dem-hillshade', dem);
  if (!map.getLayer('hillshade')) {
    map.addLayer(
      {
        id: 'hillshade',
        type: 'hillshade',
        source: 'dem-hillshade',
        paint: {
          'hillshade-exaggeration': theme === 'dark' ? 0.95 : 0.7,
          'hillshade-shadow-color': theme === 'dark' ? '#000000' : '#5A4A32',
          'hillshade-highlight-color': theme === 'dark' ? '#B4B9F0' : '#FFFFFF',
          'hillshade-accent-color': theme === 'dark' ? '#3A4080' : '#8A7650',
        },
      },
      firstLayerOfType(map, ['line', 'symbol']),
    );
  }
  const c = SKY[theme];
  map.setSky({
    'sky-color': c.sky,
    'horizon-color': c.horizon,
    'fog-color': c.fog,
    'sky-horizon-blend': 0.5,
    'horizon-fog-blend': 0.6,
    'fog-ground-blend': 0.3,
  });
  setTerrainEnabled(map, on);
}

export function setTerrainEnabled(map: MlMap, on: boolean): void {
  if (on && map.getSource('dem')) map.setTerrain({ source: 'dem', exaggeration: EXAGGERATION });
  else map.setTerrain(null);
}
