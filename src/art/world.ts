/** Procedural tiles, props, parallax backgrounds and particle bits. */
import { Ctx, ell, fill, rr, stroke, shade, rgba, vgrad, rgrad, star, sparkle, wrapped, makeRng } from './draw';
import { Theme } from './palette';

export const TILE = 32;

/* ------------------------------- tiles --------------------------------- */

export function drawGroundTop(ctx: Ctx, t: Theme, variant: number): void {
  const rng = makeRng(900 + variant * 37 + t.key.length * 11);
  // dirt base
  ctx.fillStyle = t.groundBody;
  ctx.fillRect(0, 0, TILE, TILE);
  // top cap
  const capH = 11;
  ctx.beginPath();
  ctx.moveTo(0, capH + 1.5);
  for (let x = 0; x <= TILE; x += 4) {
    ctx.lineTo(x, capH + Math.sin((x / TILE) * Math.PI * 2) * 1.2);
  }
  ctx.lineTo(TILE, 0);
  ctx.lineTo(0, 0);
  ctx.closePath();
  fill(ctx, t.groundTop);

  // grass blades
  for (let i = 0; i < 5; i++) {
    const x = 3 + i * 6.4 + rng() * 2;
    const h = 3 + rng() * 3.5;
    ctx.beginPath();
    ctx.moveTo(x, 2);
    ctx.quadraticCurveTo(x + 1.5, 2 - h, x + 3, 1.4 - h);
    stroke(ctx, shade(t.groundTop, 0.28), 1.4);
  }
  // highlight line
  ctx.beginPath();
  ctx.moveTo(0, 2.2);
  ctx.lineTo(TILE, 2.2);
  stroke(ctx, rgba('#FFFFFF', 0.22), 1.4);

  if (t.key !== 'sky') {
    // dirt speckles (only for soil/rock themes, not sky)
    for (let i = 0; i < 7; i++) {
      const x = 3 + rng() * 26;
      const y = capH + 4 + rng() * 17;
      ell(ctx, x, y, 1.1 + rng() * 1.3, 1 + rng());
      fill(ctx, rgba(t.groundDark, 0.55));
    }
    // pebbles
    if (variant === 0) {
      ell(ctx, 22, 22, 2.6, 1.9);
      fill(ctx, rgba(shade(t.groundBody, 0.3), 0.8));
    }
  }

  if (t.key === 'meadow' && variant === 1) {
    // tiny flower on the grass
    const fx = 20;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ell(ctx, fx + Math.cos(a) * 1.7, 6 + Math.sin(a) * 1.7, 1.5, 1.5);
      fill(ctx, '#FFF3D6');
    }
    ell(ctx, fx, 6, 1.1, 1.1);
    fill(ctx, t.accent);
  }
  if (t.key === 'cave') {
    for (let i = 0; i < 3; i++) {
      const x = 5 + rng() * 22;
      const y = 6 + rng() * 4;
      star(ctx, x, y, 2.2, 4, 0.35);
      fill(ctx, rgba(t.accent, 0.85));
    }
  }
  if (t.key === 'sky') {
    // soft cloud fluff transition beneath the grass cap
    ctx.beginPath();
    ctx.moveTo(0, capH + 1);
    for (let x = 0; x <= TILE; x += 8) {
      ctx.quadraticCurveTo(x + 4, capH + 3.2, x + 8, capH + 1);
    }
    ctx.lineTo(TILE, capH);
    ctx.lineTo(0, capH);
    ctx.closePath();
    fill(ctx, rgba('#FFFFFF', 0.6));

    if (variant === 1) {
      // tiny pink cloudberry on grass
      ell(ctx, 18, 5, 2.2, 2.2);
      fill(ctx, t.accent);
      ell(ctx, 17.3, 4.3, 0.8, 0.8);
      fill(ctx, '#FFFFFF');
    }
  }
  if (t.key === 'forest') {
    for (let i = 0; i < 4; i++) {
      const x = 4 + rng() * 24;
      ctx.beginPath();
      ctx.moveTo(x, 3);
      ctx.lineTo(x + 1, 7);
      stroke(ctx, rgba(t.accent2, 0.5), 1.2);
    }
  }
}

