/** Procedural enemy + boss art. */
import { Ctx, ell, fill, rr, stroke, shade, rgba, rgrad, star, sparkle, groundShadow } from './draw';

/* --------------------------- regular enemies --------------------------- */

export function drawSlime(ctx: Ctx, squash: number): void {
  const w = 13 + squash * 2.5;
  const h = 11 - squash * 2.5;
  groundShadow(ctx, 16, 28, 10, 0.2);
  ctx.beginPath();
  ctx.moveTo(16 - w, 27);
  ctx.quadraticCurveTo(16 - w, 27 - h * 2, 16, 27 - h * 2);
  ctx.quadraticCurveTo(16 + w, 27 - h * 2, 16 + w, 27);
  ctx.quadraticCurveTo(16 + w * 0.6, 28.6, 16, 28.6);
  ctx.quadraticCurveTo(16 - w * 0.6, 28.6, 16 - w, 27);
  ctx.closePath();
  fill(ctx, rgrad(ctx, 12, 14, 1, 20, [[0, '#B6F5C4'], [0.7, '#77D695'], [1, '#4FAE72']]));

  // shine
  ell(ctx, 12, 15, 3.4, 2.4, -0.5);
  fill(ctx, rgba('#FFFFFF', 0.65));

  // eyes
  for (const s of [-1, 1]) {
    ell(ctx, 16 + s * 4.2, 19, 2.6, 3);
    fill(ctx, '#22303A');
    ell(ctx, 15.2 + s * 4.2, 18, 0.9, 1);
    fill(ctx, '#fff');
  }
  ctx.beginPath();
  ctx.arc(16, 23, 2.6, 0.3, Math.PI - 0.3);
  stroke(ctx, '#2E6B4A', 1.2);
  // drip
  ell(ctx, 24, 26.5, 1.8, 2.4);
  fill(ctx, rgba('#77D695', 0.85));
}

export function drawSquirrel(ctx: Ctx, frame: number): void {
  const bob = frame === 0 ? 0 : 1;
  groundShadow(ctx, 18, 33, 9, 0.2);
  // tail
  ctx.beginPath();
  ctx.moveTo(27, 30);
  ctx.quadraticCurveTo(37, 30, 36, 18);
  ctx.quadraticCurveTo(35, 8, 27, 9);
  ctx.quadraticCurveTo(31, 14, 30, 20);
  ctx.quadraticCurveTo(29, 26, 24, 28);
  ctx.closePath();
  fill(ctx, '#C4853A');
  ctx.beginPath();
  ctx.moveTo(28.5, 27);
  ctx.quadraticCurveTo(34, 26, 33.4, 17);
  ctx.quadraticCurveTo(33, 11, 28.6, 11);
  stroke(ctx, '#E3A455', 2.4);

  // body
  ell(ctx, 18, 25 + bob, 9.5, 8.5);
  fill(ctx, '#B5713A');
  ell(ctx, 18, 27 + bob, 6, 5);
  fill(ctx, '#F0CFA8');
  // head
  ell(ctx, 15, 15 + bob, 8.4, 7.6);
  fill(ctx, '#C4853A');
  // ears
  ell(ctx, 10, 8.5 + bob, 2.6, 3);
  fill(ctx, '#A96C2C');
  ell(ctx, 19, 8 + bob, 2.6, 3);
  fill(ctx, '#A96C2C');
  // muzzle
  ell(ctx, 14, 18.5 + bob, 5, 3.6);
  fill(ctx, '#F5DDBE');
  ell(ctx, 14, 16.6 + bob, 1.6, 1.2);
  fill(ctx, '#5A3222');
  // angry eyes
  for (const s of [-1, 1]) {
    ell(ctx, 15 + s * 3.4, 13.5 + bob, 2.2, 2.6);
    fill(ctx, '#2B1B2E');
    ell(ctx, 14.3 + s * 3.4, 12.7 + bob, 0.8, 0.8);
    fill(ctx, '#fff');
  }
  ctx.beginPath();
  ctx.moveTo(11.5, 10.4 + bob);
  ctx.lineTo(17, 12 + bob);
  stroke(ctx, '#7A4A1E', 1.5);
  ctx.beginPath();
  ctx.moveTo(18.5, 10.4 + bob);
  ctx.lineTo(15.5, 12 + bob);
  stroke(ctx, '#7A4A1E', 1.5);
  // acorn in paws
  ell(ctx, 24, 24 + bob, 4.2, 4.4);
  fill(ctx, '#8B5A2B');
  ell(ctx, 24, 21.4 + bob, 4.4, 2.4);
  fill(ctx, '#5E3A1C');
  ctx.beginPath();
  ctx.moveTo(24, 19);
  ctx.lineTo(24, 20.4);
  stroke(ctx, '#3F2410', 1.4);
  // feet
  ell(ctx, 13, 33, 3.4, 2);
  fill(ctx, '#A96C2C');
  ell(ctx, 21, 33, 3.4, 2);
  fill(ctx, '#A96C2C');
}

