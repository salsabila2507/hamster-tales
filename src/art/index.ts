/** Builds every texture the game uses, straight into the Phaser cache. */
import Phaser from 'phaser';
import { Ctx, canvas, ctxOf, ell, fill, rr, stroke, star, sparkle, rgba, rgrad } from './draw';
import { THEMES, Theme } from './palette';
import { HAM, drawHamster, drawHamsterBall, drawSnail, drawFrog, drawOwl, HamOpts } from './characters';
import {
  drawSlime, drawSquirrel, drawBeetle, drawBat, drawBird, drawWisp,
  drawBossSquirrel, drawBossToad, drawBossBird, drawBossPumpkin
} from './enemies';
import {
  drawGroundTop, drawGroundBody, drawPlatform, drawSpike, drawWater,
  drawSeed, drawCoin, drawBerry, drawTreasure, drawChest, drawMushroom,
  drawCheckpoint, drawGoal, drawPushBlock, drawBreakable, drawLantern, drawWind,
  drawSky, drawFar, drawMid, drawNear,
  drawDust, drawSpark, drawLeaf, drawZ, drawRing
} from './world';

type Draw = (ctx: Ctx) => void;

export function addImage(scene: Phaser.Scene, key: string, w: number, h: number, draw: Draw): void {
  if (scene.textures.exists(key)) return;
  const cv = canvas(w, h);
  const c = ctxOf(cv);
  c.save();
  draw(c);
  c.restore();
  const tex = scene.textures.addCanvas(key, cv);
  if (!tex) throw new Error('texture failed: ' + key);
}

export function addSheet(
  scene: Phaser.Scene, key: string, fw: number, fh: number, count: number,
  draw: (ctx: Ctx, i: number) => void
): void {
  if (scene.textures.exists(key)) return;
  const cv = canvas(fw * count, fh);
  const c = ctxOf(cv);
  for (let i = 0; i < count; i++) {
    c.save();
    c.translate(i * fw, 0);
    draw(c, i);
    c.restore();
  }
  const tex = scene.textures.addCanvas(key, cv);
  if (!tex) throw new Error('sheet failed: ' + key);
  for (let i = 0; i < count; i++) tex.add(i, 0, i * fw, 0, fw, fh);
}

export const HAM_ANIMS: Record<string, { sheet: string; frames: number; rate: number; repeat: number }> = {
  'ham-idle': { sheet: 'ham-idle', frames: 6, rate: 6, repeat: -1 },
  'ham-run': { sheet: 'ham-run', frames: 8, rate: 14, repeat: -1 },
  'ham-jump': { sheet: 'ham-jump', frames: 1, rate: 1, repeat: 0 },
  'ham-fall': { sheet: 'ham-fall', frames: 1, rate: 1, repeat: 0 },
  'ham-double': { sheet: 'ham-double', frames: 1, rate: 1, repeat: 0 },
  'ham-roll': { sheet: 'ham-roll', frames: 6, rate: 18, repeat: -1 },
  'ham-land': { sheet: 'ham-land', frames: 2, rate: 14, repeat: 0 },
  'ham-eat': { sheet: 'ham-eat', frames: 4, rate: 8, repeat: 0 },
  'ham-hurt': { sheet: 'ham-hurt', frames: 1, rate: 1, repeat: 0 },
  'ham-sleep': { sheet: 'ham-sleep', frames: 2, rate: 2, repeat: -1 },
  'ham-climb': { sheet: 'ham-climb', frames: 4, rate: 10, repeat: -1 },
  'ham-push': { sheet: 'ham-push', frames: 2, rate: 6, repeat: -1 },
  'ham-throw': { sheet: 'ham-throw', frames: 3, rate: 16, repeat: 0 },
  'ham-cheer': { sheet: 'ham-cheer', frames: 4, rate: 10, repeat: -1 },
  'ham-dash': { sheet: 'ham-dash', frames: 1, rate: 1, repeat: 0 }
};

