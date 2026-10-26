import type { Theme } from '../state';

export const ICON_IDS = ['pin-jyotirlinga', 'pin-maha-peetha', 'pin-peetha', 'pin-alternate'] as const;
export type IconId = (typeof ICON_IDS)[number];

/** Canvas pixel size; added with pixelRatio 2, so icons are 24 CSS px before `icon-size`. */
export const ICON_SIZE = 48;

/** Pin colours, matching --accent / --gold / --kumkum / --muted in tokens.css per theme. */
const COLORS: Record<Theme, { saffron: string; gold: string; kumkum: string; grey: string; edge: string }> = {
  dark: { saffron: '#ff9933', gold: '#e8b44c', kumkum: '#e04a5a', grey: '#c9bfae', edge: '#12142b' },
  light: { saffron: '#b05700', gold: '#9a6a00', kumkum: '#9e1b32', grey: '#6e4a3c', edge: '#fbf5e9' },
};

/** Every shape is anchored at the bottom centre (the tip of the pin sits on the temple). */
function draw(ctx: CanvasRenderingContext2D, id: IconId, theme: Theme): void {
  const c = COLORS[theme];
  const cx = ICON_SIZE / 2;
  ctx.lineJoin = 'round';
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = c.edge;
  if (id === 'pin-jyotirlinga') {
    // Shivalinga: a rounded vertical column on a flat yoni base.
    ctx.fillStyle = c.saffron;
    ctx.beginPath();
    ctx.ellipse(cx, 41, 15, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 7, 40);
    ctx.lineTo(cx - 7, 16);
    ctx.arc(cx, 16, 7, Math.PI, 0);
    ctx.lineTo(cx + 7, 40);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (id === 'pin-maha-peetha') {
    // Golden lotus on a stem, with a soft halo behind it.
    const halo = ctx.createRadialGradient(cx, 22, 4, cx, 22, 22);
    halo.addColorStop(0, `${c.gold}cc`);
    halo.addColorStop(1, `${c.gold}00`);
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, 22, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c.gold;
    for (const a of [-0.9, 0.9, -0.45, 0.45, 0]) {
      ctx.save();
      ctx.translate(cx, 36);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-8, -12, 0, -26);
      ctx.quadraticCurveTo(8, -12, 0, 0);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.beginPath();
    ctx.moveTo(cx, 36);
    ctx.lineTo(cx, 47);
    ctx.lineWidth = 3;
    ctx.strokeStyle = c.gold;
    ctx.stroke();
  } else if (id === 'pin-peetha') {
    // Kumkum teardrop pin with a hole.
    ctx.fillStyle = c.kumkum;
    ctx.beginPath();
    ctx.moveTo(cx, 46);
    ctx.bezierCurveTo(cx - 20, 28, cx - 15, 6, cx, 6);
    ctx.bezierCurveTo(cx + 15, 6, cx + 20, 28, cx, 46);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = c.edge;
    ctx.beginPath();
    ctx.arc(cx, 21, 5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Other claimed sites: a small grey diamond.
    ctx.fillStyle = c.grey;
    ctx.beginPath();
    ctx.moveTo(cx, 46);
    ctx.lineTo(cx - 9, 36);
    ctx.lineTo(cx, 26);
    ctx.lineTo(cx + 9, 36);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

/** Rasterises one pin icon for `map.addImage`. */
export function renderIcon(id: IconId, theme: Theme): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = ICON_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas is unavailable');
  draw(ctx, id, theme);
  return ctx.getImageData(0, 0, ICON_SIZE, ICON_SIZE);
}
