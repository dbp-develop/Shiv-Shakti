import type { Temple } from '../content/schema';
import { loc, t } from '../i18n';

export type Nearby = Array<{ temple: Temple; km: number }>;

/** Result list of "nearest temples" after a geolocation request. */
export function NearestPanel({
  nearby,
  onPick,
  onClose,
}: {
  nearby: Nearby;
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <section class="nearby">
      <ul aria-label={t('nearest.title')}>
        {nearby.map(({ temple, km }) => (
          <li key={temple.id}>
            <button type="button" onClick={() => onPick(temple.id)}>
              {loc(temple.name).text} · {t('nearest.km', { km: Math.round(km) })}
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={onClose}>
        {t('nearest.close')}
      </button>
    </section>
  );
}