function hamsterSheets(scene: Phaser.Scene): void {
  const idle = (i: number): HamOpts => {
    const bobs = [0, -0.6, -1.0, -0.5, 0, 0.3];
    return { bob: bobs[i], blink: i === 4 ? 1 : 0, scarf: i * 0.8, mouth: 'smile' };
  };
  addSheet(scene, 'ham-idle', HAM, HAM, 6, (c, i) => drawHamster(c, idle(i)));

  addSheet(scene, 'ham-run', HAM, HAM, 8, (c, i) => {
    drawHamster(c, {
      bob: Math.sin((i / 8) * Math.PI * 2) * 1.5,
      legPhase: i / 8,
      lean: 1.2,
      arms: i % 2 === 0 ? 'down' : 'front',
      mouth: 'smile',
      scarf: i * 1.1
    });
  });

  addSheet(scene, 'ham-jump', HAM, HAM, 1, (c) =>
    drawHamster(c, { bob: -1.5, arms: 'up', mouth: 'o', squash: 1.08, scarf: 1.4, legPhase: 0.25 }));

  addSheet(scene, 'ham-fall', HAM, HAM, 1, (c) =>
    drawHamster(c, { bob: 0.5, arms: 'spread', mouth: 'o', squash: 1.1, scarf: 2.2, legPhase: 0.7 }));

  addSheet(scene, 'ham-double', HAM, HAM, 1, (c) =>
    drawHamster(c, { bob: -1, arms: 'spread', mouth: 'grin', squash: 0.95, scarf: 2.8, legPhase: 0.4 }));

  addSheet(scene, 'ham-roll', HAM, HAM, 6, (c, i) => drawHamsterBall(c, i, 6));

  addSheet(scene, 'ham-land', HAM, HAM, 2, (c, i) =>
    drawHamster(c, { squash: i === 0 ? 0.84 : 0.95, bob: i === 0 ? 2 : 0.8, arms: 'down', mouth: 'o', cheek: 0.6 }));

  addSheet(scene, 'ham-eat', HAM, HAM, 4, (c, i) =>
    drawHamster(c, { cheek: [0.2, 0.6, 0.95, 0.75][i], mouth: i > 1 ? 'open' : 'smile', arms: 'front', bob: i * 0.3 }));

  addSheet(scene, 'ham-hurt', HAM, HAM, 1, (c) =>
    drawHamster(c, { hurt: true, mouth: 'o', bob: -1, arms: 'up', tilt: 0.12 }));

  addSheet(scene, 'ham-sleep', HAM, HAM, 2, (c, i) =>
    drawHamster(c, { sleep: true, bob: i === 0 ? 1.4 : 2.2, mouth: 'flat', arms: 'tuck', cheek: 0.3 }));

  addSheet(scene, 'ham-climb', HAM, HAM, 4, (c, i) =>
    drawHamster(c, { arms: i % 2 === 0 ? 'up' : 'down', legPhase: i / 4, bob: Math.sin(i) * 0.8, mouth: 'smile' }));

  addSheet(scene, 'ham-push', HAM, HAM, 2, (c, i) =>
    drawHamster(c, { lean: 2.4, arms: 'front', mouth: 'flat', bob: i === 0 ? 0 : 0.6, legPhase: i * 0.5 }));

  addSheet(scene, 'ham-throw', HAM, HAM, 3, (c, i) =>
    drawHamster(c, { arms: i === 0 ? 'front' : 'spread', mouth: i === 1 ? 'open' : 'smile', bob: i === 1 ? -1 : 0, lean: 1 }));

  addSheet(scene, 'ham-cheer', HAM, HAM, 4, (c, i) =>
    drawHamster(c, { arms: 'up', mouth: 'grin', bob: [0, -2, -1, -2][i], scarf: i * 1.6, cheek: 0.5 }));

  addSheet(scene, 'ham-dash', HAM, HAM, 1, (c) => {
    // speed lines behind the hamster
    for (let i = 0; i < 4; i++) {
      c.beginPath();
      c.moveTo(2, 18 + i * 5);
      c.lineTo(11 - i * 1.5, 18 + i * 5);
      stroke(c, 'rgba(255,255,255,0.55)', 2 - i * 0.3);
    }
    drawHamster(c, { lean: 3.6, arms: 'spread', mouth: 'grin', squash: 1.1, bob: -1, scarf: 3.4, legPhase: 0.5 });
  });
}

function enemySheets(scene: Phaser.Scene): void {
  addSheet(scene, 'e-slime', 32, 32, 2, (c, i) => drawSlime(c, i === 0 ? 0 : 1));
  addSheet(scene, 'e-squirrel', 40, 36, 2, (c, i) => drawSquirrel(c, i));
  addSheet(scene, 'e-beetle', 34, 30, 2, (c, i) => drawBeetle(c, i));
  addSheet(scene, 'e-bat', 36, 30, 2, (c, i) => drawBat(c, i));
  addSheet(scene, 'e-bird', 36, 32, 2, (c, i) => drawBird(c, i));
  addSheet(scene, 'e-wisp', 28, 30, 4, (c, i) => drawWisp(c, i));

  addImage(scene, 'b-squirrel', 144, 144, (c) => drawBossSquirrel(c));
  addImage(scene, 'b-toad', 144, 144, (c) => drawBossToad(c));
  addImage(scene, 'b-bird', 144, 144, (c) => drawBossBird(c));
  addImage(scene, 'b-pumpkin', 144, 144, (c) => drawBossPumpkin(c));
}

