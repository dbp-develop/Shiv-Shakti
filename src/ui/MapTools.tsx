import type { MapController } from '../map/controller';
import { t } from '../i18n';
import { is3D } from '../state';

/** 2D/3D, reset-view and locate buttons floating over the map. */
export function MapTools({
  ctl,
  geoBlocked,
  onLocate,
}: {
  ctl: MapController | null;
  geoBlocked: boolean;
  onLocate: () => void;
}) {
  return (
    <div id="map-tools" class="map-tools">
      <button
        type="button"
        aria-label={is3D.value ? t('map.to2D') : t('map.to3D')}
        onClick={() => {
          ctl?.set3D(!is3D.value);
          is3D.value = !is3D.value;
        }}
      >
        {is3D.value ? '2D' : '3D'}
      </button>
      <button type="button" aria-label={t('map.reset')} onClick={() => ctl?.resetView()}>
        ⟲
      </button>
      <button
        type="button"
        aria-label={t('map.locate')}
        aria-disabled={geoBlocked}
        title={geoBlocked ? t('notice.geoDenied') : undefined}
        onClick={onLocate}
      >
        ◎
      </button>
    </div>
  );
}
