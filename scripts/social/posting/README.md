# Posting scripts (Instagram, TikTok, Facebook)

These drive the separate posting Chrome (profile `~/Library/LNH-chrome-posting`, debug port 9333) with
`playwright-core`. The owner is already logged in there. Nothing here holds a password or token.

| Script | Use |
|---|---|
| `igfull.cjs` | `node igfull.cjs <dir> reel\|carousel [1]` : Instagram; refuses to share unless caption, location and Crop Original are set |
| `ttfull.cjs` | `node ttfull.cjs <dir> reel\|carousel "<title>" [1]` : TikTok |
| `ffreel.cjs` | `node ffreel.cjs <dir> [1]` : Facebook Page reel; refuses to post unless a video is attached |
| `fbloc.cjs` | `node fbloc.cjs <reelId> "<location>" [1]` : adds the location to a Facebook reel afterwards (Facebook greys it out while creating) |

Without the final `1` a script only fills the form and reports problems. `<dir>` must hold `reel.mp4` (or
`slide-NN.png`), `cover.png`, `caption.txt`, `caption-fb.txt` and `location.txt` (area only, for example `Jaffna`).

Needs `playwright-core` on `NODE_PATH` (`npm i playwright-core` in any scratch folder, then
`export NODE_PATH=<that folder>/node_modules`).

Rules: run one script at a time and never stop it mid-run (that once double-posted a reel). Check the developer's
site for sold-out and the `social-posts` log for earlier posts before posting. After posting, log the three posts
with a script like `scripts/_add-yarl-guess-city-reel-social.ts` so `/links` updates.
