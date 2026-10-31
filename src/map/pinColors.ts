import type { Theme } from '../state';

/** Pin and icon colours. `tokens` names the src/styles/tokens.css variable each key mirrors (a test keeps them in sync). */
export const PIN_COLORS = {
  tokens: { accent: 'accent', gold: 'gold', kumkum: 'kumkum', muted: 'muted', text: 'text', bg: 'bg' },
  dark: { accent: '#ff9933', gold: '#e8b44c', kumkum: '#e04a5a', muted: '#c9bfae', text: '#f3ebdd', bg: '#12142b' },
  light: { accent: '#b05700', gold: '#9a6a00', kumkum: '#9e1b32', muted: '#6e4a3c', text: '#4a1f14', bg: '#fbf5e9' },
} satisfies { tokens: Record<string, string> } & Record<Theme, Record<string, string>>;
