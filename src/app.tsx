import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { loadFestivals } from './content/festivals';
import { applyFilters } from './content/filters';
import { nearestTemples } from './content/geo';
import { loadTemples } from './content/load';
import { loadSaraswati } from './content/saraswati';
import type { Temple } from './content/schema';
import { loc, t } from './i18n';
import type { MapController } from './map/controller';
import { navigate, route } from './router';
import { filters, is3D, lang, notice, reducedMotion, setLang, setTheme, theme } from './state';
import { FilterBar } from './ui/FilterBar';
import { Header } from './ui/Header';
import { ListView } from './ui/ListView';
import { Notice } from './ui/Notice';
import { RiverCard } from './ui/RiverCard';

type Nearby = Array<{ temple: Temple; km: number }>;

const GEO_TIMEOUT_MS = 10_000;

/** Only on a click. `onDenied` fires for PERMISSION_DENIED (code 1); other failures just show a retry-able notice. */
function getPosition(onOk: (p: { lat: number; lng: number }) => void, onDenied: () => void): void {
  const geo = typeof navigator === 'undefined' ? undefined : navigator.geolocation;
  const denied = () => {
    notice.value = t('notice.geoDenied');
    onDenied();
  };
  if (!geo) return void denied();
  geo.getCurrentPosition(
    (p) => onOk({ lat: p.coords.latitude, lng: p.coords.longitude }),
    (e: { code?: number }) => (e?.code === 2 || e?.code === 3 ? (notice.value = t('notice.geoUnavailable')) : denied()),
    { timeout: GEO_TIMEOUT_MS },
  );
}

function safely<T>(load: () => T, fallback: T): T {
  try {
    return load();
  } catch (e) {
    console.error('Content failed to load', e);
    return fallback;
  }
}

export function App() {
  const mapEl = useRef<HTMLDivElement>(null);
  const [ctl, setCtl] = useState<MapController | null>(null);
  const [failed, setFailed] = useState(false);
  const [river, setRiver] = useState<string | null>(null);
  const [nearby, setNearby] = useState<Nearby | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [geoBlocked, setGeoBlocked] = useState(false);
  const returnFocus = useRef<Element | null>(null);

  // A bad content file degrades only its feature (R15): log it and carry on with what loaded.
  const temples = useMemo(() => safely(loadTemples, [] as Temple[]), []);
  const festivals = useMemo(() => safely(loadFestivals, []), []);
  const shown = useMemo(() => applyFilters(temples, filters.value, festivals), [temples, festivals, filters.value]);

  // Load the map module lazily so the header paints before maplibre downloads.
  useEffect(() => {
    let dead = false;
    let made: MapController | undefined;
    import('./map/controller')
      .then((m) =>
        m.createMap(mapEl.current!, {
          theme: theme.value,
          lang: lang.value,
          reducedMotion: reducedMotion.value,
          // Skip must land after the (visually hidden) marker list, not on the canvas that precedes it.
          onSkip: () => document.querySelector<HTMLElement>('#map-tools button')?.focus(),
        }),
      )
      .then((c) => {
        if (dead) return c.destroy();
        made = c;
        c.onSelect((id) => navigate({ kind: 'temple', id }));
        c.onRiver((id) => {
          if (id !== 'saraswati') return; // only the Saraswati has a card; other rivers do nothing
          if (safely(loadSaraswati, null) === null) return;
          returnFocus.current = document.activeElement;
          setRiver(id);
        });
        c.onTerrainFail(() => {
          c.set3D(false);
          is3D.value = false;
          notice.value = t('notice.terrainFailed');
        });
        setCtl(c);
      })
      .catch((e) => {
        if (dead) return;
        console.error('Map failed to start', e);
        setFailed(true);
      });
    return () => {
      dead = true;
      made?.destroy();
    };
  }, []);

  // The map's box changes when the header wraps or the filter panel toggles; maplibre only watches the window.
  useEffect(() => {
    const el = mapEl.current;
    if (!ctl || !el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => ctl.map?.resize?.());
    ro.observe(el);
    return () => ro.disconnect();
  }, [ctl]);
  useEffect(() => ctl?.setLang(lang.value), [ctl, lang.value]);
  useEffect(() => ctl?.setTheme(theme.value), [ctl, theme.value]);
  useEffect(() => ctl?.setTemples(shown), [ctl, shown]);
  const r = route.value;
  const known = r.kind === 'temple' && temples.some((x) => x.id === r.id);
  useEffect(() => {
    if (!ctl) return;
    ctl.select(r.kind === 'temple' && known ? r.id : null);
  }, [ctl, r.kind === 'temple' ? r.id : null, known]);

  const closeRiver = () => {
    setRiver(null);
    const el = returnFocus.current;
    if (el instanceof HTMLElement && el.isConnected) el.focus();
  };
  const pick = (id: string) => {
    setNearby(null);
    navigate({ kind: 'temple', id });
  };

  const message = notice.value ?? (r.kind === 'temple' && !known ? t('notice.templeNotFound') : null);

  return (
    <div class="app">
      <Header
        temples={temples}
        onSelectTemple={pick}
        onLang={(l) => setLang(l)}
        onToggleTheme={() => setTheme(theme.value === 'dark' ? 'light' : 'dark')}
        onNearest={() =>
          geoBlocked ? undefined : getPosition((p) => setNearby(nearestTemples(temples, p, 5)), () => setGeoBlocked(true))
        }
        geoBlocked={geoBlocked}
        filtersOpen={filtersOpen}
        onToggleFilters={() => setFiltersOpen(!filtersOpen)}
      />
      <FilterBar temples={temples} filters={filters.value} onChange={(f) => (filters.value = f)} open={filtersOpen} />
      <main class="app-main">
        {failed ? (
          <ListView temples={shown} onSelect={pick} />
        ) : (
          <>
            <div id="map" class="map" ref={mapEl} />
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
                onClick={() =>
                  geoBlocked ? undefined : getPosition((p) => ctl?.map.easeTo({ center: [p.lng, p.lat], zoom: 8 }), () => setGeoBlocked(true))
                }
              >
                ◎
              </button>
            </div>
          </>
        )}
        {message && <Notice text={message} onDismiss={notice.value ? () => (notice.value = null) : undefined} />}
        {nearby && (
          <section class="nearby">
            <ul aria-label={t('nearest.title')}>
              {nearby.map(({ temple, km }) => (
                <li key={temple.id}>
                  <button type="button" onClick={() => pick(temple.id)}>
                    {loc(temple.name).text} · {t('nearest.km', { km: Math.round(km) })}
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => setNearby(null)}>
              {t('nearest.close')}
            </button>
          </section>
        )}
        {river && <RiverCard onClose={closeRiver} />}
      </main>
    </div>
  );
}
