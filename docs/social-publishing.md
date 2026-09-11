# Social publishing — reels, carousels, Facebook & Instagram

One listing → a 9:16 story reel and a 4:5 photo carousel, generated from the
listing's **own** photos and drawings, then posted to the LankaNewHomes
Facebook Page and Instagram account from the project's **Social** tab in
`/cms` (or automatically when the listing is published).

Nothing is invented: every line of on-screen text comes from listing fields
(name, city, developer, price, bedrooms, amenities, plan captions) and every
pixel from the listing's images. That is deliberate — it's the same rule the
site follows everywhere else.

## What gets generated

| Asset | Spec | Built from |
|---|---|---|
| **Reel** (`reel.mp4`) | 1080×1920, ~30 s, H.264 | Blueprint scene (the real floor-plan drawing tilts into 3D and its walls rise) → site hologram (the real block plan as extruded lots under an orbiting camera) → aerial reveal → 2.5D-parallax walkthrough of up to 7 photos → branded end card. Text: "NEW HOMES IN SRI LANKA", "Discover New Developer Projects", "LankaNewHomes.com", plan/site captions from data. |
| **Poster** (`reel-poster.jpg`) | 1080×1920 | Frame from the aerial scene — used as the Reel cover. |
| **Cards** (`card-01…NN.jpg`) | 1080×1350 (4:5) | One per photo (max 8) + a closing CTA card. The first carries name / city / developer / type / price. Instagram rejects the developers' 2.2:1 photos, hence the cards. |

Scenes degrade gracefully: no floor plan → no blueprint scene; no block plan →
no hologram scene; no depth model installed → plain zoom/pan instead of
parallax.

Files land in R2 at `projects/<slug>/social/…` and are recorded in the
**Social Assets** collection (one row per project). They live there, not on
the project document, so a stale project form saved after generation can't
overwrite them.

## One-time setup (renderer)

```bash
npm run social:setup            # venv at .venv-social with torch (parallax), ~2 GB
npm run social:setup -- --light # renderer only, no parallax
```

Needs Python 3.10+ and ffmpeg (`brew install ffmpeg`; otherwise the setup
script installs a local `ffmpeg-static`). The depth model
(Depth Anything V2 small, ~100 MB) downloads on first run.

## Generate for a listing

```bash
npm run social:generate -- <project-slug>            # e.g. viva-la-vida
npm run social:generate -- <slug> --no-depth         # faster, no parallax
npm run social:generate -- <slug> --skip-reel        # cards only
npm run social:generate -- <slug> --skip-cards       # reel only
```

Takes 5–15 minutes with parallax (frames render on the Mac's GPU where
available). Re-run after changing a listing's photos or plans. The command
prints the R2 URLs and the default caption, and the Social tab picks them
up on next load.

Env overrides: `SOCIAL_VENV=/path/to/venv`, `SOCIAL_PYTHON=/path/to/python3`,
`FFMPEG_PATH=/path/to/ffmpeg`.

## Connect Facebook & Instagram (one-time, ~15 minutes)

Requirements: a Facebook **Page** for LankaNewHomes, and the Instagram
account switched to a **Business** (or Creator) account and linked to that
Page (Instagram app → Settings → Business tools → Connect a Facebook Page).

1. Create a Meta app at developers.facebook.com → **My Apps → Create app →
   Business**. Add the products **Facebook Login for Business** and
   **Instagram** (Instagram Graph API).
2. Open **Tools → Graph API Explorer**, pick the app, and generate a **User
   token** with these permissions: `pages_show_list`, `pages_read_engagement`,
   `pages_manage_posts`, `instagram_basic`, `instagram_content_publish`,
   `business_management`.
3. Exchange it for a long-lived token, then read the Page token + IG id
   (both calls are also available as helpers in `src/lib/social/meta.ts`):
   ```
   GET /oauth/access_token?grant_type=fb_exchange_token&client_id=APP_ID&client_secret=APP_SECRET&fb_exchange_token=SHORT_TOKEN
   GET /me/accounts?fields=id,name,access_token,instagram_business_account   (with the long-lived token)
   ```
   The Page `access_token` from `/me/accounts` (derived from a long-lived
   user token) does not expire. `instagram_business_account.id` is the IG
   user id.
4. Set the env vars (Vercel → Project → Environment Variables, and
   `.env.local` for local testing):
   ```
   META_PAGE_ID=…
   META_PAGE_ACCESS_TOKEN=…
   META_IG_USER_ID=…
   META_GRAPH_VERSION=v21.0        # optional
   ```

**No App Review is needed** for posting to your own Page/IG: an app in
Development mode grants all permissions to its admins/developers/testers.
App Review only matters if other businesses' accounts are ever connected.

Until the three vars are set, the client runs in **dry-run** mode: "Post
now" records what *would* be sent (URLs + caption) as `dry_run` rows in the
log and calls nothing. The auto-post toggle never fires in dry-run.

## Posting

Project → **Social** tab:

- **Generated assets** — reel preview, cards, when generated.
- **Caption** — default is built from the listing (name, city, type + price,
  top amenities, developer, site link, hashtags). Override it in the
  *Caption* field; leave blank to keep the default.
- **Post now** — tick Facebook / Instagram and Carousel / Reel. Each
  platform × format is attempted independently and logged as its own row.
- **History** — one row per attempt (`published` with permalink,
  `processing`, `failed` with Meta's message, or `dry_run`). Instagram
  encodes videos asynchronously: a Reel that isn't ready within ~45 s is left
  `processing` with its container id — click **Check & publish** a minute
  later.
- **Auto-post on publish** — checkbox in the Social group. Fires once, on the
  save that flips *Published* on, only when Meta is connected and assets
  exist. Failures are logged, never block the save.

Under the hood: `src/lib/social/publish.ts` (orchestration + log),
`src/lib/social/meta.ts` (Graph API), `src/lib/social/caption.ts` (default
caption), `src/collections/endpoints/social-post.ts` (GET status / POST
post|finish), `src/collections/hooks/auto-post-social.ts`,
`src/components/payload/SocialPanel.tsx`.

## Meta API limits worth knowing

- **Instagram Stories cannot be published by apps** on normal accounts —
  only feed posts and Reels. Stories stay manual.
- Reels: MP4/MOV, H.264, 9:16, ≤ 90 s (ours ≈ 30 s), publicly reachable URL
  (our R2 host qualifies). Carousels: 2–10 JPEG items, 4:5 … 1.91:1.
- Instagram allows 25 API-published posts per account per rolling 24 h.
- Music: the Graph API can't attach licensed audio. Add a track in the
  Instagram app after publishing if wanted, or bake royalty-free audio into
  the MP4 (not done today).

## Files

- `scripts/social/render_social.py` — renderer (Pillow/NumPy/SciPy; torch +
  transformers optional for depth). `assets/fonts/Archivo-VF.ttf` is the
  site's typeface, vendored under the OFL.
- `scripts/social/generate.ts` — pulls the listing, writes the spec, runs the
  renderer, uploads to R2, upserts Social Assets.
- `scripts/social/setup.sh`, `scripts/social/requirements.txt`.
- Collections `social-assets`, `social-posts` (Payload-only, admin-only,
  group *Marketing*; not mirrored to Supabase — same as Leads/Analytics).
