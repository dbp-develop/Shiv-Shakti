import { useState } from 'preact/hooks';
import type { Lang } from '../content/langs';
import type { Temple } from '../content/schema';
import { t } from '../i18n';
import { lang, theme } from '../state';
import { SearchBox } from './SearchBox';

export const ENDONYMS: Array<[Lang, string]> = [
  ['en', 'English'],
  ['hi', 'हिन्दी'],
  ['bn', 'বাংলা'],
  ['mr', 'मराठी'],
  ['ta', 'தமிழ்'],
  ['te', 'తెలుగు'],
  ['gu', 'ગુજરાતી'],
];

export interface HeaderProps {
  temples: Temple[];
  onSelectTemple: (id: string) => void;
  onLang: (l: Lang) => void;
  onToggleTheme: () => void;
  onNearest: () => void;
  filtersOpen: boolean;
  onToggleFilters: () => void;
}

export function Header(p: HeaderProps) {
  const [menu, setMenu] = useState(false);
  return (
    <header class="app-header">
      <h1 class="app-header__title">{t('app.title')}</h1>
      <SearchBox temples={p.temples} onSelect={p.onSelectTemple} />
      <div class="app-header__actions">
        <div class="lang-menu">
          <button type="button" aria-haspopup="true" aria-expanded={menu} aria-controls="lang-list" aria-label={t('lang.menuLabel')} onClick={() => setMenu(!menu)}>
            {ENDONYMS.find(([l]) => l === lang.value)![1]}
          </button>
          <ul id="lang-list" hidden={!menu}>
            {ENDONYMS.map(([l, name]) => (
              <li key={l}>
                <button
                  type="button"
                  lang={l}
                  aria-pressed={lang.value === l}
                  onClick={() => {
                    p.onLang(l);
                    setMenu(false);
                  }}
                >
                  {name}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <button type="button" onClick={p.onToggleTheme} aria-label={theme.value === 'dark' ? t('theme.toLight') : t('theme.toDark')}>
          {theme.value === 'dark' ? '☀' : '☾'}
        </button>
        <button type="button" onClick={p.onNearest}>
          {t('nearest.button')}
        </button>
        <button type="button" class="filters-toggle" aria-expanded={p.filtersOpen} aria-controls="filter-bar" onClick={p.onToggleFilters}>
          {t('filters.toggle')}
        </button>
      </div>
    </header>
  );
}