export function drawGroundBody(ctx: Ctx, t: Theme, variant: number): void {
  const rng = makeRng(1300 + variant * 91 + t.key.length * 7);
  ctx.fillStyle = t.groundBody;
  ctx.fillRect(0, 0, TILE, TILE);

  if (t.key === 'sky') {
    // Cloudstone: soft, seamless cloud mass
    ctx.fillStyle = vgrad(ctx, 0, 0, TILE, TILE, [
      [0, rgba('#FFFFFF', 0.18)],
      [1, rgba(t.groundDark, 0.1)]
    ]);
    ctx.fillRect(0, 0, TILE, TILE);

    // gentle, varied cloud drifts per variant rather than repetitive bubble-wrap eggs
    const cx = (variant * 7 + 10) % 24 + 4;
    const cy = (variant * 11 + 8) % 20 + 6;
    ell(ctx, cx, cy, 10 + rng() * 4, 6 + rng() * 3);
    fill(ctx, rgba('#FFFFFF', 0.28));

    // subtle soft shadow drift
    ell(ctx, (cx + 14) % 30 + 1, (cy + 12) % 26 + 3, 8 + rng() * 3, 5 + rng() * 2);
    fill(ctx, rgba('#9EC8E4', 0.12));

    // delicate light seam so it feels unified, not brick-like
    ctx.fillStyle = rgba(t.groundDark, 0.08);
    ctx.fillRect(0, TILE - 1, TILE, 1);
  } else {
    // subtle vertical shading
    ctx.fillStyle = vgrad(ctx, 0, 0, TILE, TILE, [[0, rgba('#FFFFFF', 0.06)], [1, rgba(t.groundDark, 0.25)]]);
    ctx.fillRect(0, 0, TILE, TILE);

    for (let i = 0; i < 8; i++) {
      const x = 3 + rng() * 26;
      const y = 3 + rng() * 26;
      ell(ctx, x, y, 1 + rng() * 1.6, 0.9 + rng() * 1.2);
      fill(ctx, rgba(t.groundDark, 0.35 + rng() * 0.25));
    }
    // embedded stones / roots break up the repetition
    if (variant % 2 === 0) {
      ell(ctx, 9 + rng() * 14, 9 + rng() * 14, 3.4, 2.3, rng());
      fill(ctx, rgba(shade(t.groundBody, 0.2), 0.55));
    } else {
      ctx.beginPath();
      ctx.moveTo(6, 24);
      ctx.quadraticCurveTo(14, 18, 24, 22);
      stroke(ctx, rgba(t.groundDark, 0.45), 1.6);
    }

    if (variant === 2) {
      ell(ctx, 16, 16, 5.5, 4);
      fill(ctx, rgba(shade(t.groundBody, 0.22), 0.7));
      ell(ctx, 15, 14.6, 3.4, 2.2);
      fill(ctx, rgba('#FFFFFF', 0.14));
    }
    if (t.key === 'cave' || t.key === 'forest') {
      for (let i = 0; i < 3; i++) {
        ell(ctx, 5 + rng() * 22, 5 + rng() * 22, 1.4, 1.4);
        fill(ctx, rgba(t.accent2, 0.5));
      }
    }
    // edge shading so blocks read as chunks
    ctx.fillStyle = rgba(t.groundDark, 0.3);
    ctx.fillRect(0, TILE - 2, TILE, 2);
  }
}

export function drawPlatform(ctx: Ctx, t: Theme): void {
  // 32x16 wooden plank
  rr(ctx, 1, 1, 30, 12, 3);
  fill(ctx, shade(t.groundBody, 0.1));
  rr(ctx, 2, 2, 28, 4, 2);
  fill(ctx, shade(t.groundTop, 0.1));
  rr(ctx, 2, 2, 28, 2, 1);
  fill(ctx, rgba('#FFFFFF', 0.3));
  // nails
  for (const x of [6, 26]) {
    ell(ctx, x, 8, 1.3, 1.3);
    fill(ctx, rgba('#000000', 0.28));
  }
  ctx.fillStyle = rgba(t.groundDark, 0.4);
  ctx.fillRect(2, 12, 28, 2);
}

export function drawSpike(ctx: Ctx, t: Theme): void {
  const n = 3;
  const w = TILE / n;
  for (let i = 0; i < n; i++) {
    ctx.beginPath();
    ctx.moveTo(i * w, 16);
    ctx.lineTo(i * w + w / 2, 1);
    ctx.lineTo((i + 1) * w, 16);
    ctx.closePath();
    fill(ctx, '#D8DEEA');
    ctx.beginPath();
    ctx.moveTo(i * w + w / 2, 1);
    ctx.lineTo((i + 1) * w, 16);
    ctx.lineTo(i * w + w * 0.72, 16);
    ctx.closePath();
    fill(ctx, '#9AA6BC');
  }
  ctx.fillStyle = rgba(t.groundDark, 0.55);
  ctx.fillRect(0, 14, TILE, 2);
}