function npcSheets(scene: Phaser.Scene): void {
  addSheet(scene, 'npc-snail', 40, 40, 2, (c, i) => drawSnail(c, i === 0 ? 0 : 1));
  addSheet(scene, 'npc-frog', 40, 40, 2, (c, i) => drawFrog(c, i === 0 ? 0 : 1.4));
  addSheet(scene, 'npc-owl', 40, 40, 2, (c, i) => drawOwl(c, i === 0 ? 0 : 1.2));
}

function tileSheets(scene: Phaser.Scene): void {
  for (const key of Object.keys(THEMES)) {
    const t: Theme = THEMES[key];
    for (let v = 0; v < 5; v++) {
      addImage(scene, `tile-${key}-top-${v}`, 32, 32, (c) => drawGroundTop(c, t, v));
      addImage(scene, `tile-${key}-body-${v}`, 32, 32, (c) => drawGroundBody(c, t, v));
    }
    addImage(scene, `tile-${key}-platform`, 32, 16, (c) => drawPlatform(c, t));
    addImage(scene, `tile-${key}-spike`, 32, 16, (c) => drawSpike(c, t));
    addImage(scene, `tile-${key}-breakable`, 32, 32, (c) => drawBreakable(c, t));
    addSheet(scene, `tile-${key}-water`, 32, 32, 3, (c, i) => drawWater(c, t, i));
  }
}

function propSheets(scene: Phaser.Scene): void {
  addSheet(scene, 'p-seed', 18, 18, 2, (c, i) => drawSeed(c, i));
  addSheet(scene, 'p-coin', 20, 20, 2, (c, i) => drawCoin(c, i));
  addSheet(scene, 'p-berry', 18, 20, 2, (c, i) => drawBerry(c, i));
  addImage(scene, 'p-treasure', 26, 26, (c) => drawTreasure(c, 0));
  addImage(scene, 'p-chest', 30, 26, (c) => drawChest(c, false));
  addImage(scene, 'p-chest-open', 30, 26, (c) => drawChest(c, true));
  addSheet(scene, 'p-mushroom', 32, 28, 2, (c, i) => drawMushroom(c, i));
  addImage(scene, 'p-checkpoint-off', 26, 44, (c) => drawCheckpoint(c, false));
  addImage(scene, 'p-checkpoint-on', 26, 44, (c) => drawCheckpoint(c, true));
  addSheet(scene, 'p-goal', 56, 72, 2, (c, i) => drawGoal(c, i));
  addImage(scene, 'p-pushblock', 32, 32, (c) => drawPushBlock(c));
  addImage(scene, 'p-lantern-off', 24, 42, (c) => drawLantern(c, false));
  addImage(scene, 'p-lantern-on', 24, 42, (c) => drawLantern(c, true));
  addSheet(scene, 'p-wind', 32, 32, 2, (c, i) => drawWind(c, i));
}

function bgSheets(scene: Phaser.Scene): void {
  for (const key of Object.keys(THEMES)) {
    const t: Theme = THEMES[key];
    addImage(scene, `bg-${key}-sky`, 960, 540, (c) => drawSky(c, t, 960, 540));
    addImage(scene, `bg-${key}-far`, 1280, 420, (c) => drawFar(c, t, 1280, 420));
    addImage(scene, `bg-${key}-mid`, 1280, 460, (c) => drawMid(c, t, 1280, 460));
    addImage(scene, `bg-${key}-near`, 1280, 300, (c) => drawNear(c, t, 1280, 300));
  }
}

function particleSheets(scene: Phaser.Scene): void {
  addImage(scene, 'p-dust', 16, 16, (c) => drawDust(c));
  addImage(scene, 'p-spark', 16, 16, (c) => drawSpark(c));
  addImage(scene, 'p-z', 16, 16, (c) => drawZ(c));
  addImage(scene, 'p-ring', 48, 48, (c) => drawRing(c));
  for (const key of Object.keys(THEMES)) {
    addImage(scene, `p-leaf-${key}`, 12, 12, (c) => drawLeaf(c, THEMES[key].accent));
  }
}

