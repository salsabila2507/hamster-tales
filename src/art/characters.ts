/**
 * Procedural character art: the hamster, NPCs. Everything is drawn with canvas
 * primitives so the game ships with zero binary assets.
 */
import { Ctx, canvas, ctxOf, ell, fill, rr, stroke, shade, rgba, rgrad, groundShadow, sparkle } from './draw';
import { FUR } from './palette';

export const HAM = 72;
/** Art is authored in a 48x48 space then scaled up into the 72x72 frame. */
const HAM_S = 1.5;
export const NPC = 40;

export type Mouth = 'smile' | 'open' | 'o' | 'flat' | 'grin';
export type Arms = 'down' | 'up' | 'spread' | 'front' | 'tuck';

export interface HamOpts {
  bob?: number;
  squash?: number;
  legPhase?: number;
  blink?: number;
  cheek?: number;
  mouth?: Mouth;
  arms?: Arms;
  look?: number;
  scarf?: number;
  tilt?: number;
  hurt?: boolean;
  sleep?: boolean;
  lean?: number;
  scarfHidden?: boolean;
}

const OUTLINE = '#7A4A1E';

function scarfTail(ctx: Ctx, x: number, y: number, wave: number, scale = 1): void {
  const w = Math.sin(wave) * 3.2;
  const w2 = Math.cos(wave * 0.8) * 3.6;
  ctx.beginPath();
  ctx.moveTo(x, y - 2.4 * scale);
  ctx.quadraticCurveTo(x + 6 * scale, y + 1 + w, x + 7.5 * scale, y + 6 * scale + w2);
  ctx.lineTo(x + 3.4 * scale, y + 7 * scale + w2);
  ctx.quadraticCurveTo(x + 3.2 * scale, y + 2, x - 1.4 * scale, y + 1.6 * scale);
  ctx.closePath();
  fill(ctx, FUR.scarfDark);
}

