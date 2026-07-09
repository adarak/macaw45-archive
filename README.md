# macaw45 VOD archive — reskin

A dark, YouTube-style reskin of the macaw45 VOD archive. Same data and video as
your current site, new layout. It's one self-contained file: **`macaw45-archive.html`**.

## What it adds
- Featured player on top; thumbnail grid below, grouped by **year → month**.
- Right-side panel: search, sort (**Newest / Oldest / Most chatted**), and a
  year/month jump nav.
- **Chat column** beside the player, replayed in sync with the video.
- Per-video chat-activity meter (needs the optional `chat` field, below).

## How to put it up
It expects to sit on the same site as your archive data (it reads `videos.json`,
`tn/`, `playlists/`, `comments/` with **relative** paths). So:

1. Drop **`macaw45-archive.html`** on your server, e.g. `/macaw45/v2.html`.
2. Open it. That's it — it loads your live catalog, plays via HLS, shows chat.

Notes:
- Video uses **video.js** (loaded from its CDN in `<head>`). Hosting it yourself?
  Swap those two `<head>` tags for your copies.
- All the wiring lives in the small **CONFIG** block at the top of the `<script>`.
- Don't double-click it locally — a file:// page can't fetch your data. Serve it.

## Optional: "Most chatted" sort + meter
Add one field per entry in `videos.json`:

```json
{ "vodid": "...", "title": "...", "date": "...", "chat": 6899 }
```

where `chat` = length of that VOD's `comments/<id>.json` array (seconds with
chat). The reskin buckets it into 5 levels automatically. Omit it and the
sort/meter just read empty — safe to ship without.