export function drawWater(ctx: Ctx, t: Theme, frame: number): void {
  const off = frame * 6;
  ctx.fillStyle = rgba(t.key === 'meadow' ? '#5EC8E8' : '#4FC4B4', 0.75);
  ctx.fillRect(0, 0, TILE, TILE);
  ctx.beginPath();
  for (let x = 0; x <= TILE; x += 4) {
    const y = 3 + Math.sin(((x + off) / TILE) * Math.PI * 2) * 2;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.lineTo(TILE, 0);
  ctx.lineTo(0, 0);
  ctx.closePath();
  fill(ctx, rgba('#FFFFFF', 0.35));
  for (let i = 0; i < 3; i++) {
    ell(ctx, 6 + i * 10 + Math.sin(off / 8 + i) * 2, 14 + i * 5, 2.4, 1.2);
    fill(ctx, rgba('#FFFFFF', 0.22));
  }
}

/* ------------------------------- props --------------------------------- */

export function drawSeed(ctx: Ctx, frame: number): void {
  const s = frame === 0 ? 1 : 1.08;
  ctx.save();
  ctx.translate(9, 9);
  ctx.scale(s, 1 / s);
  // husk
  ctx.beginPath();
  ctx.moveTo(0, -7.5);
  ctx.quadraticCurveTo(6.4, -4, 4.6, 3.4);
  ctx.quadraticCurveTo(3, 7.6, 0, 7.6);
  ctx.quadraticCurveTo(-3, 7.6, -4.6, 3.4);
  ctx.quadraticCurveTo(-6.4, -4, 0, -7.5);
  ctx.closePath();
  fill(ctx, '#4A3B2A');
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.quadraticCurveTo(4.6, -3.2, 3.4, 2.6);
  ctx.quadraticCurveTo(2.2, 5.8, 0, 6);
  ctx.quadraticCurveTo(-2.2, 5.8, -3.4, 2.6);
  ctx.quadraticCurveTo(-4.6, -3.2, 0, -6);
  ctx.closePath();
  fill(ctx, '#EFE3C8');
  // stripe
  ctx.beginPath();
  ctx.moveTo(-1.4, -4.4);
  ctx.lineTo(-1.4, 5);
  stroke(ctx, '#C9B48C', 1.1);
  ctx.restore();
  sparkle(ctx, 14, 3, 2.2, rgba('#FFF8D6', 0.75));
}

export function drawCoin(ctx: Ctx, frame: number): void {
  const sx = frame === 0 ? 1 : 0.82;
  ctx.save();
  ctx.translate(10, 10);
  ctx.scale(sx, 1);
  ell(ctx, 0, 0, 8.4, 8.4);
  fill(ctx, '#E8A32C');
  ell(ctx, 0, 0, 7, 7);
  fill(ctx, rgrad(ctx, -2, -2.5, 1, 8, [[0, '#FFF3A8'], [0.6, '#FFCB4D'], [1, '#E8A32C']]));
  // paw print
  ell(ctx, 0, 1.6, 2.4, 2);
  fill(ctx, rgba('#B8761A', 0.75));
  for (const [dx, dy] of [[-2.4, -1.4], [0, -2.4], [2.4, -1.4]] as [number, number][]) {
    ell(ctx, dx, dy, 0.95, 1.1);
    fill(ctx, rgba('#B8761A', 0.75));
  }
  ctx.restore();
}

export function drawBerry(ctx: Ctx, frame: number): void {
  ctx.save();
  ctx.translate(9, 10);
  const pop = frame === 0 ? 1 : 1.1;
  ctx.scale(pop, pop);
  ell(ctx, 0, 0, 7.4, 7);
  fill(ctx, '#D9435E');
  ell(ctx, -1.8, -1.6, 3.4, 3);
  fill(ctx, rgba('#FF8FA3', 0.85));
  ell(ctx, 1.6, 2.4, 2, 1.6);
  fill(ctx, rgba('#8C1F35', 0.4));
  // leaves
  for (const a of [-0.5, 0, 0.5]) {
    ell(ctx, Math.sin(a) * 4, -6.4 - Math.cos(a) * 1.6, 2.4, 1.6, a);
    fill(ctx, '#4FA96B');
  }
  ctx.restore();
}

export function drawTreasure(ctx: Ctx, frame: number): void {
  ctx.save();
  ctx.translate(13, 13);
  ctx.rotate(frame * 0.35);
  // gem
  ctx.beginPath();
  ctx.moveTo(0, -9);
  ctx.lineTo(7, -2);
  ctx.lineTo(0, 9);
  ctx.lineTo(-7, -2);
  ctx.closePath();
  fill(ctx, rgrad(ctx, -2, -3, 1, 12, [[0, '#E0FBFF'], [0.5, '#7DE3F5'], [1, '#3E9FB8']]));
  ctx.beginPath();
  ctx.moveTo(0, -9);
  ctx.lineTo(7, -2);
  ctx.lineTo(0, 2);
  ctx.closePath();
  fill(ctx, rgba('#FFFFFF', 0.45));
  ctx.restore();
  sparkle(ctx, 20, 6, 3.4, rgba('#FFFFFF', 0.85));
}

export function drawChest(ctx: Ctx, open: boolean): void {
  // 30x26
  ell(ctx, 15, 24, 13, 3);
  fill(ctx, 'rgba(20,10,40,0.2)');
  rr(ctx, 3, 12, 24, 12, 3);
  fill(ctx, '#8B5A2B');
  rr(ctx, 4, 13, 22, 10, 2);
  fill(ctx, '#A9713F');
  if (open) {
    rr(ctx, 3, 2, 24, 9, 3);
    fill(ctx, '#7A4A1E');
    rr(ctx, 5, 4, 20, 6, 2);
    fill(ctx, '#5E3A1C');
    // sparkle inside
    sparkle(ctx, 15, 10, 5, rgba('#FFF3A8', 0.9));
  } else {
    rr(ctx, 3, 6, 24, 8, 3);
    fill(ctx, '#7A4A1E');
    rr(ctx, 4, 7, 22, 6, 2);
    fill(ctx, '#9A6234');
  }
  // straps
  ctx.fillStyle = '#FFCB4D';
  ctx.fillRect(7, open ? 3 : 6, 2.6, open ? 8 : 18);
  ctx.fillRect(20, open ? 3 : 6, 2.6, open ? 8 : 18);
  // lock
  rr(ctx, 12.6, 14, 5, 5, 1.4);
  fill(ctx, '#FFCB4D');
  ell(ctx, 15.1, 16.4, 1, 1.3);
  fill(ctx, '#8B5A2B');
}

export function drawMushroom(ctx: Ctx, frame: number): void {
  const squash = frame === 0 ? 1 : 0.86;
  ell(ctx, 16, 24, 10, 3);
  fill(ctx, 'rgba(20,10,40,0.2)');
  // stem
  rr(ctx, 12, 14, 8, 10, 3);
  fill(ctx, '#FFF0D6');
  // cap
  ctx.save();
  ctx.translate(16, 14);
  ctx.scale(1 / squash, squash);
  ctx.beginPath();
  ctx.moveTo(-14, 2);
  ctx.quadraticCurveTo(-14, -12, 0, -12);
  ctx.quadraticCurveTo(14, -12, 14, 2);
  ctx.quadraticCurveTo(0, 6, -14, 2);
  ctx.closePath();
  fill(ctx, '#E8556B');
  ctx.beginPath();
  ctx.moveTo(-12, -2);
  ctx.quadraticCurveTo(-10, -9, 0, -9);
  ctx.quadraticCurveTo(10, -9, 12, -2);
  fill(ctx, rgba('#FF9AA8', 0.5));
  for (const [x, y, r] of [[-7, -4, 2.6], [3, -7, 2.2], [7, 0, 2]] as [number, number, number][]) {
    ell(ctx, x, y, r, r * 0.9);
    fill(ctx, '#FFF0D6');
  }
  ctx.restore();
}

export function drawCheckpoint(ctx: Ctx, on: boolean): void {
  // 26x44 post with lantern
  ell(ctx, 13, 42, 9, 2.6);
  fill(ctx, 'rgba(20,10,40,0.22)');
  rr(ctx, 11, 16, 4, 26, 2);
  fill(ctx, '#8B5A2B');
  rr(ctx, 11, 16, 2, 26, 1);
  fill(ctx, '#A9713F');
  // lantern housing
  rr(ctx, 5, 6, 16, 14, 4);
  fill(ctx, on ? '#FFCB4D' : '#6B5A72');
  rr(ctx, 7, 8, 12, 10, 3);
  fill(ctx, on ? rgrad(ctx, 13, 13, 1, 9, [[0, '#FFFBE0'], [1, '#FFC53D']]) : '#4A3D52');
  // glass shine
  ell(ctx, 10, 11, 1.8, 2.4);
  fill(ctx, rgba('#FFFFFF', on ? 0.7 : 0.2));
  // cap
  ctx.beginPath();
  ctx.moveTo(3, 6);
  ctx.lineTo(23, 6);
  ctx.lineTo(13, 1);
  ctx.closePath();
  fill(ctx, on ? '#E8A32C' : '#584A60');
  if (on) {
    ell(ctx, 13, 13, 16, 16);
    fill(ctx, rgrad(ctx, 13, 13, 2, 16, [[0, 'rgba(255,203,77,0.35)'], [1, 'rgba(255,203,77,0)']]));
  }
}

export function drawGoal(ctx: Ctx, frame: number): void {
  // 56x72 magic arch
  const pulse = 0.7 + frame * 0.15;
  ell(ctx, 28, 70, 24, 5);
  fill(ctx, 'rgba(20,10,40,0.22)');
  // arch
  ctx.beginPath();
  ctx.moveTo(6, 70);
  ctx.lineTo(6, 34);
  ctx.quadraticCurveTo(6, 6, 28, 6);
  ctx.quadraticCurveTo(50, 6, 50, 34);
  ctx.lineTo(50, 70);
  ctx.closePath();
  fill(ctx, '#8B5A2B');
  ctx.beginPath();
  ctx.moveTo(11, 70);
  ctx.lineTo(11, 34);
  ctx.quadraticCurveTo(11, 11, 28, 11);
  ctx.quadraticCurveTo(45, 11, 45, 34);
  ctx.lineTo(45, 70);
  ctx.closePath();
  fill(ctx, rgrad(ctx, 28, 40, 2, 34, [[0, `rgba(255,251,224,${pulse})`], [0.5, `rgba(255,203,77,${pulse * 0.8})`], [1, 'rgba(255,154,60,0.5)']]));
  // vines
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(28 + s * 21, 70);
    ctx.quadraticCurveTo(28 + s * 27, 46, 28 + s * 20, 24);
    stroke(ctx, '#4FA96B', 3);
  }
  // seeds floating
  for (let i = 0; i < 4; i++) {
    const a = frame * 0.8 + i * 1.6;
    ell(ctx, 28 + Math.cos(a) * 13, 40 + Math.sin(a) * 20, 2, 2.6);
    fill(ctx, rgba('#FFF8D6', 0.9));
  }
  star(ctx, 28, 14, 6, 5, 0.45);
  fill(ctx, '#FFCB4D');
}

