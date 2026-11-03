import { createRequire } from 'node:module';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const req = createRequire('C:/Users/Dragon/AppData/Local/npm-cache/_npx/705bc6b22212b352/');
const { chromium } = req('playwright');
const ROOT = path.resolve('dist');
const MIME = { '.html':'text/html', '.js':'text/javascript', '.jpg':'image/jpeg', '.png':'image/png' };
const server = http.createServer((rq, rs) => {
  const u = (rq.url||'/').split('?')[0];
  let f = path.join(ROOT, u === '/' ? 'index.html' : u);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(ROOT,'index.html');
  rs.writeHead(200, {'Content-Type': MIME[path.extname(f)] || 'application/octet-stream'});
  fs.createReadStream(f).pipe(rs);
});
await new Promise(r => server.listen(4185,'127.0.0.1',r));
const b = await chromium.launch({
  headless: true,
  args: ['--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding']
});
const p = await b.newPage({ viewport: { width: 1000, height: 620 } });
await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
const errs = [];
p.on('pageerror', e => errs.push(e.message));
const results = [];
const ck = (n, ok, x='') => { results.push(ok); console.log(`${ok?'PASS':'FAIL'}  ${n}${x?'  ('+x+')':''}`); };

await p.goto('http://127.0.0.1:4185/', { waitUntil: 'domcontentloaded' });
await p.waitForFunction(() => window.__HT?.game?.scene?.isActive('menu'), { timeout: 8000 });
await p.waitForTimeout(300);

const title = await p.evaluate(() => {
  const sc = window.__HT.game.scene.getScene('menu');
  const t = sc.children.list.find(o => o.type === 'Text' && o.text.includes('HAMSTER'));
  return t ? Math.round(t.displayWidth) : 0;
});
ck('menu title renders at full size', title > 300, `width=${title}px`);

await p.evaluate(() => {
  const g = window.__HT.game;
  g.scene.stop('menu');
  g.scene.start('world', { level: 'w1-1' });
});
await p.waitForFunction(() => window.__HT?.game?.scene?.isActive('world') && window.__HT?.level?.() === 'w1-1', { timeout: 8000 });
await p.waitForTimeout(400);

const w1 = await p.evaluate(() => {
  const w = window.__HT.game.scene.getScene('world');
  const pb = w.player.body;
  return { y: Math.round(w.player.y), bottom: Math.round(pb.bottom), health: w.player.health,
           h: pb.height, w: pb.width, level: w.levelId, hud: window.__HT.game.scene.isActive('hud') };
});
ck('level 1 loads with HUD', w1.level === 'w1-1' && w1.hud, w1.level);
ck('player stands exactly on the ground', w1.bottom === 512, `bodyBottom=${w1.bottom} expected 512`);
ck('hitbox matches the bigger hamster', w1.w === 36 && w1.h === 42, `${w1.w}x${w1.h}`);

const seed = await p.evaluate(async () => {
  const w = window.__HT.game.scene.getScene('world');
  const s = w.pickups.getChildren().find(x => x.pickType === 'seed' && x.active);
  if (!s) return null;
  w.player.setPosition(s.x, s.y);
  await new Promise(r => setTimeout(r, 260));
  return { seeds: w.levelSeeds, cheeks: w.player.cheeks };
});
ck('seed pickup works', !!seed && seed.seeds > 0, seed ? `seeds=${seed.seeds}` : 'none');

const sniff = await p.evaluate(async () => {
  const w = window.__HT.game.scene.getScene('world');
  const hidden = w.pickups.getChildren().find(x => x.pickType === 'hidden');
  if (!hidden) return { found: false };
  const before = hidden.visible;
  w.player.setPosition(hidden.x, hidden.y);
  await new Promise(r => setTimeout(r, 260));
  return { found: true, before, after: hidden.visible };
});
ck('hidden seeds stay hidden without sniff', !sniff.found || sniff.after === false, JSON.stringify(sniff));

await p.evaluate(() => {
  const g = window.__HT.game;
  g.scene.stop('hud'); g.scene.stop('world');
  g.scene.start('world', { level: 'w4-1' });
});
await p.waitForFunction(() => window.__HT?.game?.scene?.isActive('world') && window.__HT?.level?.() === 'w4-1', { timeout: 8000 });
await p.waitForTimeout(400);

const w4 = await p.evaluate(() => {
  const w = window.__HT.game.scene.getScene('world');
  return { level: w.levelId, enemies: w.enemies.length, boss: !!w.boss };
});
ck('world 4 loads', w4.level === 'w4-1' && w4.enemies > 0, `enemies=${w4.enemies}`);
ck('no runtime errors', errs.length === 0, errs.slice(0,2).join(' / '));

await b.close(); server.close();
const ok = results.filter(Boolean).length;
console.log(`\n${ok}/${results.length} passed`);
process.exit(ok === results.length ? 0 : 1);