export function drawBeetle(ctx: Ctx, frame: number): void {
  groundShadow(ctx, 17, 26, 10, 0.2);
  const legY = frame === 0 ? 0 : 1.2;
  // legs
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const lx = 17 + s * (7 + i * 2.2);
      ctx.beginPath();
      ctx.moveTo(lx, 20);
      ctx.lineTo(lx + s * 3, 25 + (i % 2 === 0 ? legY : -legY));
      stroke(ctx, '#2E3550', 1.8);
    }
  }
  // shell
  ell(ctx, 17, 17, 11, 9);
  fill(ctx, '#4A5AA8');
  ell(ctx, 17, 16, 9.6, 7.4);
  fill(ctx, rgrad(ctx, 13, 12, 1, 14, [[0, '#7E90E0'], [1, '#3B4784']]));
  // seam
  ctx.beginPath();
  ctx.moveTo(17, 9.5);
  ctx.lineTo(17, 24);
  stroke(ctx, '#2A3363', 1.4);
  // shine
  ell(ctx, 12, 12.5, 3, 2, -0.6);
  fill(ctx, rgba('#FFFFFF', 0.5));
  // head
  ell(ctx, 17, 24.5, 6.4, 4.4);
  fill(ctx, '#2E3550');
  // horn
  ctx.beginPath();
  ctx.moveTo(17, 22);
  ctx.lineTo(13.5, 14);
  ctx.lineTo(20.5, 14);
  ctx.closePath();
  fill(ctx, '#8A96D8');
  // eyes
  for (const s of [-1, 1]) {
    ell(ctx, 17 + s * 3.4, 24, 1.7, 1.9);
    fill(ctx, '#FFD34E');
    ell(ctx, 17 + s * 3.4, 24, 0.8, 0.9);
    fill(ctx, '#2B1B2E');
  }
}

export function drawBat(ctx: Ctx, frame: number): void {
  const up = frame === 0;
  const wy = up ? -6 : 3;
  ctx.save();
  ctx.translate(18, 14);
  // wings
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * 3, -1);
    ctx.quadraticCurveTo(s * 11, wy - 4, s * 16, wy + 1);
    ctx.quadraticCurveTo(s * 12, wy + 3, s * 12, wy + 7);
    ctx.quadraticCurveTo(s * 8, wy + 4, s * 3, wy + 7);
    ctx.closePath();
    fill(ctx, '#8A6BB5');
    ctx.beginPath();
    ctx.moveTo(s * 4, 0);
    ctx.quadraticCurveTo(s * 10, wy - 1, s * 14, wy + 1.5);
    stroke(ctx, rgba('#C4A8E8', 0.7), 1.4);
  }
  // body
  ell(ctx, 0, 3, 6.6, 7);
  fill(ctx, '#6E4E96');
  // ears
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * 2.6, -3);
    ctx.lineTo(s * 5.4, -9.6);
    ctx.lineTo(s * 6.4, -2);
    ctx.closePath();
    fill(ctx, '#6E4E96');
  }
  // eyes
  for (const s of [-1, 1]) {
    ell(ctx, s * 2.6, 2, 1.9, 2.2);
    fill(ctx, '#FFE066');
    ell(ctx, s * 2.6, 2, 0.85, 1);
    fill(ctx, '#2B1B2E');
  }
  // fangs
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * 1.2, 6.4);
    ctx.lineTo(s * 2, 8.6);
    ctx.lineTo(s * 2.9, 6.4);
    ctx.closePath();
    fill(ctx, '#FFF7E8');
  }
  ctx.restore();
}