export function drawPushBlock(ctx: Ctx): void {
  rr(ctx, 1, 1, 30, 30, 4);
  fill(ctx, '#7A5A3E');
  rr(ctx, 2, 2, 28, 28, 3);
  fill(ctx, '#9A7550');
  rr(ctx, 5, 5, 22, 22, 2);
  stroke(ctx, rgba('#5E3A1C', 0.6), 2);
  // paw mark
  ell(ctx, 16, 18, 4, 3.4);
  fill(ctx, rgba('#5E3A1C', 0.5));
  for (const [dx, dy] of [[-4, -2.4], [0, -4], [4, -2.4]] as [number, number][]) {
    ell(ctx, 16 + dx, 18 + dy, 1.6, 1.8);
    fill(ctx, rgba('#5E3A1C', 0.5));
  }
}

export function drawBreakable(ctx: Ctx, t: Theme): void {
  ctx.fillStyle = shade(t.groundBody, 0.14);
  ctx.fillRect(0, 0, TILE, TILE);
  // cracks
  const rng = makeRng(4242 + t.key.length);
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    let x = rng() * TILE;
    let y = rng() * TILE;
    ctx.moveTo(x, y);
    for (let k = 0; k < 3; k++) {
      x += (rng() - 0.5) * 12;
      y += (rng() - 0.5) * 12;
      ctx.lineTo(x, y);
    }
    stroke(ctx, rgba(t.groundDark, 0.75), 1.4);
  }
  // moss / glow at edges
  ctx.fillStyle = rgba(t.accent, 0.18);
  ctx.fillRect(0, 0, TILE, 3);
  // outline so it reads as breakable
  stroke(ctx, rgba('#000000', 0.18), 2);
  ctx.strokeRect(1, 1, TILE - 2, TILE - 2);
}

