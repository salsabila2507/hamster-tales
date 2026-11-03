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
await new Promise(r => server.listen(4188,'127.0.0.1',r));
const b = await chromium.launch({ headless: true });
const p = await b.newPage({ viewport: { width: 600, height: 300 } });
await p.goto('http://127.0.0.1:4188/', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(1800);
const out = await p.evaluate(() => {
  const g = window.__HT.game;
  const res = [];
  const check = (key) => {
    const src = g.textures.get(key).getSourceImage();
    const cv = document.createElement('canvas'); cv.width = src.width; cv.height = src.height;
    const c = cv.getContext('2d'); c.drawImage(src, 0, 0);
    const d = c.getImageData(0, 0, cv.width, cv.height).data;
    let dark = null, minL = 999;
    for (let y = 0; y < cv.height; y++) for (let x = 0; x < cv.width; x++) {
      const i = (y * cv.width + x) * 4;
      const a = d[i+3]; if (a < 200) continue;
      const l = (d[i] + d[i+1] + d[i+2]) / 3;
      if (l < minL) { minL = l; dark = { x, y, r: d[i], g: d[i+1], b: d[i+2] }; }
    }
    res.push({ key, minLum: Math.round(minL), dark });
  };
  for (const v of [0,1,2,3,4]) { check('tile-sky-top-'+v); check('tile-sky-body-'+v); }
  return res;
});
console.log(JSON.stringify(out, null, 1));
await b.close(); server.close(); process.exit(0);
