'use strict';

/* macaw45 archive — standalone Whatbox proxy (isolated from tube).
 *
 * Same job as the Hub tile's serve.js: the reskin (index.html) must be
 * same-origin with barbarian.men's data to seek HLS and load chat. This process
 * listens on 127.0.0.1:MACAW_PORT under the /macaw45/ subpath; tube reverse-
 * proxies /macaw45 -> here so it's reachable at <tube-domain>/macaw45/.
 *
 * Static files (index.html, chat-counts.json) are served from this dir; every
 * archive path (videos.json, tn/, playlists/, comments/, videos/, emotes/) is
 * forwarded to barbarian.men. videos.json is augmented with baked chat scores.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.MACAW_PORT || 28090;
const BASE = '/macaw45/';                     // public subpath this app lives under
const UP = 'https://barbarian.men/macaw45/';  // upstream archive origin
const DIR = __dirname;
const PROXY = ['tn/', 'playlists/', 'comments/', 'videos/', 'emotes/'];
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.webp': 'image/webp', '.mp4': 'video/mp4' };

let COUNTS = {};
try { COUNTS = JSON.parse(fs.readFileSync(path.join(DIR, 'chat-counts.json'), 'utf8')); } catch {}

async function handler(req, res) {
  const raw = decodeURIComponent(req.url.split('?')[0]);
  if (raw === '/macaw45') { res.writeHead(302, { location: BASE }); res.end(); return; }
  if (!raw.startsWith(BASE)) { res.writeHead(404); res.end('not found'); return; }
  let p = raw.slice(BASE.length).replace(/^\/+/, '');
  if (p === '') p = 'index.html';

  // catalog: fetch live, merge in the baked chat scores
  if (p === 'videos.json') {
    try {
      const list = await (await fetch(UP + 'videos.json')).json();
      const merged = list.map((v) => ({ ...v, chat: COUNTS[String(v.vodid)] || 0 }));
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(merged));
    } catch (e) { res.writeHead(502); res.end('err: ' + e.message); }
    return;
  }

  // archive assets: forward to barbarian.men (pass Range through for HLS seeking)
  if (PROXY.some((x) => p.startsWith(x)) || /^(third_party_emotes|cheers)\.json$/.test(p)) {
    try {
      const up = await fetch(UP + p, req.headers.range ? { headers: { range: req.headers.range } } : {});
      const h = {};
      for (const k of ['content-type', 'accept-ranges', 'content-range']) {
        const val = up.headers.get(k); if (val) h[k] = val;
      }
      res.writeHead(up.status, h);
      res.end(Buffer.from(await up.arrayBuffer()));
    } catch (e) { res.writeHead(502); res.end('proxy error'); }
    return;
  }

  // static from this dir (guard against path traversal)
  const fp = path.join(DIR, path.normalize(p));
  if (!fp.startsWith(DIR)) { res.writeHead(403); res.end(); return; }
  try {
    const data = fs.readFileSync(fp);
    const headers = { 'content-type': TYPES[path.extname(fp)] || 'application/octet-stream' };
    if (fp.endsWith('.html')) headers['cache-control'] = 'no-cache';
    res.writeHead(200, headers);
    res.end(data);
  } catch (e) { res.writeHead(404); res.end('not found'); }
}

http.createServer(handler).listen(PORT, '127.0.0.1',
  () => console.log('macaw45 archive proxy on 127.0.0.1:' + PORT + BASE));
