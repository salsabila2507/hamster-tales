/** One-shot screenshot: serves dist, grabs a frame, exits. Nothing left running. */
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
await new Promise((r) => server.listen(4180, '127.0.0.1', r));

const level = process.argv[2] || 'w1-1';
const out = process.argv[3] || 'shots/final.png';

const browser = await chromium.launch({
  headless: true,
  args: ['--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding']
});
const page = await browser.newPage({ viewport: { width: 1100, height: 660 } });
await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.abort());
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto('http://127.0.0.1:4180/', { waitUntil: 'domcontentloaded', timeout: 15000 });
await page.waitForTimeout(1800);
await page.evaluate((lvl) => {
  const g = window.__HT.game;
  g.scene.stop('menu');
  g.scene.start('world', { level: lvl });
}, level);
await page.waitForTimeout(1600);
// walk right a little so the shot is not at the level edge
await page.keyboard.down('KeyD');
await page.waitForTimeout(900);
await page.keyboard.up('KeyD');
await page.waitForTimeout(400);
await page.screenshot({ path: out });
await browser.close();
server.close();
console.log('saved', out, errors.length ? 'errors: ' + errors.join(' | ') : 'no errors');
process.exit(0);
