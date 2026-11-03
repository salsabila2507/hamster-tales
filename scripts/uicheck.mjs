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
await new Promise(r => server.listen(4186,'127.0.0.1',r));
const b = await chromium.launch({
  headless: true,
  args: ['--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding']
});
const p = await b.newPage({ viewport: { width: 1100, height: 660 } });
await p.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
const errs = [];
p.on('pageerror', e => errs.push(e.message));
const res = [];
const ck = (n, ok, x='') => { res.push(ok); console.log(`${ok?'PASS':'FAIL'}  ${n}${x?'  ('+x+')':''}`); };
const box = async () => p.locator('canvas').boundingBox();
const click = async (gx, gy) => { const bx = await box(); await p.mouse.click(bx.x + gx/960*bx.width, bx.y + gy/540*bx.height); };
const scenes = () => p.evaluate(() => window.__HT.game.scene.getScenes(true).map(s => s.scene.key));

await p.goto('http://127.0.0.1:4186/', { waitUntil: 'domcontentloaded' });
await p.waitForFunction(() => window.__HT?.game?.scene?.isActive('menu'), { timeout: 8000 });
await p.waitForTimeout(300);

await p.evaluate(() => { const g = window.__HT.game; g.scene.stop('menu'); g.scene.start('world', { level: 'w1-1' }); });
await p.waitForFunction(() => window.__HT?.game?.scene?.isActive('world') && window.__HT?.level?.() === 'w1-1', { timeout: 8000 });
await p.waitForTimeout(400);

const content = await p.evaluate(() => {
  const w = window.__HT.game.scene.getScene('world');
  return {
    chests: w.interactables.filter(i => i.kind === 'chest' && i.id.startsWith('chest')).length,
    npcs: w.interactables.filter(i => i.kind === 'npc').length,
    berries: w.pickups.getChildren().filter(x => x.pickType === 'berry').length,
    enemies: w.enemies.map(e => e.kind)
  };
});
ck('chests exist in level 1', content.chests > 0, `chests=${content.chests}`);
ck('berries exist in level 1', content.berries > 0, `berries=${content.berries}`);
ck('npc exists in level 1', content.npcs > 0, `npcs=${content.npcs}`);

// inventory
await p.keyboard.press('KeyI');
await p.waitForFunction(() => window.__HT?.game?.scene?.isActive('inventory'), { timeout: 5000 });
await p.waitForTimeout(100);
ck('I opens inventory', (await scenes()).includes('inventory'), (await scenes()).join(','));
await p.screenshot({ path: 'shots/ui-inventory.png' });
await click(480, 466);
await p.waitForFunction(() => !window.__HT?.game?.scene?.isActive('inventory'), { timeout: 5000 });
await p.waitForTimeout(200);

// map
await p.keyboard.press('KeyM');
await p.waitForFunction(() => window.__HT?.game?.scene?.isActive('map'), { timeout: 5000 });
await p.waitForTimeout(100);
ck('M opens the world map', (await scenes()).includes('map'), (await scenes()).join(','));
await p.screenshot({ path: 'shots/ui-map.png' });
await click(480, 466);
await p.waitForFunction(() => !window.__HT?.game?.scene?.isActive('map'), { timeout: 5000 });
await p.waitForTimeout(200);

// pause -> settings
await p.keyboard.press('Escape');
await p.waitForFunction(() => window.__HT?.game?.scene?.isActive('pause'), { timeout: 5000 });
await p.waitForTimeout(100);
ck('pause opens', (await scenes()).includes('pause'), (await scenes()).join(','));
await click(480, 334);
await p.waitForFunction(() => window.__HT?.game?.scene?.isActive('settings'), { timeout: 5000 });
await p.waitForTimeout(100);
ck('settings opens from pause', (await scenes()).includes('settings'), (await scenes()).join(','));
await p.screenshot({ path: 'shots/ui-settings.png' });
await click(480, 434);
await p.waitForFunction(() => !window.__HT?.game?.scene?.isActive('settings'), { timeout: 5000 });
await p.waitForTimeout(100);
await p.keyboard.press('Escape');
await p.waitForFunction(() => !window.__HT?.game?.scene?.isActive('pause'), { timeout: 5000 });
await p.waitForTimeout(200);

// npc dialogue
const npcOk = await p.evaluate(async () => {
  const w = window.__HT.game.scene.getScene('world');
  const npc = w.interactables.find(i => i.kind === 'npc');
  if (!npc) return 'no npc';
  w.player.setPosition(npc.sprite.x, npc.sprite.y - 10);
  await new Promise(r => setTimeout(r, 260));
  return 'placed';
});
await p.keyboard.press('KeyE');
await p.waitForFunction(() => window.__HT?.game?.scene?.getScene('world')?.dialogueActive, { timeout: 5000 });
await p.waitForTimeout(100);
const dlg = await p.evaluate(() => {
  const w = window.__HT.game.scene.getScene('world');
  return { active: w.dialogueActive, line: w.dialogueLines[w.dialogueIndex] || null };
});
ck('E starts NPC dialogue', dlg.active === true, `${npcOk} line="${(dlg.line||'').slice(0,32)}"`);
await p.screenshot({ path: 'shots/ui-dialogue.png' });

// chest
const chestOk = await p.evaluate(async () => {
  const w = window.__HT.game.scene.getScene('world');
  w.dialogueActive = false;
  const ch = w.interactables.find(i => i.kind === 'chest' && i.id.startsWith('chest'));
  if (!ch) return 'no chest';
  w.player.setPosition(ch.sprite.x, ch.sprite.y - 20);
  await new Promise(r => setTimeout(r, 260));
  return ch.done ? 'already' : 'placed';
});
await p.keyboard.press('KeyE');
await p.waitForFunction(() => {
  const w = window.__HT?.game?.scene?.getScene('world');
  const ch = w?.interactables?.find(i => i.kind === 'chest' && i.id.startsWith('chest'));
  return !!ch?.done;
}, { timeout: 5000 });
await p.waitForTimeout(100);
const chest = await p.evaluate(() => {
  const w = window.__HT.game.scene.getScene('world');
  const ch = w.interactables.find(i => i.kind === 'chest' && i.id.startsWith('chest'));
  return { done: !!ch?.done, seeds: w.levelSeeds };
});
ck('E opens a chest', chest.done === true, `${chestOk} seeds=${chest.seeds}`);
await p.screenshot({ path: 'shots/ui-chest.png' });

// birds in world 3
await p.evaluate(() => { const g = window.__HT.game; g.scene.stop('hud'); g.scene.stop('world'); g.scene.start('world', { level: 'w3-1' }); });
await p.waitForFunction(() => {
  const w = window.__HT?.game?.scene?.getScene('world');
  return w?.levelId === 'w3-1' && (w?.enemies?.filter(e => e.kind === 'bird')?.length ?? 0) > 0;
}, { timeout: 8000 });
await p.waitForTimeout(200);
const birds = await p.evaluate(() => window.__HT.game.scene.getScene('world').enemies.filter(e => e.kind === 'bird').length);
ck('birds spawn in world 3', birds > 0, `birds=${birds}`);

ck('no runtime errors', errs.length === 0, errs.slice(0,2).join(' / '));
await b.close(); server.close();
const ok = res.filter(Boolean).length;
console.log(`\n${ok}/${res.length} passed`);
process.exit(ok === res.length ? 0 : 1);
