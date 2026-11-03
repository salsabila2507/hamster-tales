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
await new Promise(r => server.listen(4187,'127.0.0.1',r));
const b = await chromium.launch({ headless: true });
const p = await b.newPage({ viewport: { width: 900, height: 300 } });
await p.goto('http://127.0.0.1:4187/', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(1800);
const dataUrl = await p.evaluate(() => {
  const g = window.__HT.game;
  const keys = [];
  for (const v of [0,1,2,3,4]) { keys.push('tile-sky-top-'+v); keys.push('tile-sky-body-'+v); }
  const S = 4, W = 32*S;
  const cv = document.createElement('canvas');
  cv.width = W * keys.length; cv.height = 32*S*2;
  const c = cv.getContext('2d');
  c.fillStyle = '#ff00ff'; c.fillRect(0,0,cv.width,cv.height);
  keys.forEach((k, i) => {
    const src = g.textures.get(k).getSourceImage();
    c.imageSmoothingEnabled = false;
    c.drawImage(src, 0, 0, 32, 32, i*W, 0, W, 32*S);
  });
  return cv.toDataURL('image/png');
});
fs.writeFileSync('shots/tiles-sky.png', Buffer.from(dataUrl.split(',')[1], 'base64'));
await b.close(); server.close();
console.log('saved shots/tiles-sky.png');
process.exit(0);
