/**
 * Functional verification. Runs the real game in a browser and asserts that
 * the systems actually work: movement, jumping, pickups, pause, level clear,
 * boss defeat and every world loading.
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const CANDIDATES = [
  'C:/Users/Dragon/AppData/Local/npm-cache/_npx/705bc6b22212b352/',
  'C:/Users/Dragon/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/'
];
let chromium = null;
for (const base of CANDIDATES) {
  try { const r = createRequire(base); chromium = r('playwright').chromium; if (chromium) break; } catch {}
}

// self-contained: serve dist/ so no background server is needed
const ROOT = path.resolve('dist');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.css': 'text/css' };
const server = http.createServer((rq, rs) => {
  const u = (rq.url || '/').split('?')[0];
  let f = path.join(ROOT, u === '/' ? 'index.html' : u);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(ROOT, 'index.html');
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(rs);
});
await new Promise((r) => server.listen(4184, '127.0.0.1', r));
const URL = process.env.URL || 'http://127.0.0.1:4184';
const GPU = process.env.GPU !== '0';
fs.mkdirSync('shots', { recursive: true });

const results = [];
const errors = [];
const check = (name, ok, extra = '') => {
  results.push({ name, ok, extra });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  (' + extra + ')' : ''}`);
};

const browser = await chromium.launch({
  headless: !GPU,
  args: [
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding'
  ]
});
const page = await browser.newPage({ viewport: { width: 1280, height: 760 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.fulfill({ status: 200, contentType: 'text/css', body: '' }));

page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('404')) errors.push(m.text()); });

const box0 = () => page.locator('canvas').boundingBox();
const toScreen = (b, gx, gy) => ({ x: b.x + (gx / 960) * b.width, y: b.y + (gy / 540) * b.height });
const state = () => page.evaluate(() => {
  const g = window.__HT.game;
  const w = g.scene.getScene('world');
  const p = w?.player;
  return {
    scenes: g.scene.getScenes(true).map((s) => s.scene.key),
    level: w?.levelId ?? null,
    x: p ? Math.round(p.x) : -1,
    y: p ? Math.round(p.y) : -1,
    vy: p ? Math.round(p.body.velocity.y) : 0,
    health: p?.health ?? -1,
    seeds: w?.levelSeeds ?? -1,
    enemies: w?.enemies?.length ?? -1,
    hasBoss: !!w?.boss,
    bossHp: w?.boss?.hp ?? -1
  };
});

// ---------- boot ----------
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
await page.waitForFunction(() => window.__HT?.game?.scene?.isActive('menu'), { timeout: 10000 });
await page.waitForTimeout(300);
await page.screenshot({ path: 'shots/v1-menu.png' });
let s = await state();
check('menu scene is active', s.scenes.includes('menu'), s.scenes.join(','));

// ---------- start level ----------
const b = await box0();
const playBtn = toScreen(b, 268, 214);
await page.mouse.click(playBtn.x, playBtn.y);
await page.waitForFunction(() => window.__HT?.game?.scene?.isActive('world') && window.__HT?.level?.() === 'w1-1', { timeout: 8000 });
await page.waitForTimeout(400);
s = await state();
check('world scene starts on Play', s.scenes.includes('world') && s.level === 'w1-1', `${s.level} ${s.scenes.join(',')}`);
const startX = s.x;
await page.screenshot({ path: 'shots/v2-level1.png' });

// ---------- movement ----------
await page.keyboard.down('KeyD');
await page.waitForTimeout(1000);
await page.keyboard.up('KeyD');
await page.waitForTimeout(200);
const afterMove = await state();
check('player moves right with D', afterMove.x > startX + 60, `${startX} -> ${afterMove.x}`);

// ---------- jump ----------
await page.keyboard.down('Space');
await page.waitForTimeout(120);
const midJump = await state();
await page.keyboard.up('Space');
await page.waitForTimeout(500);
check('player jumps with Space', midJump.vy < -100 || midJump.y < afterMove.y - 10, `vy=${midJump.vy} y ${afterMove.y}->${midJump.y}`);

// ---------- pickup ----------
const picked = await page.evaluate(async () => {
  const w = window.__HT.game.scene.getScene('world');
  const seed = w.pickups.getChildren().find((p) => p.pickType === 'seed' && p.active);
  if (!seed) return null;
  w.player.setPosition(seed.x, seed.y);
  await new Promise((r) => setTimeout(r, 260));
  return { seeds: w.levelSeeds, cheeks: w.player.cheeks };
});
check('collecting a seed works', !!picked && picked.seeds > 0, picked ? `seeds=${picked.seeds} cheeks=${picked.cheeks}` : 'no seed found');

// ---------- pause ----------
await page.keyboard.press('Escape');
await page.waitForFunction(() => window.__HT?.game?.scene?.isActive('pause'), { timeout: 5000 });
await page.waitForTimeout(100);
s = await state();
check('Escape opens the pause menu', s.scenes.includes('pause'), s.scenes.join(','));
await page.screenshot({ path: 'shots/v3-pause.png' });
await page.keyboard.press('Escape');
await page.waitForFunction(() => !window.__HT?.game?.scene?.isActive('pause') && window.__HT?.game?.scene?.isActive('world'), { timeout: 5000 });
await page.waitForTimeout(100);
s = await state();
check('Escape closes the pause menu', !s.scenes.includes('pause') && s.scenes.includes('world'), s.scenes.join(','));

// ---------- level completion ----------
await page.evaluate(() => {
  const w = window.__HT.game.scene.getScene('world');
  const g = w.goalSprite;
  if (g) w.player.setPosition(g.x - 30, g.y);
});
await page.waitForFunction(() => window.__HT?.game?.scene?.isActive('levelclear'), { timeout: 6000 });
await page.waitForTimeout(300);
s = await state();
check('reaching the goal clears the level', s.scenes.includes('levelclear'), s.scenes.join(','));
await page.screenshot({ path: 'shots/v4-levelclear.png' });

// ---------- boss ----------
await page.evaluate(() => {
  const g = window.__HT.game;
  g.scene.stop('levelclear');
  g.scene.stop('hud');
  g.scene.stop('world');
  g.scene.start('world', { level: 'w1-b' });
});
await page.waitForFunction(() => {
  const w = window.__HT?.game?.scene?.getScene('world');
  return w?.boss && w.levelId === 'w1-b';
}, { timeout: 8000 });
await page.waitForTimeout(400);
s = await state();
check('boss level spawns a boss', s.hasBoss && s.bossHp > 0, `hp=${s.bossHp}`);
await page.screenshot({ path: 'shots/v5-boss.png' });

const bossKill = await page.evaluate(async () => {
  const w = window.__HT.game.scene.getScene('world');
  const start = w.boss.hp;
  for (let i = 0; i < 20 && w.boss && w.boss.state !== 'dead'; i++) {
    w.boss.invuln = 0;
    w.boss.hit();
    await new Promise((r) => setTimeout(r, 80));
  }
  return { start, dead: !w.boss || w.boss.state === 'dead' };
});
await page.waitForFunction(() => window.__HT?.game?.scene?.isActive('levelclear'), { timeout: 8000 });
await page.waitForTimeout(400);
s = await state();
check('boss can be defeated and ends the level', bossKill.dead && s.scenes.includes('levelclear'), `startHp=${bossKill.start} scenes=${s.scenes.join(',')}`);

// ---------- other worlds ----------
for (const id of ['w2-1', 'w3-1', 'w4-1']) {
  await page.evaluate((lid) => {
    const g = window.__HT.game;
    g.scene.stop('levelclear');
    g.scene.stop('hud');
    g.scene.stop('world');
    g.scene.start('world', { level: lid });
  }, id);
  await page.waitForFunction((lid) => {
    const w = window.__HT?.game?.scene?.getScene('world');
    return w?.levelId === lid && (w?.enemies?.length ?? 0) > 0;
  }, id, { timeout: 8000 });
  await page.waitForTimeout(400);
  const st = await state();
  const ok = st.level === id && st.enemies > 0 && st.health > 0;
  check(`${id} loads and spawns enemies`, ok, `enemies=${st.enemies} health=${st.health}`);
  await page.screenshot({ path: `shots/v6-${id}.png` });
}

// ---------- save persistence ----------
const saved = await page.evaluate(() => {
  const raw = localStorage.getItem('hamster-tales-save-v1');
  if (!raw) return null;
  const d = JSON.parse(raw);
  return { seeds: d.seeds, levels: Object.keys(d.levels), abilities: d.abilities };
});
check('progress is written to localStorage', !!saved && saved.seeds > 0, saved ? `seeds=${saved.seeds} levels=${saved.levels.join('|')}` : 'nothing saved');

check('no runtime errors', errors.length === 0, errors.slice(0, 3).join(' / '));

await browser.close();
server.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) {
  console.log('FAILED: ' + failed.map((f) => f.name).join(', '));
  process.exit(1);
}
