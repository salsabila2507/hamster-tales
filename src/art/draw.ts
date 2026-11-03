/**
 * Low-level canvas drawing helpers used to generate every texture in the game
 * at runtime. Nothing here touches Phaser; callers pass a 2D context.
 */

export type Ctx = CanvasRenderingContext2D;

export function canvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  return c;
}

export function ctxOf(c: HTMLCanvasElement): Ctx {
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('2D context unavailable');
  return ctx;
}

/** Rounded rectangle path (not filled). */
export function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  const rad = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

export function ell(ctx: Ctx, cx: number, cy: number, rx: number, ry: number, rot = 0): void {
  ctx.beginPath();
  ctx.ellipse(cx, cy, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, Math.PI * 2);
}

export function fill(ctx: Ctx, color: string | CanvasGradient): void {
  ctx.fillStyle = color;
  ctx.fill();
}

export function stroke(ctx: Ctx, color: string, width = 1): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

/** Lighten (positive) or darken (negative) a hex colour. amt in -1..1 */
export function shade(hex: string, amt: number): string {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  if (amt >= 0) {
    r = Math.round(r + (255 - r) * amt);
    g = Math.round(g + (255 - g) * amt);
    b = Math.round(b + (255 - b) * amt);
  } else {
    const k = 1 + amt;
    r = Math.round(r * k);
    g = Math.round(g * k);
    b = Math.round(b * k);
  }
  return `rgb(${r},${g},${b})`;
}

/**
 * Adds an alpha channel to a colour. Accepts both `#rrggbb` and the `rgb(...)`
 * strings returned by shade(), so rgba(shade(c, x), a) works.
 */
export function rgba(hex: string, a: number): string {
  let r = 0;
  let g = 0;
  let b = 0;
  const s = hex.trim();
  if (s.startsWith('#')) {
    const h = s.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    r = (n >> 16) & 255;
    g = (n >> 8) & 255;
    b = n & 255;
  } else {
    const m = s.match(/rgba?\(([^)]+)\)/);
    if (m) {
      const parts = m[1].split(',').map((p) => parseFloat(p));
      r = parts[0] || 0;
      g = parts[1] || 0;
      b = parts[2] || 0;
    }
  }
  return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a})`;
}

export function vgrad(ctx: Ctx, x: number, y: number, w: number, h: number, stops: [number, string][]): CanvasGradient {
  const g = ctx.createLinearGradient(x, y, x, y + h);
  for (const [p, c] of stops) g.addColorStop(p, c);
  return g;
}

export function rgrad(ctx: Ctx, cx: number, cy: number, r0: number, r1: number, stops: [number, string][]): CanvasGradient {
  const g = ctx.createRadialGradient(cx, cy, r0, cx, cy, r1);
  for (const [p, c] of stops) g.addColorStop(p, c);
  return g;
}

/** Soft drop shadow blob under a character. */
export function groundShadow(ctx: Ctx, cx: number, cy: number, rx: number, alpha = 0.22): void {
  ell(ctx, cx, cy, rx, rx * 0.36);
  fill(ctx, `rgba(20,10,40,${alpha})`);
}

/** Draws fn, then repeats it shifted by +/- width so shapes cross the seam cleanly. */
export function wrapped(width: number, fn: (ctx: Ctx, offsetX: number) => void, ctx: Ctx): void {
  fn(ctx, 0);
  fn(ctx, -width);
  fn(ctx, width);
}

/** Deterministic pseudo random so art is identical on every load. */
export function makeRng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

/** Simple 5-point star path. */
export function star(ctx: Ctx, cx: number, cy: number, r: number, points = 5, inner = 0.45, rot = -Math.PI / 2): void {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const a = rot + (i * Math.PI) / points;
    const rad = i % 2 === 0 ? r : r * inner;
    const px = cx + Math.cos(a) * rad;
    const py = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

/** Four-point sparkle. */
export function sparkle(ctx: Ctx, cx: number, cy: number, r: number, color = '#fff8d6'): void {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.quadraticCurveTo(cx + r * 0.18, cy - r * 0.18, cx + r, cy);
  ctx.quadraticCurveTo(cx + r * 0.18, cy + r * 0.18, cx, cy + r);
  ctx.quadraticCurveTo(cx - r * 0.18, cy + r * 0.18, cx - r, cy);
  ctx.quadraticCurveTo(cx - r * 0.18, cy - r * 0.18, cx, cy - r);
  ctx.closePath();
  fill(ctx, color);
}