export function drawBird(ctx: Ctx, frame: number): void {
  const flap = frame === 0 ? -1 : 1;
  ctx.save();
  ctx.translate(17, 16);
  // tail
  ctx.beginPath();
  ctx.moveTo(-6, 4);
  ctx.lineTo(-15, 0);
  ctx.lineTo(-14, 5);
  ctx.lineTo(-6, 7);
  ctx.closePath();
  fill(ctx, '#3FB0C4');
  // wing back
  ctx.beginPath();
  ctx.moveTo(-1, 0);
  ctx.quadraticCurveTo(-9, -8 * flap, -14, -2 * flap);
  ctx.quadraticCurveTo(-8, 4, -1, 4);
  ctx.closePath();
  fill(ctx, '#4FC4D8');
  // body
  ell(ctx, 0, 2, 7.4, 6.6);
  fill(ctx, '#5AC8D8');
  ell(ctx, 0, 5, 4.6, 3.6);
  fill(ctx, '#D8F7FF');
  // wing front
  ctx.beginPath();
  ctx.moveTo(1, 0);
  ctx.quadraticCurveTo(6, -9 * flap, 12, -3 * flap);
  ctx.quadraticCurveTo(7, 3, 2, 4);
  ctx.closePath();
  fill(ctx, '#7FE0EC');
  // head
  ell(ctx, 3, -4, 5.4, 5);
  fill(ctx, '#5AC8D8');
  // bandit mask
  ctx.beginPath();
  ctx.moveTo(-1, -6);
  ctx.lineTo(8, -6);
  ctx.lineTo(8, -2.6);
  ctx.lineTo(-1, -2.6);
  ctx.closePath();
  fill(ctx, '#2B1B2E');
  // eyes
  for (const s of [0, 1]) {
    ell(ctx, 0.4 + s * 4, -4.4, 1.5, 1.7);
    fill(ctx, '#FFF7E8');
    ell(ctx, 0.6 + s * 4, -4.4, 0.75, 0.85);
    fill(ctx, '#2B1B2E');
  }
  // beak
  ctx.beginPath();
  ctx.moveTo(8, -3.4);
  ctx.lineTo(13.5, -1.6);
  ctx.lineTo(8, 0.2);
  ctx.closePath();
  fill(ctx, '#FFB84D');
  // feet
  ctx.beginPath();
  ctx.moveTo(-1, 8);
  ctx.lineTo(-1, 11);
  ctx.moveTo(3, 8);
  ctx.lineTo(3, 11);
  stroke(ctx, '#FFB84D', 1.6);
  ctx.restore();
}

export function drawWisp(ctx: Ctx, frame: number): void {
  const t = frame / 3;
  const cx = 14;
  const cy = 14;
  // glow
  ell(ctx, cx, cy, 12, 12);
  fill(ctx, rgrad(ctx, cx, cy, 2, 12, [[0, 'rgba(180,255,240,0.55)'], [1, 'rgba(120,230,220,0)']]));
  // flame tail
  ctx.beginPath();
  ctx.moveTo(cx - 4, cy + 4);
  ctx.quadraticCurveTo(cx - 2 + t * 3, cy + 12, cx + 1, cy + 13 - t * 2);
  ctx.quadraticCurveTo(cx + 4, cy + 9, cx + 4, cy + 4);
  ctx.closePath();
  fill(ctx, rgba('#7FF0DC', 0.75));
  // core
  ell(ctx, cx, cy, 7.4, 7.8);
  fill(ctx, rgrad(ctx, cx - 2, cy - 3, 1, 9, [[0, '#EAFFFA'], [0.55, '#8FE8DA'], [1, '#4FC4B4']]));
  // eyes
  for (const s of [-1, 1]) {
    ell(ctx, cx + s * 2.8, cy - 0.5, 1.6, 2);
    fill(ctx, '#1E4A48');
    ell(ctx, cx + s * 2.8 - 0.4, cy - 1.3, 0.6, 0.7);
    fill(ctx, '#fff');
  }
  sparkle(ctx, cx + 9, cy - 8, 2.6, rgba('#DFFFF8', 0.9));
}

/* ------------------------------- bosses -------------------------------- */

const B = 144;

