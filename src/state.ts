import { signal } from '@preact/signals';
import type { Filters } from './content/filters';
import type { Lang } from './content/langs';
import { detectLang, isLang } from './i18n/detect';
import { loadFont } from './i18n/fonts';

export type Theme = 'dark' | 'light';

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable: the choice just won't persist */
  }
}

const storedLang = read('lang');
const initialLang: Lang = isLang(storedLang)
  ? storedLang
  : detectLang(typeof navigator !== 'undefined' ? (navigator.languages ?? [navigator.language]) : []);

const storedTheme = read('theme');
const initialTheme: Theme = storedTheme === 'light' ? 'light' : 'dark';

const motionQuery =
  typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : undefined;

export const lang = signal<Lang>(initialLang);
export const theme = signal<Theme>(initialTheme);
export const reducedMotion = signal<boolean>(motionQuery?.matches ?? false);
export const is3D = signal<boolean>(true);
export const notice = signal<string | null>(null);
export const filters = signal<Filters>({ categories: new Set(['jyotirlinga', 'maha-peetha', 'peetha']) });

motionQuery?.addEventListener?.('change', (e) => {
  reducedMotion.value = e.matches;
});

function applyLang(l: Lang): void {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = l;
  loadFont(l);
}
function applyTheme(t: Theme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.theme = t;
}

export function setLang(l: Lang): void {
  if (!isLang(l)) return;
  lang.value = l;
  write('lang', l);
  applyLang(l);
}

export function setTheme(t: Theme): void {
  const next: Theme = t === 'light' ? 'light' : 'dark';
  theme.value = next;
  write('theme', next);
  applyTheme(next);
}

// Apply the initial language/theme to <html> (no-op outside a browser).
applyLang(initialLang);
applyTheme(initialTheme);
