// Builds demo.html — a self-contained, double-clickable demo that actually
// SEEKS and shows synced CHAT, with no server. One VOD is served from a locally
// bundled, seekable clip (demo/clip.mp4) and its chat is baked from
// demo-chat.json. Every other video still streams from barbarian.men as usual.
//
// Prereqs (already generated): demo/clip.mp4 + demo-chat.json  (see README).
// Usage:  node build-demo.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

// Which VOD the bundled clip belongs to, and where the clip lives.
const DEMO = { id: '2795312504', src: 'demo/clip.mp4', offset: 390 };

const tpl = readFileSync('template.html', 'utf8');
let parsed = JSON.parse(readFileSync('catalog.json', 'utf8'));
if (!Array.isArray(parsed)) throw new Error('catalog.json is not a JSON array');

if (existsSync('chat-counts.json')) {
  const counts = JSON.parse(readFileSync('chat-counts.json', 'utf8'));
  parsed = parsed.map(v => ({ ...v, chat: counts[String(v.vodid)] || 0 }));
}

if (!existsSync('demo/clip.mp4')) throw new Error('demo/clip.mp4 missing — build the clip first (see README)');
if (!existsSync('demo-chat.json')) throw new Error('demo-chat.json missing — run build-demo-chat.mjs first');
const demoChat = JSON.parse(readFileSync('demo-chat.json', 'utf8'));

let out = tpl
  .replace('/*__VIDEOS__*/[]', JSON.stringify(parsed))
  .replace('/*__DEMO__*/null', JSON.stringify(DEMO))
  .replace('/*__DEMO_CHAT__*/null', JSON.stringify(demoChat));

// sanity: all three placeholders must have been hit
for (const p of ['/*__VIDEOS__*/[]', '/*__DEMO__*/null', '/*__DEMO_CHAT__*/null']) {
  if (out.includes(p)) throw new Error('placeholder not replaced: ' + p);
}

writeFileSync('demo.html', out);
console.log(`built demo.html: ${parsed.length} videos, ${demoChat.length} chat msgs, `
  + `demo VOD ${DEMO.id} (${(out.length/1024).toFixed(0)} KB)`);