export function drawLantern(ctx: Ctx, on: boolean): void {
  ell(ctx, 12, 40, 8, 2.4);
  fill(ctx, 'rgba(20,10,40,0.22)');
  rr(ctx, 10, 14, 4, 24, 2);
  fill(ctx, '#4A3550');
  rr(ctx, 4, 4, 16, 16, 5);
  fill(ctx, on ? '#FFB84D' : '#5A4A62');
  rr(ctx, 6, 6, 12, 12, 4);
  fill(ctx, on ? rgrad(ctx, 12, 12, 1, 9, [[0, '#FFF6D0'], [1, '#FF9A3C']]) : '#3A2F42');
  ctx.beginPath();
  ctx.moveTo(12, 0);
  ctx.lineTo(16, 4);
  ctx.lineTo(8, 4);
  ctx.closePath();
  fill(ctx, on ? '#E8A32C' : '#4A3550');
  if (on) {
    ell(ctx, 12, 12, 20, 20);
    fill(ctx, rgrad(ctx, 12, 12, 2, 20, [[0, 'rgba(255,154,60,0.3)'], [1, 'rgba(255,154,60,0)']]));
  }
}

export function drawWind(ctx: Ctx, frame: number): void {
  const off = frame * 8;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(4, 26 - i * 9 - off * 0.3);
    ctx.quadraticCurveTo(16, 18 - i * 9 - off * 0.3, 28, 26 - i * 9 - off * 0.3);
    stroke(ctx, rgba('#FFFFFF', 0.5 - i * 0.1), 2.4);
  }
  ctx.beginPath();
  ctx.moveTo(16, 6);
  ctx.lineTo(11, 12);
  ctx.lineTo(21, 12);
  ctx.closePath();
  fill(ctx, rgba('#FFFFFF', 0.6));
}

/* ---------------------------- backgrounds ------------------------------ */

