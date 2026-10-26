import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/tokens.css', 'utf8');

function block(selector: RegExp): Record<string, string> {
  const m = css.match(new RegExp(selector.source + String.raw`\s*\{([^}]*)\}`));
  if (!m) throw new Error(`no block for ${selector}`);
  return Object.fromEntries([...m[m.length - 1]!.matchAll(/(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{6})/g)].map((x) => [x[1]!, x[2]!]));
}

const themes = {
  dark: block(/:root,\s*:root\[data-theme='dark'\]/),
  light: block(/:root\[data-theme='light'\]/),
};

function lum(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
}
export function ratio(a: string, b: string): number {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x! + 0.05) / (y! + 0.05);
}

const FG = ['--text', '--muted', '--accent', '--good', '--bad'];
const EXACT = {
  dark: { '--bg': '#12142B', '--surface': '#1C1F3D', '--text': '#F3EBDD', '--muted': '#C9BFAE', '--accent': '#FF9933', '--gold': '#E8B44C', '--kumkum': '#E04A5A', '--good': '#5FD08A', '--bad': '#FF7A7A' },
  light: { '--bg': '#FBF5E9', '--surface': '#FFFFFF', '--text': '#4A1F14', '--muted': '#6E4A3C', '--accent': '#B05700', '--gold': '#9A6A00', '--kumkum': '#9E1B32', '--good': '#1E7A44', '--bad': '#B3261E' },
};

describe('colour tokens', () => {
  for (const [name, tokens] of Object.entries(themes)) {
    it(`${name} defines every token`, () => {
      expect(Object.keys(tokens).sort()).toEqual(Object.keys(EXACT.dark).sort());
    });
    for (const fg of FG)
      for (const bg of ['--bg', '--surface'])
        it(`${name}: ${fg} on ${bg} >= 4.5`, () => {
          expect(ratio(tokens[fg]!, tokens[bg]!)).toBeGreaterThanOrEqual(4.5);
        });
  }
  it('matches the planned values', () => {
    const lower = (o: Record<string, string>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v.toLowerCase()]));
    expect(themes).toEqual({ dark: lower(EXACT.dark), light: lower(EXACT.light) });
  });
});