export function drawBossSquirrel(ctx: Ctx): void {
  groundShadow(ctx, 72, 132, 42, 0.24);
  // tail
  ctx.beginPath();
  ctx.moveTo(96, 118);
  ctx.quadraticCurveTo(140, 116, 134, 62);
  ctx.quadraticCurveTo(128, 18, 92, 24);
  ctx.quadraticCurveTo(112, 44, 108, 74);
  ctx.quadraticCurveTo(104, 100, 84, 110);
  ctx.closePath();
  fill(ctx, '#B5713A');
  ctx.beginPath();
  ctx.moveTo(100, 108);
  ctx.quadraticCurveTo(128, 100, 124, 60);
  ctx.quadraticCurveTo(120, 34, 96, 34);
  stroke(ctx, '#E3A455', 6);
  ctx.beginPath();
  ctx.moveTo(104, 100);
  ctx.quadraticCurveTo(120, 92, 118, 66);
  stroke(ctx, '#F5C57E', 3);

  // body
  ell(ctx, 72, 100, 40, 34);
  fill(ctx, '#B5713A');
  ell(ctx, 72, 106, 27, 23);
  fill(ctx, '#F0CFA8');

  // feet
  ell(ctx, 44, 130, 16, 8);
  fill(ctx, '#A96C2C');
  ell(ctx, 100, 130, 16, 8);
  fill(ctx, '#A96C2C');

  // head
  ell(ctx, 66, 52, 34, 31);
  fill(ctx, '#C4853A');
  ell(ctx, 64, 54, 26, 22);
  fill(ctx, '#E3A455');
  // ears
  for (const s of [-1, 1]) {
    ell(ctx, 66 + s * 24, 24, 9, 11);
    fill(ctx, '#A96C2C');
    ell(ctx, 66 + s * 24, 25, 5, 6.5);
    fill(ctx, '#E8B08A');
  }
  // muzzle
  ell(ctx, 64, 64, 18, 13);
  fill(ctx, '#F5DDBE');
  ell(ctx, 64, 57, 6, 4.6);
  fill(ctx, '#5A3222');
  // buck teeth
  rr(ctx, 59, 70, 10, 9, 2);
  fill(ctx, '#FFF7E8');
  ctx.beginPath();
  ctx.moveTo(64, 70);
  ctx.lineTo(64, 79);
  stroke(ctx, '#D9C4A8', 1.4);
  // angry eyes
  for (const s of [-1, 1]) {
    ell(ctx, 64 + s * 13, 48, 7.4, 8.4);
    fill(ctx, '#FFF7E8');
    ell(ctx, 64 + s * 14, 49, 4.4, 5.2);
    fill(ctx, '#2B1B2E');
    ell(ctx, 62 + s * 14, 46, 1.8, 2);
    fill(ctx, '#fff');
  }
  ctx.beginPath();
  ctx.moveTo(48, 38);
  ctx.lineTo(60, 42);
  ctx.moveTo(80, 38);
  ctx.lineTo(68, 42);
  stroke(ctx, '#7A4A1E', 4);

  // crown
  ctx.beginPath();
  ctx.moveTo(46, 24);
  ctx.lineTo(52, 8);
  ctx.lineTo(60, 18);
  ctx.lineTo(66, 4);
  ctx.lineTo(74, 18);
  ctx.lineTo(82, 8);
  ctx.lineTo(88, 24);
  ctx.closePath();
  fill(ctx, '#FFCB4D');
  ctx.beginPath();
  ctx.moveTo(46, 24);
  ctx.lineTo(88, 24);
  stroke(ctx, '#E8A32C', 3);
  star(ctx, 66, 15, 4, 5, 0.45);
  fill(ctx, '#FFF3A8');

  // giant acorn
  ell(ctx, 108, 96, 15, 16);
  fill(ctx, '#8B5A2B');
  ell(ctx, 108, 84, 16, 8);
  fill(ctx, '#5E3A1C');
  ctx.beginPath();
  ctx.moveTo(108, 74);
  ctx.lineTo(108, 82);
  stroke(ctx, '#3F2410', 3);
}

