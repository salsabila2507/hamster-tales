import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const CANDIDATES = [
  'C:/Users/Dragon/AppData/Local/npm-cache/_npx/705bc6b22212b352/',
  'C:/Users/Dragon/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/'
];
let chromium = null;
for (const base of CANDIDATES) {
  try { const r = createRequire(base); chromium = r('playwright').chromium; if (chromium) break; } catch {}
}

const ROOT = path.resolve('dist');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.css': 'text/css' };

const server = http.createServer((req, res) => {
  const url = (req.url || '/').split('?')[0];
  let file = path.join(ROOT, url === '/' ? 'index.html' : url);
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(ROOT, 'index.html');
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(4189, '127.0.0.1', r));

const browser = await chromium.launch({
  headless: true,
  args: ['--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding']
});
const page = await browser.newPage({ viewport: { width: 1100, height: 660 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.fulfill({ status: 200, contentType: 'text/css', body: '' }));

const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto('http://127.0.0.1:4189/', { waitUntil: 'domcontentloaded', timeout: 15000 });
await page.waitForTimeout(1500);

const worlds = [
  { id: 'w1-1', name: 'Meadows', out: 'shots/final-w1.png' },
  { id: 'w2-1', name: 'Caverns', out: 'shots/final-w2.png' },
  { id: 'w3-1', name: 'Cloudberry', out: 'shots/final-w3.png' },
  { id: 'w4-1', name: 'Forest', out: 'shots/final-w4.png' }
];

for (const w of worlds) {
  console.log(`Capturing ${w.id} (${w.name})...`);
  await page.evaluate((lvl) => {
    const g = window.__HT.game;
    g.scene.stop('menu');
    g.scene.stop('hud');
    g.scene.stop('world');
    g.scene.start('world', { level: lvl });
  }, w.id);
  await page.waitForTimeout(1400);

  // walk right a bit
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(700);
  await page.keyboard.up('KeyD');
  await page.waitForTimeout(300);

  await page.screenshot({ path: w.out });
  console.log(`Saved ${w.out}`);
}

await browser.close();
server.close();
console.log('All 4 worlds captured!', errors.length ? 'Errors: ' + errors.join(' | ') : 'No errors.');
process.exit(0);
