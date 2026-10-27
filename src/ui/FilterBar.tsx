import { useMemo } from 'preact/hooks';
import type { Filters } from '../content/filters';
import type { PeethaList, PinCategory, Temple } from '../content/schema';
import { lang } from '../state';
import { t } from '../i18n';

const CATEGORIES: Array<[PinCategory, string]> = [
  ['jyotirlinga', 'pins.jyotirlinga'],
  ['maha-peetha', 'pins.mahaPeetha'],
  ['peetha', 'pins.peetha'],
];
const LISTS: Array<[PeethaList, string]> = [
  ['ashtadasha-18', 'filters.list.maha'],
  ['adi-4', 'filters.list.adi'],
  ['peetha-nirnaya-51', 'filters.list.all51'],
];

export function FilterBar({
  temples,
  filters,
  onChange,
  open,
}: {
  temples: Temple[];
  filters: Filters;
  onChange: (f: Filters) => void;
  open: boolean;
}) {
  const regions = useMemo(() => [...new Set(temples.map((x) => x.location.region))].sort(), [temples]);
  const fmt = new Intl.DateTimeFormat(lang.value, { month: 'long', timeZone: 'UTC' });
  const toggleCat = (c: PinCategory) => {
    const categories = new Set(filters.categories);
    if (!categories.delete(c)) categories.add(c);
    onChange({ ...filters, categories });
  };
  return (
    <div class={`filter-bar${open ? ' filter-bar--open' : ''}`} id="filter-bar">
      <div class="chips">
        {CATEGORIES.map(([c, key]) => (
          <button type="button" class="chip" aria-pressed={filters.categories.has(c)} onClick={() => toggleCat(c)} key={c}>
            {t(key)}
          </button>
        ))}
      </div>
      <div class="chips">
        {LISTS.map(([l, key]) => (
          <button
            type="button"
            class="chip"
            aria-pressed={filters.list === l}
            onClick={() => onChange({ ...filters, list: filters.list === l ? undefined : l })}
            key={l}
          >
            {t(key)}
          </button>
        ))}
      </div>
      <label>
        <span class="sr-label">{t('filters.region')}</span>
        <select
          value={filters.region ?? ''}
          onChange={(e) => onChange({ ...filters, region: (e.target as HTMLSelectElement).value || undefined })}
        >
          <option value="">{t('filters.allRegions')}</option>
          {regions.map((r) => (
            <option value={r} key={r}>
              {r}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span class="sr-label">{t('filters.month')}</span>
        <select
          value={filters.festivalMonth === undefined ? '' : String(filters.festivalMonth)}
          onChange={(e) => {
            const v = (e.target as HTMLSelectElement).value;
            onChange({ ...filters, festivalMonth: v ? Number(v) : undefined });
          }}
        >
          <option value="">{t('filters.anyMonth')}</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option value={String(i + 1)} key={i}>
              {fmt.format(new Date(Date.UTC(2000, i, 1)))}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
