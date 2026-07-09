# demo/

`clip.mp4` (the 442 MB bundled demo clip) is **not in the repo** — it exceeds
GitHub's 100 MB file limit. It was a 10-minute seekable window of one VOD, pulled
from the HLS byte-range playlist:

```sh
ffmpeg -ss 390 -i https://barbarian.men/macaw45/playlists/v2795312504-0.m3u8 \
       -t 600 -c copy clip.mp4
```

`demo-chat.json` (in `archive/`) holds that window's baked chat, and
`../demo.html` is the built demo page that used both. See `../build-demo.mjs`.
