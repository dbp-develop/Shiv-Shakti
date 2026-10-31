import type { Lang } from '../content/langs';

/** Google Fonts family per script; en uses Noto Sans alone. */
const SCRIPT_FAMILY: Partial<Record<Lang, string>> = {
  hi: 'Noto Sans Devanagari',
  mr: 'Noto Sans Devanagari',
  bn: 'Noto Sans Bengali',
  ta: 'Noto Sans Tamil',
  te: 'Noto Sans Telugu',
  gu: 'Noto Sans Gujarati',
};

const loaded = new Set<string>();

const href = (family: string): string =>
  `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@400;600;700&display=swap`;

/** Injects the stylesheet(s) for Noto Sans + the language's script, once each. No-op outside a browser. */
export function loadFont(l: Lang): void {
  if (typeof document === 'undefined') return;
  for (const family of ['Noto Sans', SCRIPT_FAMILY[l]]) {
    if (!family || loaded.has(family)) continue;
    loaded.add(family);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href(family);
    link.dataset.font = family;
    document.head.appendChild(link);
  }
}
