import { createRequire } from 'node:module';
const CANDIDATES = [
  'C:/Users/Dragon/AppData/Local/npm-cache/_npx/705bc6b22212b352/',
  'C:/Users/Dragon/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/'
];
let chromium = null;
for (const base of CANDIDATES) {
  try { const r = createRequire(base); chromium = r('playwright').chromium; if (chromium) break; } catch {}
}

const URL = process.env.URL || 'http://127.0.0.1:4173';
const GPU = process.env.GPU === '1';
const args = GPU ? ['--use-angle=gl', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] : [];
const browser = await chromium.launch({ headless: !GPU, args });
const page = await browser.newPage({ viewport: { width: 1280, height: 760 } });
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('[err]', m.text()); });

await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
await page.waitForTimeout(1800);
await page.evaluate(() => {
  const g = window.__HT.game;
  g.scene.stop('menu');
  g.scene.start('world', { level: 'w1-1' });
});
await page.waitForTimeout(2000);

const measure = async (label) => {
  const fps = await page.evaluate(async () => {
    const g = window.__HT.game;
    let frames = 0;
    const start = performance.now();
    await new Promise((res) => {
      const tick = () => {
        frames++;
        if (performance.now() - start > 2000) res();
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    return Math.round((frames / (performance.now() - start)) * 1000);
  });
  console.log(`${label}: ${fps} fps`);
  return fps;
};

await measure('baseline');

await page.evaluate(() => {
  const w = window.__HT.game.scene.getScene('world');
  w.bgFar.setVisible(false); w.bgMid.setVisible(false); w.bgNear.setVisible(false); w.bgSky.setVisible(false);
});
await measure('no background layers');

await page.evaluate(() => {
  const w = window.__HT.game.scene.getScene('world');
  w.children.list.filter((c) => c.texture && c.texture.key && String(c.texture.key).startsWith('terrain')).forEach((c) => c.setVisible(false));
});
await measure('no bg + no terrain');

await page.evaluate(() => {
  const g = window.__HT.game;
  g.scene.stop('hud');
});
await measure('no bg + no terrain + no hud');

const info = await page.evaluate(() => {
  const g = window.__HT.game;
  return {
    renderer: g.renderer.type === 1 ? 'CANVAS' : g.renderer.type === 2 ? 'WEBGL' : String(g.renderer.type),
    displayObjects: g.scene.getScene('world').children.list.length,
    tweens: g.scene.getScene('world').tweens.getTweens().length
  };
});
console.log(JSON.stringify(info));
await browser.close();