function projectileSheets(scene: Phaser.Scene): void {
  addImage(scene, 'p-seed-glow', 26, 26, (c) => {
    // thin warm ring so the seed stays high contrast
    ell(c, 13, 13, 12.5, 12.5);
    fill(c, rgrad(c, 13, 13, 8, 12.5, [[0, 'rgba(255,206,90,0)'], [0.65, 'rgba(255,196,70,0.30)'], [1, 'rgba(255,196,70,0)']]));
    // husk: dark with cream stripes, the classic sunflower seed read
    c.beginPath();
    c.moveTo(13, 3);
    c.quadraticCurveTo(20.6, 7.4, 18.4, 15.6);
    c.quadraticCurveTo(16.6, 21.8, 13, 21.8);
    c.quadraticCurveTo(9.4, 21.8, 7.6, 15.6);
    c.quadraticCurveTo(5.4, 7.4, 13, 3);
    c.closePath();
    fill(c, '#241B12');
    // cream inner
    c.beginPath();
    c.moveTo(13, 5.4);
    c.quadraticCurveTo(18, 9, 16.4, 15.2);
    c.quadraticCurveTo(15, 19.6, 13, 19.8);
    c.quadraticCurveTo(11, 19.6, 9.6, 15.2);
    c.quadraticCurveTo(8, 9, 13, 5.4);
    c.closePath();
    fill(c, '#FFF6DE');
    // stripes
    c.beginPath();
    c.moveTo(10.2, 8.6);
    c.quadraticCurveTo(9.6, 14, 10.6, 18.4);
    stroke(c, '#2A2016', 1.5);
    c.beginPath();
    c.moveTo(15.8, 8.6);
    c.quadraticCurveTo(16.4, 14, 15.4, 18.4);
    stroke(c, '#2A2016', 1.5);
    sparkle(c, 19.6, 6.2, 2.8, rgba('#FFFFFF', 0.95));
  });
  addImage(scene, 'p-heart', 24, 22, (c) => {
    c.beginPath();
    c.moveTo(12, 20);
    c.bezierCurveTo(2, 12, 1, 8, 2.5, 5);
    c.bezierCurveTo(5, 1, 10, 2, 12, 6);
    c.bezierCurveTo(14, 2, 19, 1, 21.5, 5);
    c.bezierCurveTo(23, 8, 22, 12, 12, 20);
    c.closePath();
    fill(c, '#F2637B');
    c.beginPath();
    c.moveTo(12, 18);
    c.bezierCurveTo(4, 11, 3.5, 8.5, 4.5, 6.5);
    c.bezierCurveTo(6, 4, 9.5, 4.6, 12, 8);
    c.closePath();
    fill(c, '#FF9AA8');
    ell(c, 7, 7, 2.4, 1.8, -0.5);
    fill(c, rgba('#FFFFFF', 0.7));
  });
  addImage(scene, 'p-heart-empty', 24, 22, (c) => {
    c.beginPath();
    c.moveTo(12, 20);
    c.bezierCurveTo(2, 12, 1, 8, 2.5, 5);
    c.bezierCurveTo(5, 1, 10, 2, 12, 6);
    c.bezierCurveTo(14, 2, 19, 1, 21.5, 5);
    c.bezierCurveTo(23, 8, 22, 12, 12, 20);
    c.closePath();
    fill(c, 'rgba(42,27,68,0.75)');
    stroke(c, 'rgba(255,233,184,0.35)', 1.6);
  });
  addImage(scene, 'proj-seed', 14, 14, (c) => {
    ell(c, 7, 7, 4.6, 6);
    fill(c, '#EFE3C8');
    ell(c, 7, 7, 2.4, 5);
    fill(c, '#4A3B2A');
    ell(c, 6, 5, 1.2, 1.8);
    fill(c, rgba('#FFFFFF', 0.6));
  });
  addImage(scene, 'proj-acorn', 16, 16, (c) => {
    ell(c, 8, 9, 5.4, 5.6);
    fill(c, '#8B5A2B');
    ell(c, 8, 5.4, 5.8, 3.4);
    fill(c, '#5E3A1C');
    c.beginPath();
    c.moveTo(8, 2);
    c.lineTo(8, 4);
    stroke(c, '#3F2410', 1.6);
  });
  addImage(scene, 'proj-feather', 20, 14, (c) => {
    ell(c, 10, 7, 8.4, 3.4, -0.3);
    fill(c, '#7FE0EC');
    c.beginPath();
    c.moveTo(3, 9);
    c.lineTo(17, 4);
    stroke(c, '#3FB0C4', 1.4);
    for (let i = 0; i < 4; i++) {
      c.beginPath();
      c.moveTo(6 + i * 3, 8 - i * 0.6);
      c.lineTo(7 + i * 3, 5 - i * 0.6);
      stroke(c, rgba('#FFFFFF', 0.55), 1);
    }
  });
  addImage(scene, 'proj-crystal', 16, 20, (c) => {
    c.beginPath();
    c.moveTo(8, 1);
    c.lineTo(14, 9);
    c.lineTo(8, 19);
    c.lineTo(2, 9);
    c.closePath();
    fill(c, rgrad(c, 5, 6, 1, 12, [[0, '#E0FBFF'], [0.6, '#7DE3F5'], [1, '#3E9FB8']]));
    c.beginPath();
    c.moveTo(8, 1);
    c.lineTo(14, 9);
    c.lineTo(8, 11);
    c.closePath();
    fill(c, rgba('#FFFFFF', 0.4));
  });
  addImage(scene, 'proj-flame', 18, 18, (c) => {
    ell(c, 9, 9, 8, 8);
    fill(c, rgrad(c, 9, 9, 1, 8, [[0, 'rgba(220,255,250,0.9)'], [0.5, 'rgba(111,232,216,0.7)'], [1, 'rgba(111,232,216,0)']]));
    c.beginPath();
    c.moveTo(9, 2);
    c.quadraticCurveTo(14, 8, 9, 15);
    c.quadraticCurveTo(4, 8, 9, 2);
    fill(c, '#6FE8D8');
    ell(c, 9, 10, 2.4, 3);
    fill(c, '#EAFFFA');
  });
  addImage(scene, 'proj-shock', 64, 32, (c) => {
    ell(c, 32, 16, 30, 12);
    fill(c, rgrad(c, 32, 16, 4, 30, [[0, 'rgba(255,240,180,0)'], [0.7, 'rgba(255,220,120,0.5)'], [1, 'rgba(255,200,80,0)']]));
    ell(c, 32, 16, 26, 8);
    stroke(c, 'rgba(255,245,200,0.9)', 3);
  });
  addImage(scene, 'fx-slash', 40, 40, (c) => {
    c.beginPath();
    c.arc(20, 20, 15, -0.9, 0.9);
    stroke(c, 'rgba(255,255,255,0.9)', 4);
    c.beginPath();
    c.arc(20, 20, 11, -0.7, 0.7);
    stroke(c, 'rgba(255,240,180,0.6)', 2);
  });
}