export function drawBossToad(ctx: Ctx): void {
  groundShadow(ctx, 72, 130, 46, 0.24);
  // back crystals
  const crystals: [number, number, number][] = [
    [40, 74, 16], [58, 62, 20], [80, 58, 17], [100, 68, 14], [30, 92, 11], [112, 88, 10]
  ];
  for (const [x, y, h] of crystals) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 7, y - h);
    ctx.lineTo(x + 14, y);
    ctx.closePath();
    fill(ctx, rgrad(ctx, x + 7, y - h * 0.4, 1, h, [[0, '#DFFBFF'], [0.6, '#7DE3F5'], [1, '#3E9FB8']]));
    ctx.beginPath();
    ctx.moveTo(x + 7, y - h);
    ctx.lineTo(x + 11, y - h * 0.3);
    ctx.lineTo(x + 14, y);
    stroke(ctx, rgba('#FFFFFF', 0.6), 1.6);
  }
  // body
  ell(ctx, 72, 100, 44, 30);
  fill(ctx, '#7A5AA8');
  ell(ctx, 72, 108, 32, 19);
  fill(ctx, '#C9B3E0');
  // legs
  for (const s of [-1, 1]) {
    ell(ctx, 72 + s * 38, 122, 13, 9);
    fill(ctx, '#6E4E96');
    ell(ctx, 72 + s * 44, 126, 8, 5);
    fill(ctx, '#5C3F80');
  }
  // head / wide mouth
  ell(ctx, 72, 66, 40, 26);
  fill(ctx, '#8A6BB5');
  // eyes on top
  for (const s of [-1, 1]) {
    ell(ctx, 72 + s * 24, 44, 13, 12);
    fill(ctx, '#8A6BB5');
    ell(ctx, 72 + s * 24, 45, 9, 8.4);
    fill(ctx, '#FFF3D6');
    ell(ctx, 72 + s * 24, 46, 4.6, 5.6);
    fill(ctx, '#2B1B2E');
    ell(ctx, 70 + s * 24, 43, 1.9, 2.2);
    fill(ctx, '#fff');
  }
  // mouth
  ctx.beginPath();
  ctx.moveTo(34, 72);
  ctx.quadraticCurveTo(72, 100, 110, 72);
  ctx.quadraticCurveTo(72, 86, 34, 72);
  ctx.closePath();
  fill(ctx, '#3A2342');
  ctx.beginPath();
  ctx.moveTo(44, 76);
  ctx.quadraticCurveTo(72, 92, 100, 76);
  stroke(ctx, '#F58AC8', 3);
  // nostrils
  for (const s of [-1, 1]) {
    ell(ctx, 72 + s * 6, 62, 2, 1.5);
    fill(ctx, '#4A2F63');
  }
  sparkle(ctx, 120, 40, 6, rgba('#DFFBFF', 0.85));
  sparkle(ctx, 22, 52, 5, rgba('#DFFBFF', 0.7));
}

export function drawBossBird(ctx: Ctx): void {
  // storm cloud
  for (const [x, y, r] of [[40, 118, 22], [64, 124, 26], [92, 120, 22], [112, 126, 17]] as [number, number, number][]) {
    ell(ctx, x, y, r, r * 0.8);
    fill(ctx, '#6E6E96');
  }
  // wings
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(72 + s * 8, 60);
    ctx.quadraticCurveTo(72 + s * 60, 30, 72 + s * 66, 78);
    ctx.quadraticCurveTo(72 + s * 50, 70, 72 + s * 44, 92);
    ctx.quadraticCurveTo(72 + s * 30, 74, 72 + s * 8, 78);
    ctx.closePath();
    fill(ctx, s < 0 ? '#3A7FA8' : '#4A94C0');
    ctx.beginPath();
    ctx.moveTo(72 + s * 14, 66);
    ctx.quadraticCurveTo(72 + s * 48, 44, 72 + s * 58, 78);
    stroke(ctx, rgba('#9FE0FF', 0.5), 3);
  }
  // body
  ell(ctx, 72, 84, 26, 28);
  fill(ctx, '#4A94C0');
  ell(ctx, 72, 94, 16, 17);
  fill(ctx, '#D8F0FF');
  // tail
  ctx.beginPath();
  ctx.moveTo(66, 108);
  ctx.lineTo(52, 130);
  ctx.lineTo(64, 126);
  ctx.lineTo(70, 134);
  ctx.lineTo(78, 110);
  ctx.closePath();
  fill(ctx, '#3A7FA8');
  // head
  ell(ctx, 72, 50, 22, 20);
  fill(ctx, '#5AA8D8');
  // crest
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(66 + i * 6, 32);
    ctx.lineTo(62 + i * 8, 16);
    ctx.lineTo(72 + i * 6, 30);
    ctx.closePath();
    fill(ctx, '#FFD34E');
  }
  // eyes
  for (const s of [-1, 1]) {
    ell(ctx, 72 + s * 8, 46, 6, 6.6);
    fill(ctx, '#FFF3D6');
    ell(ctx, 72 + s * 9, 47, 3.2, 3.8);
    fill(ctx, '#2B1B2E');
    ell(ctx, 70 + s * 9, 44, 1.4, 1.5);
    fill(ctx, '#fff');
  }
  // beak
  ctx.beginPath();
  ctx.moveTo(72, 54);
  ctx.lineTo(92, 62);
  ctx.lineTo(72, 70);
  ctx.closePath();
  fill(ctx, '#FFB84D');
  ctx.beginPath();
  ctx.moveTo(72, 62);
  ctx.lineTo(88, 62);
  stroke(ctx, '#E08A22', 2);
  // lightning
  ctx.beginPath();
  ctx.moveTo(112, 100);
  ctx.lineTo(104, 112);
  ctx.lineTo(110, 112);
  ctx.lineTo(102, 128);
  stroke(ctx, '#FFE066', 2.6);
}

