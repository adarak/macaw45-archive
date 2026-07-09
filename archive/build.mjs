// Bakes catalog.json into template.html -> index.html (the double-click file).
// Usage:  node build.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const tpl = readFileSync('template.html', 'utf8');
let parsed = JSON.parse(readFileSync('catalog.json', 'utf8'));
if (!Array.isArray(parsed)) throw new Error('catalog.json is not a JSON array');

// Optional: merge chattiness scores from build-chat-counts.mjs, if present.
let chatNote = '';
if (existsSync('chat-counts.json')) {
  const counts = JSON.parse(readFileSync('chat-counts.json', 'utf8'));
  parsed = parsed.map(v => ({ ...v, chat: counts[String(v.vodid)] || 0 }));
  chatNote = ', chat counts merged';
}

const out = tpl.replace('/*__VIDEOS__*/[]', JSON.stringify(parsed));
if (out === tpl) throw new Error('placeholder /*__VIDEOS__*/[] not found in template.html');

writeFileSync('index.html', out);
console.log(`built index.html with ${parsed.length} videos (${(out.length/1024).toFixed(0)} KB)${chatNote}`);
