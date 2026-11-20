# Images: how photos and floor plans are served

Pages ask for every picture as `/_next/image?url=<original>&w=<width>&q=<quality>`
(`src/lib/image-loader.ts`). The Cloudflare worker (`cloudflare/image-fallback.js`)
answers in this order:

| Step | What is served | When |
|---|---|---|
| 1 | A ready-shrunk WebP copy from our own storage | The picture is on `media.lankanewhomes.com` and a copy exists |
| 2 | Cloudflare's image resizer | No copy yet (just uploaded), or another host |
| 3 | The original file | The resizer refuses (free quota of 5,000 unique resizes a month used up) |

Response headers tell which step answered: `X-Image-Source: presized` (step 1),
`X-Image-Fallback: original` (step 3), neither (step 2).

## Ready-shrunk copies

Layout and widths are in `cloudflare/image-sizes.js`:

    original   projects/x/photo.jpg
    copies     _sized/w128/projects/x/photo.jpg.webp
               _sized/w384/…  _sized/w640/…  _sized/w1080/…  _sized/w1920/…

A page width is rounded up to the next stored width (750 → 1080; anything over
1920 → 1920). A copy is never wider than its original. SVGs and GIFs have no
copies. `_sized/manifest.json` remembers which originals are done.

**After adding or replacing photos, run:**

    npm run images:presize

It only does new or changed files. Until it runs, new photos still show (steps
2 and 3), they are just heavier. Other options: `--prefix projects/<slug>`,
`--sample 60 --dry` (estimate only), `--force` (redo everything).

First full run, 2026-11-14: 6,691 originals (3.6 GB) → about 1.8 GB of copies.
Originals are never changed or deleted by the script. Nothing under `_sized/`
is referenced from the database, so it can always be rebuilt.

History: 2026-11-13 the free resize quota ran out and most listing images
showed blank; the owner decided not to buy the paid plan and to use storage
instead.