export function drawBossPumpkin(ctx: Ctx): void {
  // aura
  ell(ctx, 72, 76, 62, 60);
  fill(ctx, rgrad(ctx, 72, 76, 20, 64, [[0, 'rgba(255,154,60,0.18)'], [1, 'rgba(255,154,60,0)']]));
  groundShadow(ctx, 72, 132, 40, 0.3);
  // vine arms
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(72 + s * 34, 78);
    ctx.quadraticCurveTo(72 + s * 62, 70, 72 + s * 56, 40);
    ctx.quadraticCurveTo(72 + s * 52, 24, 72 + s * 40, 28);
    stroke(ctx, '#3E7A4A', 7);
    ctx.beginPath();
    ctx.moveTo(72 + s * 56, 40);
    ctx.lineTo(72 + s * 64, 32);
    stroke(ctx, '#5AA86B', 5);
  }
  // body (pumpkin)
  for (const [x, rx] of [[44, 20], [72, 24], [100, 20]] as [number, number][]) {
    ell(ctx, x, 84, rx, 36);
    fill(ctx, x === 72 ? '#F58A3C' : '#E0762E');
  }
  // ridges
  for (const x of [58, 86]) {
    ctx.beginPath();
    ctx.moveTo(x, 50);
    ctx.quadraticCurveTo(x + 3, 84, x, 118);
    stroke(ctx, rgba('#B8551C', 0.55), 3);
  }
  // stem
  rr(ctx, 66, 40, 12, 14, 4);
  fill(ctx, '#3E7A4A');
  ctx.beginPath();
  ctx.moveTo(72, 42);
  ctx.quadraticCurveTo(80, 30, 92, 34);
  stroke(ctx, '#5AA86B', 4);
  // carved face
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(72 + s * 14, 62);
    ctx.lineTo(72 + s * 30, 58);
    ctx.lineTo(72 + s * 30, 74);
    ctx.lineTo(72 + s * 14, 78);
    ctx.closePath();
    fill(ctx, '#2A1030');
    ell(ctx, 72 + s * 20, 70, 4.4, 5);
    fill(ctx, '#6FE8D8');
  }
  // mouth
  ctx.beginPath();
  ctx.moveTo(50, 96);
  ctx.lineTo(58, 104);
  ctx.lineTo(66, 94);
  ctx.lineTo(74, 104);
  ctx.lineTo(82, 94);
  ctx.lineTo(90, 104);
  ctx.lineTo(94, 96);
  ctx.quadraticCurveTo(72, 118, 50, 96);
  ctx.closePath();
  fill(ctx, '#2A1030');
  ell(ctx, 72, 102, 9, 6);
  fill(ctx, rgba('#FF9A3C', 0.6));
  // floating flames
  for (const [x, y, r] of [[30, 50, 7], [114, 56, 6], [24, 96, 5]] as [number, number, number][]) {
    ell(ctx, x, y, r, r * 1.5);
    fill(ctx, rgba('#6FE8D8', 0.35));
    ell(ctx, x, y + 2, r * 0.55, r);
    fill(ctx, '#6FE8D8');
  }
}