let built = false;

export function buildAllTextures(scene: Phaser.Scene): void {
  if (built) return;
  built = true;
  hamsterSheets(scene);
  enemySheets(scene);
  npcSheets(scene);
  tileSheets(scene);
  propSheets(scene);
  bgSheets(scene);
  particleSheets(scene);
  projectileSheets(scene);
  createAnimations(scene);
}

function createAnimations(scene: Phaser.Scene): void {
  for (const [key, cfg] of Object.entries(HAM_ANIMS)) {
    if (scene.anims.exists(key)) continue;
    const frames: Phaser.Types.Animations.AnimationFrame[] = [];
    for (let i = 0; i < cfg.frames; i++) frames.push({ key: cfg.sheet, frame: i });
    scene.anims.create({ key, frames, frameRate: cfg.rate, repeat: cfg.repeat });
  }
  const simple = (key: string, sheet: string, frames: number, rate: number, repeat = -1) => {
    if (scene.anims.exists(key)) return;
    const list: Phaser.Types.Animations.AnimationFrame[] = [];
    for (let i = 0; i < frames; i++) list.push({ key: sheet, frame: i });
    scene.anims.create({ key, frames: list, frameRate: rate, repeat });
  };
  simple('slime-hop', 'e-slime', 2, 4);
  simple('squirrel-idle', 'e-squirrel', 2, 3);
  simple('beetle-walk', 'e-beetle', 2, 10);
  simple('bat-fly', 'e-bat', 2, 8);
  simple('bird-fly', 'e-bird', 2, 7);
  simple('wisp-float', 'e-wisp', 4, 6);
  simple('npc-snail', 'npc-snail', 2, 2);
  simple('npc-frog', 'npc-frog', 2, 2);
  simple('npc-owl', 'npc-owl', 2, 2);
  simple('seed-spin', 'p-seed', 2, 4);
  simple('coin-spin', 'p-coin', 2, 5);
  simple('berry-bob', 'p-berry', 2, 3);
  simple('mush-bounce', 'p-mushroom', 2, 3);
  simple('goal-shine', 'p-goal', 2, 2);
  simple('wind-blow', 'p-wind', 2, 6);
  for (const key of Object.keys(THEMES)) simple(`water-${key}`, `tile-${key}-water`, 3, 4);
}
