import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PIN_COLORS } from '../../../src/map/pinColors';

const css = readFileSync('src/styles/tokens.css', 'utf8');
function token(theme: 'dark' | 'light', name: string): string {
  const block = theme === 'dark' ? css.split(":root[data-theme='light']")[0] : css.split(":root[data-theme='light']")[1];
  const m = block.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`token --${name} not found for ${theme}`);
  return m[1].toLowerCase();
}

describe('pin colours', () => {
  it.each(['dark', 'light'] as const)('%s values equal tokens.css', (theme) => {
    for (const [key, tok] of Object.entries(PIN_COLORS.tokens)) {
      expect(PIN_COLORS[theme][key as keyof typeof PIN_COLORS.dark].toLowerCase(), `${theme} ${key} -> --${tok}`).toBe(token(theme, tok));
    }
  });
});