export function drawSky(ctx: Ctx, t: Theme, w: number, h: number): void {
  ctx.fillStyle = vgrad(ctx, 0, 0, w, h, [[0, t.sky[0]], [0.55, t.sky[1]], [1, t.sky[2]]]);
  ctx.fillRect(0, 0, w, h);
  if (t.key === 'meadow' || t.key === 'sky') {
    // sun
    const sx = w * 0.78;
    const sy = h * 0.2;
    ell(ctx, sx, sy, 90, 90);
    fill(ctx, rgrad(ctx, sx, sy, 4, 90, [[0, 'rgba(255,247,214,0.85)'], [0.5, 'rgba(255,240,170,0.28)'], [1, 'rgba(255,240,170,0)']]));
    ell(ctx, sx, sy, 30, 30);
    fill(ctx, '#FFF6D0');
  }
  if (t.key === 'cave') {
    for (let i = 0; i < 40; i++) {
      const x = (i * 137.5) % w;
      const y = (i * 79.3) % h;
      ell(ctx, x, y, 1 + (i % 3) * 0.6, 1 + (i % 3) * 0.6);
      fill(ctx, rgba(t.accent, 0.35));
    }
  }
  if (t.key === 'forest') {
    // moon
    ell(ctx, w * 0.2, h * 0.16, 46, 46);
    fill(ctx, '#F5E8C8');
    ell(ctx, w * 0.2 + 14, h * 0.16 - 8, 40, 40);
    fill(ctx, t.sky[0]);
    for (let i = 0; i < 70; i++) {
      const x = (i * 211.7) % w;
      const y = (i * 53.9) % (h * 0.7);
      const r = 0.7 + (i % 4) * 0.4;
      ell(ctx, x, y, r, r);
      fill(ctx, rgba('#FFFFFF', 0.35 + (i % 5) * 0.1));
    }
  }
}

/** Far layer: big soft silhouettes. */
export function drawFar(ctx: Ctx, t: Theme, w: number, h: number): void {
  const baseY = h * 0.78;

  // clouds sit high in the sky so the upper third is never empty
  if (t.key === 'meadow' || t.key === 'sky' || t.key === 'forest') {
    const rng = makeRng(51 + t.key.length * 13);
    const cloudCol = t.key === 'forest' ? rgba('#B9A8D8', 0.16) : rgba('#FFFFFF', 0.62);
    wrapped(w, (c, ox) => {
      for (let i = 0; i < 7; i++) {
        const x = ox + (i / 7) * w + rng() * 90;
        const y = 24 + rng() * 130;
        const s = 0.65 + rng() * 0.85;
        for (const [dx, dy, r] of [[0, 0, 30], [27, 7, 21], [-29, 9, 19], [9, -13, 17]] as [number, number, number][]) {
          ell(c, x + dx * s, y + dy * s, r * s, r * s * 0.6);
          fill(c, cloudCol);
        }
      }
    }, ctx);
  }

  if (t.key === 'meadow') {
    wrapped(w, (c, ox) => {
      for (const [x, rx, ry, col] of [
        [w * 0.12, 190, 130, t.far],
        [w * 0.42, 240, 160, shade(t.far, -0.06)],
        [w * 0.75, 210, 140, t.far],
        [w * 0.95, 170, 110, shade(t.far, -0.04)]
      ] as [number, number, number, string][]) {
        c.beginPath();
        c.moveTo(ox + x - rx, baseY + 120);
        c.quadraticCurveTo(ox + x - rx * 0.5, baseY - ry, ox + x, baseY - ry);
        c.quadraticCurveTo(ox + x + rx * 0.5, baseY - ry, ox + x + rx, baseY + 120);
        c.closePath();
        fill(c, col);
      }
    }, ctx);
  } else if (t.key === 'cave') {
    wrapped(w, (c, ox) => {
      for (let i = 0; i < 6; i++) {
        const x = ox + (i / 6) * w + 40;
        c.beginPath();
        c.moveTo(x - 90, h);
        c.lineTo(x - 40, h * 0.35 + (i % 3) * 40);
        c.lineTo(x, h * 0.5 + (i % 2) * 30);
        c.lineTo(x + 50, h * 0.3 + (i % 3) * 35);
        c.lineTo(x + 110, h);
        c.closePath();
        fill(c, i % 2 === 0 ? t.far : shade(t.far, -0.08));
      }
    }, ctx);
  } else if (t.key === 'sky') {
    wrapped(w, (c, ox) => {
      for (let i = 0; i < 5; i++) {
        const x = ox + (i / 5) * w + 30;
        const y = h * (0.5 + (i % 3) * 0.07);
        for (const [dx, dy, r] of [[0, 0, 46], [38, 8, 34], [-40, 10, 30], [12, -18, 28]] as [number, number, number][]) {
          ell(c, x + dx, y + dy, r, r * 0.7);
          fill(c, rgba(t.far, 0.85));
        }
      }
    }, ctx);
  } else {
    wrapped(w, (c, ox) => {
      for (let i = 0; i < 7; i++) {
        const x = ox + (i / 7) * w + 20;
        const th = 190 + (i % 3) * 60;
        c.beginPath();
        c.moveTo(x - 14, h);
        c.lineTo(x - 7, h - th);
        c.lineTo(x + 7, h - th);
        c.lineTo(x + 14, h);
        c.closePath();
        fill(c, i % 2 === 0 ? t.far : shade(t.far, -0.06));
        // canopy
        ell(c, x, h - th - 6, 46, 34);
        fill(c, shade(t.far, -0.02));
      }
    }, ctx);
  }
}

