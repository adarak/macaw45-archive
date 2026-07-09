// Fetches each VOD's chat index (comments/<id>.json) and records how many
// seconds had chat activity -- a cheap "chattiness" score used for the
// "Most chatted" sort. One request per video. Writes chat-counts.json.
// Usage: node build-chat-counts.mjs   (then re-run build.mjs)
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const BASE = 'https://barbarian.men/macaw45/comments/';
const CONCURRENCY = 24;

const catalog = JSON.parse(await readFile('catalog.json', 'utf8'));
// Merge-safe: keep known non-zero counts; only (re)fetch ids that are 0/missing.
// So re-running just retries the failures without ever lowering a good count.
const counts = existsSync('chat-counts.json')
  ? JSON.parse(await readFile('chat-counts.json', 'utf8')) : {};
const ids = catalog.map(v => String(v.vodid)).filter(id => !(counts[id] > 0));
let next = 0, done = 0, failed = 0;

async function worker(){
  while (next < ids.length){
    const id = ids[next++];
    try {
      const r = await fetch(BASE + id + '.json');
      if (r.ok){ const a = await r.json(); counts[id] = Array.isArray(a) ? a.length : 0; }
      else { counts[id] = counts[id] || 0; failed++; }
    } catch (e){ counts[id] = counts[id] || 0; failed++; }
    if (++done % 200 === 0) process.stderr.write(`  ${done}/${ids.length}\n`);
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));
await writeFile('chat-counts.json', JSON.stringify(counts));
const withChat = Object.values(counts).filter(n => n > 0).length;
console.log(`wrote chat-counts.json: ${Object.keys(counts).length} videos, ${withChat} with chat, ${failed} fetch failures`);
