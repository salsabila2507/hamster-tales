/**
 * Dev tool: generate the main-menu key art backdrop.
 * Usage: node scripts/gen-art.mjs "<prompt>" <outfile> [size]
 */
import fs from 'node:fs';
import path from 'node:path';

const ENDPOINT = 'https://je.jerouter.web.id/v1/images/generations';
const TOKEN = process.env.JR_TOKEN || 'jr_cup_7dea9mayntmbb3pvdb5qbye0am3';

const prompt = process.argv[2];
const out = process.argv[3] || 'public/art/key-art.jpg';
const size = process.argv[4] || '1536x1024';

if (!prompt) {
  console.error('missing prompt');
  process.exit(1);
}

const body = JSON.stringify({ model: 'ig', prompt, size });

const res = await fetch(ENDPOINT, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${TOKEN}`,
    'Content-Type': 'application/json'
  },
  body
});

if (!res.ok) {
  console.error('HTTP', res.status, await res.text());
  process.exit(1);
}

const json = await res.json();
const item = json?.data?.[0];
if (!item) {
  console.error('no data', JSON.stringify(json).slice(0, 400));
  process.exit(1);
}

fs.mkdirSync(path.dirname(out), { recursive: true });

if (item.b64_json) {
  fs.writeFileSync(out, Buffer.from(item.b64_json, 'base64'));
} else if (item.url) {
  const img = await fetch(item.url);
  fs.writeFileSync(out, Buffer.from(await img.arrayBuffer()));
} else {
  console.error('unknown payload');
  process.exit(1);
}

const st = fs.statSync(out);
console.log(`saved ${out} (${Math.round(st.size / 1024)} KB)`);