/** Mid layer: the recognisable world furniture. */
export function drawMid(ctx: Ctx, t: Theme, w: number, h: number): void {
  const baseY = h * 0.9;
  const rng = makeRng(777 + t.key.length * 31);
  if (t.key === 'meadow') {
    wrapped(w, (c, ox) => {
      // rolling hills
      c.beginPath();
      c.moveTo(ox, baseY + 60);
      for (let x = 0; x <= w; x += 20) {
        c.lineTo(ox + x, baseY - 30 + Math.sin((x / w) * Math.PI * 4) * 34);
      }
      c.lineTo(ox + w, baseY + 60);
      c.closePath();
      fill(c, t.mid);
      // giant sunflowers
      for (let i = 0; i < 7; i++) {
        const x = ox + 50 + i * (w / 7) + rng() * 30;
        const y = baseY - 10 + Math.sin((i / 7) * Math.PI * 4) * 30;
        const stemH = 90 + rng() * 60;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x + 2, y - stemH);
        stroke(c, shade(t.mid, -0.18), 5);
        // head
        const hy = y - stemH;
        for (let p = 0; p < 9; p++) {
          const a = (p / 9) * Math.PI * 2;
          ell(c, x + Math.cos(a) * 17, hy + Math.sin(a) * 17, 9, 6, a);
          fill(c, shade(t.accent, -0.05));
        }
        ell(c, x, hy, 12, 12);
        fill(c, '#6B4A1E');
      }
    }, ctx);
  } else if (t.key === 'cave') {
    wrapped(w, (c, ox) => {
      for (let i = 0; i < 9; i++) {
        const x = ox + 20 + i * (w / 9) + rng() * 40;
        const hh = 60 + rng() * 130;
        // stalactite
        c.beginPath();
        c.moveTo(x - 26, 0);
        c.lineTo(x, hh);
        c.lineTo(x + 26, 0);
        c.closePath();
        fill(c, shade(t.mid, -0.1));
        // glow crystal
        c.beginPath();
        c.moveTo(x + 30, baseY);
        c.lineTo(x + 44, baseY - 60 - rng() * 40);
        c.lineTo(x + 58, baseY);
        c.closePath();
        fill(c, rgba(t.accent, 0.55));
        ell(c, x + 44, baseY - 40, 26, 26);
        fill(c, rgrad(c, x + 44, baseY - 40, 2, 26, [[0, rgba(t.accent, 0.28)], [1, rgba(t.accent, 0)]]));
      }
    }, ctx);
  } else if (t.key === 'sky') {
    wrapped(w, (c, ox) => {
      for (let i = 0; i < 6; i++) {
        const x = ox + 40 + i * (w / 6) + rng() * 40;
        const y = h * (0.55 + (i % 3) * 0.09);
        // floating island
        ell(c, x, y, 62, 22);
        fill(c, shade(t.mid, 0.1));
        c.beginPath();
        c.moveTo(x - 52, y + 8);
        c.quadraticCurveTo(x, y + 90, x + 52, y + 8);
        c.closePath();
        fill(c, shade(t.mid, -0.14));
        ell(c, x, y - 6, 56, 18);
        fill(c, '#9BE07A');
        // berry bushes
        for (let b = 0; b < 3; b++) {
          ell(c, x - 30 + b * 30, y - 14, 9, 9);
          fill(c, shade('#7FD47F', -0.1));
          ell(c, x - 30 + b * 30, y - 18, 4, 4);
          fill(c, t.accent);
        }
      }
    }, ctx);
  } else {
    wrapped(w, (c, ox) => {
      for (let i = 0; i < 8; i++) {
        const x = ox + 30 + i * (w / 8) + rng() * 40;
        const hh = 130 + rng() * 110;
        // crooked trunk
        c.beginPath();
        c.moveTo(x - 12, baseY + 30);
        c.quadraticCurveTo(x - 22, baseY - hh * 0.5, x - 4, baseY - hh);
        c.lineTo(x + 10, baseY - hh);
        c.quadraticCurveTo(x + 2, baseY - hh * 0.5, x + 14, baseY + 30);
        c.closePath();
        fill(c, shade(t.mid, -0.12));
        // bare branches
        for (let b = 0; b < 3; b++) {
          c.beginPath();
          c.moveTo(x, baseY - hh * (0.55 + b * 0.12));
          c.quadraticCurveTo(x + 30, baseY - hh * (0.6 + b * 0.12), x + 46, baseY - hh * (0.7 + b * 0.1));
          stroke(c, shade(t.mid, -0.16), 4);
        }
        // glowing pumpkin
        ell(c, x + 8, baseY - hh + 26, 15, 13);
        fill(c, '#E0762E');
        ell(c, x + 8, baseY - hh + 26, 19, 17);
        fill(c, rgrad(c, x + 8, baseY - hh + 26, 6, 20, [[0, rgba(t.accent, 0.3)], [1, rgba(t.accent, 0)]]));
        c.beginPath();
        c.moveTo(x - 2, baseY - hh + 24);
        c.lineTo(x + 4, baseY - hh + 22);
        c.lineTo(x + 6, baseY - hh + 30);
        c.closePath();
        fill(c, '#2A1030');
        c.beginPath();
        c.moveTo(x + 12, baseY - hh + 24);
        c.lineTo(x + 18, baseY - hh + 22);
        c.lineTo(x + 16, baseY - hh + 30);
        c.closePath();
        fill(c, '#2A1030');
      }
    }, ctx);
  }
}

