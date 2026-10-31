import type { Theme } from '../state';
import { PIN_COLORS } from './pinColors';

export const ICON_IDS = ['pin-jyotirlinga', 'pin-maha-peetha', 'pin-peetha', 'pin-alternate'] as const;
export type IconId = (typeof ICON_IDS)[number];

/** Canvas pixel size; added with pixelRatio 1.5, so icons are 32 CSS px before `icon-size`. */
export const ICON_SIZE = 48;
export const ICON_PIXEL_RATIO = 1.5;


/** Every shape is anchored at the bottom centre (the tip of the pin sits on the temple). */
function draw(ctx: CanvasRenderingContext2D, id: IconId, theme: Theme): void {
  const p = PIN_COLORS[theme];
  const c = { saffron: p.accent, gold: p.gold, kumkum: p.kumkum, grey: p.muted, edge: p.bg };
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
    const halo = ctx.createRadialGradient(cx, 24, 6, cx, 24, 24);
    halo.addColorStop(0, `${c.gold}ff`);
    halo.addColorStop(0.55, `${c.gold}88`);
    halo.addColorStop(1, `${c.gold}00`);
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, 24, 24, 0, Math.PI * 2);
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
    ctx.lineTo(cx - 13, 33);
    ctx.lineTo(cx, 20);
    ctx.lineTo(cx + 13, 33);
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
