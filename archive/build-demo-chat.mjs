// Fetches the chat for the demo window and bakes it into demo-chat.json as a
// flat, render-ready array. One entry per message:
//   { t: <seconds from clip start>, user, color, badges:[emoji], html:<body> }
// html has emotes already inlined as <img> from Twitch's CDN (loads cross-origin
// as plain images, no CORS needed). Usage: node build-demo-chat.mjs
import { writeFile } from 'node:fs/promises';

const ID     = '2795312504';
const OFFSET = 390;   // clip starts at this absolute second of the VOD
const DUR    = 600;   // clip length (seconds)
const CONC   = 24;
const BASE   = `https://barbarian.men/macaw45/comments/`;
const EMOTE  = id => `https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/1.0`;

// minimal self-contained badge glyphs (no external assets)
const BADGE = {
  broadcaster:'🔴', moderator:'🗡️', vip:'💎', 'sub-gifter':'🎁',
  subscriber:'⭐', premium:'👑', 'turbo':'⚡', founder:'🥇', partner:'✔️',
};

const esc = s => String(s==null?'':s)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;').replace(/'/g,'&#39;');

function renderBody(m){
  const frags = m && m.fragments;
  if (Array.isArray(frags) && frags.length){
    return frags.map(f => {
      if (f.emoticon && f.emoticon.emoticon_id){
        return `<img class="emote" src="${EMOTE(f.emoticon.emoticon_id)}" alt="${esc(f.text)}" title="${esc(f.text)}">`;
      }
      return esc(f.text);
    }).join('');
  }
  return esc(m && m.body || '');
}

// fetch the index, keep active seconds inside the window
const idx = await (await fetch(`${BASE}${ID}.json`)).json();
const secs = idx.filter(s => s >= OFFSET && s < OFFSET + DUR);
console.error(`window ${OFFSET}..${OFFSET+DUR}: ${secs.length} active chat-seconds`);

const out = [];
let next = 0, done = 0;
async function worker(){
  while (next < secs.length){
    const abs = secs[next++];
    try {
      const r = await fetch(`${BASE}${ID}/${abs}.json`);
      if (!r.ok) continue;
      const msgs = await r.json();
      for (const c of (Array.isArray(msgs) ? msgs : [])){
        const m = c.message || {};
        const badges = (m.user_badges || [])
          .map(b => BADGE[b._id]).filter(Boolean);
        out.push({
          t: abs - OFFSET,
          user: (c.commenter && (c.commenter.display_name || c.commenter.name)) || '?',
          color: m.user_color || '',
          badges,
          html: renderBody(m),
        });
      }
    } catch (e){ /* skip */ }
    if (++done % 100 === 0) console.error(`  ${done}/${secs.length}`);
  }
}
await Promise.all(Array.from({length:CONC}, worker));
out.sort((a,b) => a.t - b.t);
await writeFile('demo-chat.json', JSON.stringify(out));
console.error(`wrote demo-chat.json: ${out.length} messages`);
