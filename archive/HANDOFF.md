# macaw45 archive reskin — handoff

A dark, YouTube-style reskin of your VOD archive. Same data/video, new layout.
All page logic is one HTML file; only the **`ADAPTER BLOCK`** near the top decides
where data/video come from.

## See it
Double-click **`demo.html`** — one VOD is bundled as a seekable clip with synced
chat, so you can see the full experience (seek + Twitch-style chat). On your own
origin *every* video does this automatically. (`index.html` is browse-only: a
local file can't seek fragmented MP4 or fetch chat cross-origin.)

## Put it on your site
Copy the file to a new URL (e.g. `/macaw45/v2.html`), then in the `ADAPTER BLOCK`:

1. `const BASE = '';`
2. Replace the baked `VIDEOS = [...]` with your loader, calling `init()` after:
   `fetch('videos.json').then(r=>r.json()).then(j=>{ VIDEOS=j; init(); });`
3. In `videoSourceHtml()`, switch to the commented **video.js + HLS** line and
   load video.js in `<head>`. (Restores seeking + adaptive quality.)
4. `const CHAT_ENABLED = true;` and feed chat into `#chat-log` — either reuse your
   existing per-second render loop, or use the built-in `setupChat()`/`chatMsgHtml()`
   with a live `comments/<id>/<t>.json` fetch.

That's a self-contained new page, zero changes to your current site. To replace
your current page instead, also repoint `selectVideo()` from the `#<vodid>` hash
to your `/macaw45/<vodid>` routing.

## "Most chatted" sort (optional)
Add one field per entry in `videos.json`: `"chat": <length of that VOD's
comments/<id>.json array>`. The reskin buckets it into 5 levels. Omit it and the
sort/meters just read empty.