/** Core hamster drawing. Frame is 48x48, feet land at y=44. */
export function drawHamster(ctx: Ctx, o: HamOpts = {}): void {
  const bob = o.bob ?? 0;
  const sq = o.squash ?? 1;
  const leg = o.legPhase ?? 0;
  const blink = o.blink ?? 0;
  const cheek = o.cheek ?? 0;
  const look = o.look ?? 0;
  const wave = o.scarf ?? 0;
  const tilt = o.tilt ?? 0;
  const lean = o.lean ?? 0;

  const hx = 24 + look * 1.4;
  const hy = 19 + bob;
  const bx = 24 + lean;
  const by = 33 + bob;
  const rx = 12 * (2 - sq) * 0.5 + 12 * 0.5;
  const ry = 9.5 * sq;

  ctx.save();
  ctx.scale(HAM_S, HAM_S);

  ctx.save();
  ctx.translate(24, 30);
  ctx.rotate(tilt);
  ctx.translate(-24, -30);

  // ---- backpack (behind body) ----
  ctx.save();
  rr(ctx, 8.5, by - 8, 11, 12.5, 3.4);
  fill(ctx, FUR.packDark);
  rr(ctx, 9.5, by - 7, 9, 10.5, 3);
  fill(ctx, FUR.pack);
  rr(ctx, 9.5, by - 7, 9, 4, 2.6);
  fill(ctx, shade(FUR.pack, 0.12));
  ell(ctx, 14, by - 1.2, 1.5, 1.5);
  fill(ctx, '#FFD97A');
  ctx.restore();

  // ---- ears (behind head) ----
  const earTilt = Math.sin(wave * 0.7) * 0.08;
  for (const [ex, dir] of [[hx - 10.5, -1], [hx + 10.5, 1]] as [number, number][]) {
    ctx.save();
    ctx.translate(ex, hy - 10.5);
    ctx.rotate(earTilt * dir);
    ell(ctx, 0, 0, 5.6, 5.6);
    fill(ctx, OUTLINE);
    ell(ctx, 0, 0, 4.4, 4.4);
    fill(ctx, FUR.base);
    ell(ctx, 0, 0.4, 2.6, 2.6);
    fill(ctx, FUR.ear);
    ctx.restore();
  }

  // ---- silhouette outline ----
  ell(ctx, bx, by, rx + 1.9, ry + 1.9);
  fill(ctx, OUTLINE);
  ell(ctx, hx, hy, 15.4, 15.4);
  fill(ctx, OUTLINE);

  // ---- body ----
  ell(ctx, bx, by, rx, ry);
  fill(ctx, FUR.base);

  // ---- head ----
  ell(ctx, hx, hy, 13.5, 13.5);
  fill(ctx, FUR.base);

  // head shading
  ell(ctx, hx - 3, hy - 4.5, 9.5, 8.5);
  fill(ctx, rgrad(ctx, hx - 4, hy - 5, 1, 12, [[0, rgba(FUR.light, 0.85)], [1, rgba(FUR.light, 0)]]));

  // belly
  ell(ctx, bx + 1, by + 1.5, 7.6, 6.2);
  fill(ctx, FUR.belly);

  // ---- muzzle / face patch ----
  ell(ctx, hx + 0.5, hy + 6.5, 8.6, 6.4);
  fill(ctx, FUR.belly);

  // ---- cheeks ----
  const cr = 5.4 + cheek * 3.2;
  ell(ctx, hx - 9.5, hy + 4.5, cr, cr * 0.92);
  fill(ctx, rgba(FUR.ear, 0.42 + cheek * 0.28));
  ell(ctx, hx + 10.5, hy + 4.5, cr, cr * 0.92);
  fill(ctx, rgba(FUR.ear, 0.42 + cheek * 0.28));

  // ---- eyes ----
  const eyeY = hy - 0.5;
  for (const [ex, dir] of [[hx - 5.6, -1], [hx + 5.6, 1]] as [number, number][]) {
    if (blink > 0.55 || o.sleep) {
      ctx.beginPath();
      ctx.moveTo(ex - 4, eyeY);
      ctx.quadraticCurveTo(ex, eyeY + 3.4, ex + 4, eyeY);
      stroke(ctx, FUR.eye, 2.1);
    } else if (o.hurt) {
      ctx.beginPath();
      ctx.moveTo(ex - 3.6 * dir, eyeY - 3.2);
      ctx.lineTo(ex + 3.2 * dir, eyeY);
      ctx.lineTo(ex - 3.6 * dir, eyeY + 3.2);
      stroke(ctx, FUR.eye, 2);
    } else {
      const open = 1 - Math.min(1, blink * 2);
      ell(ctx, ex, eyeY, 4.5, 5.3 * open);
      fill(ctx, FUR.eye);
      ell(ctx, ex - 1.5, eyeY - 2, 1.7, 1.9 * open);
      fill(ctx, FUR.eyeHi);
      ell(ctx, ex + 1.7, eyeY + 2.2, 0.85, 0.85 * open);
      fill(ctx, rgba('#FFFFFF', 0.75));
    }
  }

  // ---- nose + mouth ----
  ell(ctx, hx + 0.5, hy + 4.6, 2.2, 1.7);
  fill(ctx, FUR.nose);
  ctx.beginPath();
  ctx.moveTo(hx + 0.5, hy + 6.2);
  ctx.lineTo(hx + 0.5, hy + 7.4);
  stroke(ctx, '#B4556A', 1.1);

  const m = o.mouth ?? 'smile';
  if (m === 'open' || m === 'o') {
    ell(ctx, hx + 0.5, hy + 9.2, m === 'o' ? 2.1 : 3.1, m === 'o' ? 2.4 : 3.1);
    fill(ctx, '#8A3A4E');
    ell(ctx, hx + 0.5, hy + 10.6, 1.8, 1.2);
    fill(ctx, '#E8788C');
  } else if (m === 'grin') {
    ctx.beginPath();
    ctx.arc(hx + 0.5, hy + 8.4, 4.2, 0.15, Math.PI - 0.15);
    stroke(ctx, '#B4556A', 1.5);
    ctx.beginPath();
    ctx.moveTo(hx - 2.6, hy + 9.6);
    ctx.lineTo(hx + 3.6, hy + 9.6);
    stroke(ctx, '#FFF7E8', 2);
  } else if (m === 'flat') {
    ctx.beginPath();
    ctx.moveTo(hx - 2.6, hy + 9);
    ctx.lineTo(hx + 3.6, hy + 9);
    stroke(ctx, '#B4556A', 1.3);
  } else {
    ctx.beginPath();
    ctx.moveTo(hx - 3.2, hy + 8.2);
    ctx.quadraticCurveTo(hx + 0.5, hy + 10.6, hx + 4.2, hy + 8.2);
    stroke(ctx, '#B4556A', 1.3);
  }

  // ---- whiskers ----
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const y0 = hy + 6.2 + i * 1.9;
      ctx.beginPath();
      ctx.moveTo(hx + s * 7.5, y0);
      ctx.lineTo(hx + s * (13.5 + i * 0.6), y0 - 2 + i * 1.7);
      stroke(ctx, rgba('#8B5A2B', 0.5), 0.85);
    }
  }

  // ---- head tuft ----
  ctx.beginPath();
  ctx.moveTo(hx - 2.5, hy - 13.2);
  ctx.quadraticCurveTo(hx - 3.5, hy - 16.5, hx - 0.5, hy - 15.4);
  stroke(ctx, FUR.dark, 1.8);
  ctx.beginPath();
  ctx.moveTo(hx + 1.6, hy - 13.4);
  ctx.quadraticCurveTo(hx + 3.6, hy - 16.2, hx + 4.6, hy - 14);
  stroke(ctx, FUR.dark, 1.6);

  // ---- scarf ----
  if (!o.scarfHidden) {
    ctx.save();
    rr(ctx, hx - 12.2, hy + 10.2, 24.4, 4.6, 2.3);
    fill(ctx, FUR.scarf);
    rr(ctx, hx - 12.2, hy + 10.2, 24.4, 1.7, 1);
    fill(ctx, shade(FUR.scarf, 0.22));
    scarfTail(ctx, hx + 9.5, hy + 12.5, wave, 1);
    ell(ctx, hx + 10.6, hy + 12.4, 3.2, 3.1);
    fill(ctx, FUR.scarf);
    ell(ctx, hx + 10.6, hy + 12.4, 1.5, 1.4);
    fill(ctx, '#FFD97A');
    ctx.restore();
  }

  // ---- arms ----
  const armY = by - 3;
  if (o.arms === 'up') {
    ell(ctx, bx - 10, armY - 6, 3.4, 4.6, -0.5);
    fill(ctx, FUR.base);
    ell(ctx, bx + 11, armY - 6, 3.4, 4.6, 0.5);
    fill(ctx, FUR.base);
  } else if (o.arms === 'spread') {
    ell(ctx, bx - 12.5, armY - 1, 4.6, 3.1, -0.35);
    fill(ctx, FUR.base);
    ell(ctx, bx + 13.5, armY - 1, 4.6, 3.1, 0.35);
    fill(ctx, FUR.base);
  } else if (o.arms === 'front') {
    ell(ctx, bx + 8.5, armY + 1, 4.2, 3.2, -0.3);
    fill(ctx, FUR.base);
  } else if (o.arms === 'tuck') {
    ell(ctx, bx - 7, by - 1, 3.4, 2.8);
    fill(ctx, FUR.base);
    ell(ctx, bx + 8, by - 1, 3.4, 2.8);
    fill(ctx, FUR.base);
  } else {
    ell(ctx, bx - 10.5, armY + 1, 3.2, 2.6, -0.2);
    fill(ctx, FUR.base);
    ell(ctx, bx + 11.5, armY + 1, 3.2, 2.6, 0.2);
    fill(ctx, FUR.base);
  }

  // ---- feet ----
  const l1 = Math.sin(leg * Math.PI * 2) * 2.2;
  const l2 = Math.sin(leg * Math.PI * 2 + Math.PI) * 2.2;
  ell(ctx, bx - 5.5, 42 + Math.min(0, l1) * 0.6, 5.2, 3);
  fill(ctx, FUR.light);
  ell(ctx, bx + 6.5, 42 + Math.min(0, l2) * 0.6, 5.2, 3);
  fill(ctx, FUR.light);
  ctx.restore();
  ctx.restore();
}