/** Near layer: foreground detail that scrolls fastest. */
export function drawNear(ctx: Ctx, t: Theme, w: number, h: number): void {
  const baseY = h;
  const rng = makeRng(313 + t.key.length * 17);
  if (t.key === 'meadow') {
    wrapped(w, (c, ox) => {
      for (let i = 0; i < 26; i++) {
        const x = ox + (i / 26) * w + rng() * 20;
        const hh = 40 + rng() * 50;
        for (let b = 0; b < 5; b++) {
          c.beginPath();
          c.moveTo(x + b * 3 - 6, baseY);
          c.quadraticCurveTo(x + b * 3 - 4 + rng() * 6, baseY - hh * 0.6, x + b * 3 - 10 + rng() * 20, baseY - hh);
          stroke(c, rgba(t.near, 0.9), 3);
        }
      }
    }, ctx);
  } else if (t.key === 'cave') {
    wrapped(w, (c, ox) => {
      for (let i = 0; i < 14; i++) {
        const x = ox + (i / 14) * w + rng() * 30;
        const hh = 40 + rng() * 70;
        c.beginPath();
        c.moveTo(x - 20, baseY);
        c.quadraticCurveTo(x - 8, baseY - hh, x, baseY - hh * 1.4);
        c.quadraticCurveTo(x + 10, baseY - hh, x + 22, baseY);
        c.closePath();
        fill(c, rgba(shade(t.near, -0.2), 0.85));
      }
    }, ctx);
  } else if (t.key === 'sky') {
    wrapped(w, (c, ox) => {
      for (let i = 0; i < 8; i++) {
        const x = ox + (i / 8) * w + rng() * 40;
        const y = h - 40 - rng() * 40;
        for (const [dx, dy, r] of [[0, 0, 54], [50, 10, 38], [-48, 12, 34]] as [number, number, number][]) {
          ell(c, x + dx, y + dy, r, r * 0.62);
          fill(c, rgba('#FFFFFF', 0.5));
        }
      }
    }, ctx);
  } else {
    wrapped(w, (c, ox) => {
      for (let i = 0; i < 16; i++) {
        const x = ox + (i / 16) * w + rng() * 30;
        const hh = 50 + rng() * 60;
        c.beginPath();
        c.moveTo(x - 16, baseY);
        c.quadraticCurveTo(x - 4, baseY - hh, x, baseY - hh * 1.2);
        c.quadraticCurveTo(x + 6, baseY - hh, x + 18, baseY);
        c.closePath();
        fill(c, rgba(shade(t.near, -0.25), 0.9));
      }
    }, ctx);
  }
}

/* ----------------------------- particles ------------------------------- */

export function drawDust(ctx: Ctx): void {
  ell(ctx, 8, 8, 7, 7);
  fill(ctx, rgrad(ctx, 8, 8, 1, 7, [[0, 'rgba(255,255,255,0.9)'], [1, 'rgba(255,255,255,0)']]));
}

export function drawSpark(ctx: Ctx): void {
  star(ctx, 8, 8, 7.5, 4, 0.3);
  fill(ctx, rgrad(ctx, 8, 8, 1, 8, [[0, '#FFFFFF'], [1, 'rgba(255,220,120,0)']]));
}

export function drawLeaf(ctx: Ctx, col: string): void {
  ell(ctx, 6, 6, 5.5, 3);
  fill(ctx, col);
}

export function drawZ(ctx: Ctx): void {
  ctx.beginPath();
  ctx.moveTo(3, 3);
  ctx.lineTo(13, 3);
  ctx.lineTo(3, 13);
  ctx.lineTo(13, 13);
  stroke(ctx, 'rgba(255,255,255,0.9)', 2.6);
}

export function drawRing(ctx: Ctx): void {
  ell(ctx, 24, 24, 22, 22);
  stroke(ctx, 'rgba(255,255,255,0.85)', 3);
}