/** Rolling ball form, 6 rotation frames. */
export function drawHamsterBall(ctx: Ctx, frame: number, total = 6): void {
  ctx.save();
  ctx.scale(HAM_S, HAM_S);
  const a = (frame / total) * Math.PI * 2;
  const cx = 24;
  const cy = 30;
  const r = 13.4;

  ell(ctx, cx, cy, r + 1.6, r + 1.6);
  fill(ctx, OUTLINE);
  ell(ctx, cx, cy, r, r);
  fill(ctx, rgrad(ctx, cx - 4, cy - 5, 2, r * 1.5, [[0, FUR.light], [0.6, FUR.base], [1, FUR.dark]]));

  // swirl marks
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(a);
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(0, 0, 5 + i * 3.2, i * 2.1, i * 2.1 + 1.7);
    stroke(ctx, rgba(FUR.deep, 0.4), 1.6);
  }
  ctx.restore();

  // tucked face
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(a * 1.4);
  ell(ctx, -1, 2.5, 6.4, 5.2);
  fill(ctx, FUR.belly);
  ell(ctx, -3.2, 1.6, 1.9, 2.1);
  fill(ctx, FUR.eye);
  ell(ctx, 1.6, 1.6, 1.9, 2.1);
  fill(ctx, FUR.eye);
  ell(ctx, -0.8, 4.2, 1.3, 1);
  fill(ctx, FUR.nose);
  ctx.restore();

  // scarf band
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(a);
  ctx.beginPath();
  ctx.arc(0, 0, r - 2.4, -0.5, 0.5);
  stroke(ctx, FUR.scarf, 3.2);
  ctx.restore();
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* NPCs                                                                */
/* ------------------------------------------------------------------ */

export function drawSnail(ctx: Ctx, bob: number): void {
  const y = 26 + bob;
  ell(ctx, 20, 36, 12, 3.4);
  fill(ctx, 'rgba(20,10,40,0.18)');
  // body
  ctx.beginPath();
  ctx.moveTo(6, 36);
  ctx.quadraticCurveTo(4, 26, 12, 24);
  ctx.quadraticCurveTo(24, 21, 30, 28);
  ctx.quadraticCurveTo(34, 36, 26, 36);
  ctx.closePath();
  fill(ctx, '#A8D8B9');
  // shell
  ell(ctx, 20, 24, 10.5, 10);
  fill(ctx, '#E2A455');
  ell(ctx, 20, 24, 8.6, 8.2);
  fill(ctx, '#C4853A');
  ctx.beginPath();
  ctx.arc(20, 24, 6.4, 0.4, 4.2);
  stroke(ctx, '#F5C57E', 2);
  ctx.beginPath();
  ctx.arc(21, 25, 3.4, 2.4, 6.4);
  stroke(ctx, '#F5C57E', 1.8);
  // head
  ell(ctx, 8, 22, 6, 5.6);
  fill(ctx, '#B8E4C8');
  // eye stalks
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(7 + s * 2, 19);
    ctx.lineTo(6 + s * 3.4, 12);
    stroke(ctx, '#A8D8B9', 2.2);
    ell(ctx, 6 + s * 3.4, 11, 2.1, 2.1);
    fill(ctx, '#2B1B2E');
    ell(ctx, 5.4 + s * 3.4, 10.4, 0.7, 0.7);
    fill(ctx, '#fff');
  }
}

export function drawFrog(ctx: Ctx, bob: number): void {
  const y = 30 + bob;
  ell(ctx, 20, 37, 12, 3.2);
  fill(ctx, 'rgba(20,10,40,0.18)');
  ell(ctx, 20, y + 4, 13, 9);
  fill(ctx, '#7FD47F');
  ell(ctx, 20, y + 6, 10, 6.4);
  fill(ctx, '#D9F5C8');
  // eyes on top
  for (const s of [-1, 1]) {
    ell(ctx, 20 + s * 7, y - 5, 5.4, 5.4);
    fill(ctx, '#7FD47F');
    ell(ctx, 20 + s * 7, y - 5, 3.4, 3.4);
    fill(ctx, '#2B1B2E');
    ell(ctx, 19 + s * 7, y - 6.4, 1.2, 1.2);
    fill(ctx, '#fff');
  }
  ctx.beginPath();
  ctx.arc(20, y + 3, 6, 0.25, Math.PI - 0.25);
  stroke(ctx, '#3E8A46', 1.6);
  ell(ctx, 20, y + 1.4, 0.9, 0.7);
  fill(ctx, '#3E8A46');
  // feet
  ell(ctx, 9, y + 11, 4, 2.2);
  fill(ctx, '#7FD47F');
  ell(ctx, 31, y + 11, 4, 2.2);
  fill(ctx, '#7FD47F');
}

export function drawOwl(ctx: Ctx, bob: number): void {
  const y = 22 + bob;
  ell(ctx, 20, 37, 11, 3.2);
  fill(ctx, 'rgba(20,10,40,0.18)');
  ell(ctx, 20, y + 6, 12, 12);
  fill(ctx, '#8A6BB5');
  ell(ctx, 20, y + 8, 8, 8.4);
  fill(ctx, '#E7D9F5');
  // wings
  for (const s of [-1, 1]) {
    ell(ctx, 20 + s * 11, y + 7, 3.6, 8);
    fill(ctx, '#7255A0');
  }
  // head
  ell(ctx, 20, y - 3, 10.4, 9.6);
  fill(ctx, '#9B7BC7');
  // ear tufts
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(20 + s * 6, y - 10);
    ctx.lineTo(20 + s * 10, y - 15);
    ctx.lineTo(20 + s * 10.5, y - 8);
    ctx.closePath();
    fill(ctx, '#8A6BB5');
  }
  // eyes
  for (const s of [-1, 1]) {
    ell(ctx, 20 + s * 4.6, y - 4, 4.4, 4.4);
    fill(ctx, '#FFF3D6');
    ell(ctx, 20 + s * 4.6, y - 4, 2.5, 2.5);
    fill(ctx, '#2B1B2E');
    ell(ctx, 19.2 + s * 4.6, y - 5.2, 0.9, 0.9);
    fill(ctx, '#fff');
  }
  ctx.beginPath();
  ctx.moveTo(20, y - 1);
  ctx.lineTo(17.4, y + 2);
  ctx.lineTo(22.6, y + 2);
  ctx.closePath();
  fill(ctx, '#FFB84D');
  // beak line
  ell(ctx, 20, y + 8, 5, 4);
  fill(ctx, '#C9B3E0');
  sparkle(ctx, 30, y - 12, 3, 'rgba(255,240,180,0.8)');
}
