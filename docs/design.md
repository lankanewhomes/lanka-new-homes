# Design Reference — LankaNewHomes

Living reference for UI conventions established across the site. Check here
before building a new page or component so new work matches existing
patterns without the user having to repeat instructions. Update this file
whenever a new convention is set or an existing one changes.

## Brand / logo

Site brand is "LankaNewHomes" (contact: lankanewhomes@gmail.com, canonical
domain: lankanewhomes.com — set as `FALLBACK_SITE_URL` in `src/lib/seo.ts`).
The brand mark is a **plain-text wordmark, stacked on two lines, one
colour, no icon** (set by the owner 2026-09-07):

    Lanka
    NewHomes

Archivo 700, letter-spacing −0.02em, `#1d1d22` on light backgrounds, white
on dark. No orange, no house badge. Both the Header (`.site-wordmark`, 17px)
and the Footer (`.footer-wordmark`, 24px) render it as live text — two
`<span class="wordmark-line">` inside the home link — never as an image. The
standalone asset (outlined to paths, no font dependency) is at
`public/logo-wordmark.svg` (dark) and `public/logo-wordmark-white.svg`
(white); regenerate with fontkit from the Archivo TTF if the text changes.
`public/logo.svg` (the old orange house badge + wordmark) is no longer used
in the site chrome; it's kept only because OG/social images still reference
it — replace those before deleting it.

Footer (`Footer` in `components.tsx`, `.site-footer` / `.footer-inner` in
globals.css): dark `#1c1c20`, content in the sitewide 1290px container so it
shares the header's left edge; brand block (wordmark, tagline, "List your
project" pill CTA — no contact email, removed on request) left, four link
columns (Explore / For
developers / Company / Legal) right, thin legal bar below. Columns collapse
to 2 under 980px and the brand block goes full-width.

## Section navigation bar (project / floor plan pages)

Used on the project detail page and the floor plan detail page, via the
shared `ProjectHero` component (`src/components/marketplace/components.tsx`).

- Optional **back link** on the far left (`backHref` + `backLabel` props):
  chevron-left icon + label, **regular weight** (never bold), separated from
  the section tabs by a vertical divider (`border-right`).
- **Section tabs** (Overview / Pricing / Plans & homes / Amenities /
  Neighborhood): regular weight when inactive, **bold + orange underline**
  (`#f47b36`) when active. Active section is tracked via the URL hash.
- Tabs are conditionally shown — pass `showAmenitiesAndNeighborhoodNav={false}`
  on pages where those sections don't exist (e.g. the floor plan page).
- `titleOverride` / `heroImageOverride` swap the H1 and hero photo without
  touching the rest of the hero (stats row, tags, developer byline).

**Convention going forward:** any new page nested under a project or floor
plan (or anything with a similar "detail page with sub-sections" shape)
should reuse this same nav pattern — back link unbold, active tab bold — via
`ProjectHero`'s props rather than a new bespoke nav.

## Plans & homes section (project detail page)

`PlansAndHomesSection` (`src/components/marketplace/components.tsx`) renders
the floor-plan tabs/filter toolbar plus a list of plans. The toolbar (tabs,
filter drawer, sort) is unchanged; only the plan list markup/styling has a
documented alternate.

- **Current default: row list.** Each plan is a horizontal card
  (`.plans-home-list` / `.plans-home-row`) — small rounded thumbnail on the
  left, name + status pill + type + facts in the middle, price + "View plan"
  on the right. Rounded corners (14px), soft hover shadow, no image overlay
  pill.
- **Previous variant, kept in CSS for an instant revert:** a 3-column grid
  of vertical cards (`.plans-homes-grid` / `.plans-home-card` /
  `.plans-home-image` / `.plans-status-pill` / `.plans-home-body`) — sharp
  corners, image on top with a green "For sale" pill overlaid on the photo,
  details stacked below. To revert, swap the `<div className="plans-home-list">…</div>`
  block back to a `<div className="plans-homes-grid">` mapping over
  `visiblePlans` with the `plans-home-card` markup — nothing was deleted
  from `globals.css`, so no new styles need writing.
- **Card text styling is shared with `ListingGridCard`'s** (see "Homepage"
  below): title `16px` / `400` weight / `20px` line-height / `#1a1a1a`,
  price `13px` / `400` / `18px` line-height / `#303030`, secondary line
  (`.plans-home-type` / `.listing-grid-card-agency`) `12px` / `#303030`.
  Keep any new project/plan card's name+price text at these same values.

## Construction updates timeline (project detail page)

`ConstructionTimelineSection` (`src/components/marketplace/components.tsx`)
renders a dated photo-and-note timeline from `Project.constructionUpdates`
(`{ date, image, note }[]`, edited on the Timeline tab in `/cms`, right after
Construction Started). This is a deliberately separate, clean field from the
older `statusHistory`/`availabilityHistory`/`completionDateHistory` arrays —
those are unused/ambiguous leftovers, never repurposed for this.

- Renders nothing when the array is empty — a project with no updates yet
  shows no section at all.
- Always sorted newest-first by `date` (`sortConstructionUpdates` in
  `src/lib/construction-updates.ts`), never by array/entry order — an admin
  can add an update out of sequence and it still lands in the right place.
  The follower-digest cron (see "Lead alerts, pipeline and response time"
  below) reuses the same sort helper so "the newest update" means the same
  thing in the email as it does on the page.
- Visual: `.construction-timeline-shell` box (same model as
  `.key-features-shell` — bordered, `#f7f7f6`, `32px` padding), a vertical
  rail (`border-left` on `.construction-timeline-item`) with a dot per entry,
  photo + date + note per row. Stacks to one column under 640px.
- Rendered identically on the real page (`/projects/[slug]/page.tsx`, right
  after `PlansAndHomesSection`) and on `/listing-preview/[slug]` — keep both
  in sync if this section ever moves, since the preview link's whole point is
  to match production exactly.

## Hero media (project detail page)

The top media area of `ProjectHero` (`src/components/marketplace/components.tsx`)
defaults to a photo grid: one large photo left (`.listing-hero-grid-main`) +
two stacked photos right (`.listing-hero-grid-side`), with pill shortcuts
overlaid bottom-left (`.listing-hero-grid-pills`). A pill only renders for a
media type that actually has content for that project — Photos always shows
(count), Videos/Virtual tours only if the project has any, Map/Road Map only
if coordinates exist, Block Plan only if a block-plan image exists,
Interactive map only if `interactiveMapUrl` is set. Nothing is shown as
disabled/greyed-out — a field with no content just doesn't get a pill.
Clicking Photos or Map opens the lightbox gallery; the rest switch the hero
media area the same way the tab bar below it always has.

**Pill order (owner-set, 2026-09-11)** — one canonical order drives both
the hero pill row and the floating/mobile bar (`HERO_PILL_ORDER` in
`ProjectHero`): Photos, Floor Plans (or "Plots" on land), Videos, Brochure,
Road Map, Block Plan, Map, Street View; anything else (360° View,
Interactive map, Virtual tours) sorts after in definition order. Every
pill is rendered into the bar; the desktop floating pill shows only the
first 6 (`:nth-child(n + 7)` hidden in CSS), so on a fully populated
listing Map and Street View are what drop off it — not Floor Plans, which
an earlier positional `slice(0, 6)` used to lose. The mobile bottom tab
bar re-shows all of them and, with 7+ (`.is-scrollable`), keeps each tab
at natural width and slides horizontally — the partly visible last tab is
the affordance — rather than squeezing every label onto one screen (the
old `is-compact` mode, removed 2026-09-11). Don't reintroduce per-pill
"essential"/"always last" special cases; change the order in one place.

**Desktop floating bar is scroll-gated.** It gets `.is-visible` from the
same `titlePanelRef` IntersectionObserver flag as `.listing-hero-mobile-
ctas`, and the base rule keeps it `opacity: 0; visibility: hidden` until
then. At the top of the page the hero already renders this exact pill row,
and the always-on floating copy sat directly on top of it and the title
line beneath (two rows of pills visibly touching). The ≤760px override
forces it visible again — on mobile it's the page's bottom tab nav, not a
duplicate of anything.

The single wide-photo view (`.listing-hero-image-trigger` / `.listing-hero-image`)
is no longer the default but is still used by the explicit "Photos" tab
browse mode (clicking that tab in the toolbar below the hero) — that markup
wasn't removed, just no longer shown first.

This only changes the *default* view (`activeMedia === null`, before the
visitor picks a tab). The tab bar below the media area — Photos / Videos /
Map / Block Plan / Road Map / Interactive map / Virtual tours — and the full
lightbox gallery are unchanged either way.

**Floor plan / plot pages (2D + 3D):** a floor plan's hero is its 2D
drawing (`heroImageOverride`), shown `object-fit: contain` (`.is-floor-plan`)
so edge labels like "TOTAL FLOOR AREA" aren't cropped. If the plan also has
an `image3d` (optional, e.g. Imaarat Unit A's 3D render), `ProjectHero`
builds a two-item `photoItems` — "{plan} — 2D Floor Plan" and "{plan} — 3D
View" — so the 2D/3D pair flips via the lightbox arrows/swipe and both show
in the hero grid. `.listing-hero-grid.two-photo` collapses the side column
to one row so the lone 3D thumbnail fills it (`.single-photo` handles the
no-3D case by dropping the side column entirely).

### Photo lightbox

`.listing-photo-lightbox` (full-screen, `position: fixed; inset: 0;`) is the
containing block for its absolutely-positioned children:
- `.listing-photo-lightbox-close` sits in the fixed top-right corner
  (`position: absolute; top: 14px; right: 16px;`), not inline with the
  action buttons.
- `.listing-photo-lightbox-arrow` (prev/next) uses a solid white background
  with a dark icon (`#212834`) — matches the homepage hero carousel's arrow
  style — rather than a transparent/outlined button.
- On mobile (`max-width: 640px`) the title/address block
  (`.listing-photo-lightbox-meta`) and the action row
  (`.listing-photo-lightbox-actions`: Get updates / Save / Share) stack onto
  their own full-width rows. The meta block keeps `padding-right: 46px` so
  its text doesn't run under the absolutely-positioned close button, and the
  action row's own `padding-right: 46px` (used on desktop to clear the close
  button when everything shares one row) is reset to `0` so the three
  buttons center correctly.
- Swiping left/right on the photo/road-map/block-plan media area on touch
  devices navigates prev/next (`useSwipeNavigation` hook in
  `components.tsx`, `SWIPE_THRESHOLD_PX = 50`) — same navigation the arrow
  buttons trigger, just gesture-driven.

## Status / badge pills

Each pill type has its own dedicated CSS class — never relying on sibling
order (e.g. `:last-child`) to pick a color, since pills get added/removed
per project and order isn't stable.

| Pill | Class | Color |
|---|---|---|
| Listing status ("Coming Soon", "Now Selling"...) | `.listing-hero-tag-status` | Green |
| "Move in {year}" | `.listing-hero-tag-move-in` | Blue |
| Hot deal | `.listing-hero-tag-hot-deal` | Red |
| Move-In Now / Quick Move-In / Featured | `.listing-badge-pill` (hero) / `.home-card-badge-row span` (cards) / `.plans-home-badge-row span` (floor plan cards) | Purple (Move-In Now) / Gold (`.badge-featured`) |
| Availability badge ("Limited Units"…) | `.listing-badge-pill.badge-availability` | Orange |
| Marketing badges (Premium, BOI Approved Project…) | `.listing-badge-pill.badge-marketing` | Rose |
| Location badges (Ocean View, Beachfront…) | `.listing-badge-pill.badge-location` | Teal |
| Untyped extra badges (e.g. `land.badges` strings) | `.listing-badge-pill.badge-extra` | Teal (same as location) |

The availability pill ("Limited Units" / "Last Few Units", kind
`availability` in `ProjectHero`'s `extraBadges`) is the one pill that is a
link, not a `<span>`: it jumps to `#plans-homes`, where per-plan
Available / Limited / Sold Out is already shown. `.listing-hero-tags a`
shares the `span` pill rules so it looks identical.

Badges are driven by `Project.isFeatured`, `Project.isMoveInNow`, and
per-floor-plan `FloorPlan.quickMoveIn` — set in the project editor's
"Badges" box.

**Badge categories (Status & Badges tab)**: Status (Coming Soon/Now Selling/
etc.) and property features (Freehold, Pool, Gym, Security, EV Charging,
Gated Community...) already had dedicated fields before badges existed —
Status and Ownership/Amenities respectively — so they aren't duplicated as
badges. Three genuinely new categories were added instead:
`availabilityBadge` (+ Other) — Limited Units / Last Few Units;
`marketingBadges` (multi-select) — Premium, Luxury, Exclusive, Popular, Best
Seller, Special Offer, Price Reduced, Early Bird, Investor Friendly, High
Rental Potential, BOI Approved Project; `locationBadges` (multi-select) —
Beachfront, Ocean View, City View, Mountain View, Nature View, Prime
Location. All three feed into `ProjectHero`'s existing `extraBadges` prop
(`src/app/projects/[slug]/page.tsx`) rather than new rendering — they render
identically to Featured/Move-In Now, just with different label text.

## Category listing pages (`/projects/*`, and the pattern for future
directory-style pages like `/construction-companies/*`)

Reference: Zolo/Livabl-style "Pre Construction & New Homes" layout.
Built from `src/lib/listing-categories.ts` (config) +
`src/components/marketplace/listing-shell.tsx` (server: breadcrumb JSON-LD,
ItemList JSON-LD, related links) + `listing-page.tsx` (client: filter bar,
sort, list/map toggle) + `map-pane.tsx` (lazy-loaded map visual).

- **Search + filter bar**: sits below the breadcrumb bar, above the H1/sort
  row. One row — the address search input (icon on the right) first, then
  the region picker ("All of Sri Lanka", a real `<select>` of every distinct
  `project.city` in the current list — picking one filters the grid), then
  filter pills (For sale / Home type / Any price / 0+ beds / Construction
  status) centered in the middle, a "More filters" icon button, List/Map
  toggle pinned right. Region picker, search input, filter pills, and the
  List/Map toggle all share the same `52px` control height. Filter pills,
  the search input, and the sort pill are square (`border-radius: 0`) — the
  List/Map toggle is the one exception and stays a rounded pill. The
  "More filters" button (`SlidersHorizontal` icon,
  `.listing-filter-more-wrap`) opens a real dropdown panel
  (`.listing-filter-more-panel`) — same radio-button pattern as the
  floor-plan filter drawer (`.plans-filter-panel` in components.tsx) —
  restating the same filter groups; it isn't just a mobile-only CSS toggle.
  deliberate exception and stays a rounded pill (`border-radius: 999px`).
- **Sort control**: `.listing-sort-pill` — a small rounded pill
  (`↕ Recommended`, `ArrowUpDown` icon) sitting above the H1, not a
  right-aligned "Sort:" dropdown. In full map view (`viewMode === "map"`)
  the sort pill and the H1 are hidden (`.listing-content-shade[data-view="map"]`
  in globals.css) — there's no list to sort or label, so the map fills that
  space instead. The mobile Map/Filters icon buttons live in the same row
  and stay visible in map view; only the sort pill and H1 are dropped.
- **Header**: H1 uses `var(--font-ref-sans)` (Archivo) — not serif. Default
  page H1 (e.g. "New projects in Sri Lanka") is `32px` / `400` weight /
  `40px` line-height / `#202022`. When a map cluster or the search box
  narrows results, the H1 swaps to a smaller dynamic sentence
  (`.listing-header-h1-dynamic`, "There are N communities for sale in
  {place}") at `20px` / `28px` line-height. No eyebrow line, no intro
  paragraph under the H1 on this page type.
- **Page background**: `.listing-content-shade` — everything from the
  sort pill down through the card grid and map sits on a light grey panel
  (`#f5f5f4`), giving white cards visible contrast. No padding on the right
  edge of this panel (the map bleeds past it — see below); no padding on
  the bottom either, so the panel's bottom edge lands exactly on the map's
  bottom edge instead of leaving a grey strip under it.
- **Cards**: `.listing-grid-card` — vertical card, white background,
  status pill top-left on the image (dark translucent), save heart in the
  bottom row (not absolutely positioned over the image), "Featured" tag
  top-right of the image, then name / facts line / address / "Listed by
  {developer}" / price + save button below.
- **Layout**: list/map split via `grid-template-columns: 11fr 9fr` (not raw
  `55% 45%` — percentage columns plus a `gap` overflow the grid container by
  the gap width; `fr` units divide space left over *after* the gap).
  `align-items: start`. A List/Map toggle button pair swaps to full-width
  list or full-width map (CSS-driven, both panes stay mounted so content is
  always in the server HTML — never remove the list from the DOM for a "map
  view").
- **Page container width**: this page type uses a wider container
  (`--shell-width: min(1760px, calc(100vw - 48px))`, set on
  `.listing-page-shell`) than the sitewide header/breadcrumb bar
  (`min(1290px, calc(100% - 48px))`). Since the breadcrumb bar is a global
  component shared by every route, it gets a route-scoped
  `.site-breadcrumb-inner-wide` modifier (applied in `breadcrumb-bar.tsx`)
  so it still lines up with the wider content below instead of the sitewide
  width — matched by **exact** pathname against `mapSidebarRoutes`
  (`/projects`, `/land`, `/search`, and each category page), not a
  `.startsWith()` prefix check. A project/land *detail* page
  (`/projects/[slug]`, `/land/[slug]`, and their sub-routes) is a different
  page type — it reuses `ProjectHero`, whose `.listing-hero-panel` has its
  *own* width formula — so it gets a third breadcrumb modifier,
  `.site-breadcrumb-inner-detail`, matching *that* width instead. A
  `.startsWith("/projects")` prefix check would incorrectly give detail
  pages the listing pages' capped width and misalign the breadcrumb's edge
  against the panel below it on wide screens — this happened once already,
  worth remembering if this logic gets touched again.
  `.listing-hero-panel`'s own rule reads `width: calc(100% - 80px)`, but
  that `100%` is relative to its *parent* `.listing-hero`, which is itself
  capped at `min(1290px, calc(100% - 48px))` — not the raw viewport. Its
  true rendered width relative to the viewport is therefore the compound
  `min(1210px, calc(100% - 128px))` (1290-80 and 48+80 respectively), and
  that's what `.site-breadcrumb-inner-detail` needs to replicate. Copying
  just the panel's own `calc(100% - 80px)` in isolation — ignoring its
  parent's cap — looks identical at very wide viewports but drifts out of
  alignment by 48px below ~1338px wide; this happened once already too.
  A fourth instance of the same root cause: `.listing-hero-panel` swaps to a
  *completely different* mobile formula below 980px (`.listing-hero` itself
  becomes `calc(100% - 24px)`, then the panel is `calc(100% - 14px)` inside
  that — collapsing to `calc(100% - 38px)`, which `.project-page-content`
  already mirrors at that breakpoint). `.site-breadcrumb-inner-detail` had no
  mobile override at all, so it kept using the desktop `min(1210px,
  calc(100% - 128px))` formula on phones too — 64px of margin per side
  instead of 19px, clearly too indented next to the hero image below it. Any
  width formula copied from a desktop rule needs its own mobile breakpoint
  checked too, not just its desktop derivation.
- **Recurring bug pattern — breadcrumb vs. content-container width mismatch**:
  this has now happened three times (the two above, plus a third: the
  Developer/Architect/Construction Company/Marketing Company/Sales
  Company/Interior Designer profile pages). Every profile page shares
  `.developer-page` for its width — but `.developer-page` used to be
  `max-width: 1160px; padding: 36px 22px 90px` (a *different* formula from
  the breadcrumb's `width: min(1290px, calc(100% - 48px))`), so its content
  didn't line up with the breadcrumb above it. Worse, the non-Developer
  profile routes (Architects, Construction/Marketing/Sales Companies,
  Interior Designers) didn't even apply `.developer-page` to their page at
  all — `CompanyProfileDetailView` returns `.developer-profile` directly
  with no width wrapper around it, so it rendered edge-to-edge (full
  viewport width, no cap at all) until each of those 5 route files was
  fixed to wrap it in `<div className="developer-page">`, matching how
  `/developers/[slug]/page.tsx` already did it. `.developer-page` itself was
  also changed to the exact same `width: min(1290px, calc(100% - 48px));
  margin: 0 auto` formula as the breadcrumb (dropping the mismatched
  max-width+padding combo) so the two are now byte-for-byte identical, not
  just visually close. **Lesson, worth repeating:** when a bug report says
  two elements should "line up," don't eyeball a screenshot — measure both
  elements' `boundingBox()` via Playwright and diff the numbers. A visual
  pass has missed this exact bug at least twice this project.
- **Map**: real map — MapLibre GL (`maplibre-gl` + `react-map-gl/maplibre`)
  against OpenFreeMap vector tiles (`https://tiles.openfreemap.org/styles/liberty`),
  not a decorative visual layer. Always `next/dynamic(..., { ssr: false })`
  so it never blocks LCP. The map pane bleeds past the page container to the
  actual viewport's right edge (`margin-right` computed from a
  `--shell-width` custom property in length units, not a bare `%` — CSS
  Grid resolves percentage margins on a grid item against that item's own
  grid-area, not the grid container, so a plain `calc(50% - 50vw)` silently
  computes against the map's own ~45%-wide track instead of the full page).
  maplibre-gl's worker needs to be self-hosted (`setWorkerUrl` in
  `map-pane.tsx` pointing at `public/maplibre-gl-worker.mjs` +
  `public/maplibre-gl-shared.mjs`, re-copied from `node_modules/maplibre-gl/dist/`
  on any version bump) — Next's webpack config breaks the worker's default
  bundler-relative URL. Custom marker pins (`#f47b36` / active `#c85f24`),
  and a dark popup card (`ProjectPopup.tsx`, its own file) on click —
  `maplibregl.Popup` with `closeButton:false, maxWidth:'none'`, MapLibre's
  own tip/tail hidden via CSS.

**Convention going forward:** a new directory/listing-style page (more
project categories, more construction-company categories, anything with a
"filterable list of cards + intro copy" shape) should reuse this same shell
— add a config entry to the relevant `*-categories.ts` file and a thin
`page.tsx`, not a new one-off layout.

## Map sidebar (list+map pages)

A Google-Maps-style fixed left icon rail, `MapSidebar`
(`src/components/marketplace/map-sidebar.tsx`), mounted directly inside
`ListingPageBody` (`listing-page.tsx`) — so it appears on all 11 routes
that share that component (`/projects`, `/land`, `/search`, and the 8
`/projects/*` category pages), not just `/projects`. Desktop-only
(`@media (min-width: 900px)`, the same breakpoint `.listing-columns`
already collapses at); mobile gets `display: none` and is otherwise
untouched. Both states stay always-mounted — same "CSS-driven visibility,
never remove from the DOM" philosophy as the List/Map toggle above.

- **Rail** (`.map-sidebar-rail`, 72px wide, `#f5f5f4` background,
  `#d8d8d8` right border): quick-filter shortcuts (New Listings, Pre-Con,
  Residences, Villas, Waterfront, Apartments, Lands — fixed global
  shortcuts on every one of the 11 pages, not contextual to the current
  page) → Saved / Recents / Alerts / Compare icon buttons (icon + small
  label, active state inverts to a dark pill like
  `.listing-mobile-icon-btn`). No hamburger/nav-drawer or in-rail search —
  those were removed; site nav and search live only in the top header.
- **Panels** (`.map-sidebar-panel`, 320px, slides out to the right of the
  rail): mirror image of the existing right-anchored
  `.request-info-dialog`/`.plans-filter-panel` treatment — shadow cast
  right (`box-shadow: 12px 0 40px rgba(10,15,23,0.2)`) and
  `translateX(-100%) → 0` instead of those panels' `-12px`/`100% → 0`.
  Rounded-square `border-radius: 8px` thumbnails for these compact rows —
  a new convention distinct from the 14px plan-row / 0px filter-pill /
  999px pill radii already in use elsewhere.
- **Saved** and **Alerts** are gated by `useCurrentUser()`; signed-out
  state prompts via `useAuthModal()` (the same in-page modal the header's
  Log in/Sign up buttons use), never a `/login` route redirect.
- **Alerts** is real CRUD against `saved_searches` (added owner-scoped RLS
  in `supabase/migrations/20260831120000_saved_searches_rls.sql` — that
  table previously had zero policies). `is_active` is repurposed as the
  "email notifications" flag; no email actually sends (no provider/cron
  infra exists in this repo) — the toggle just persists for a future task.
- **Recents** reads `project_views` (anonymous, session-scoped, no direct
  client access) via a new `/api/recent-views` route using the
  service-role client, joined by the same `newhomessrilanka-session-id`
  localStorage key `view-tracker.tsx` already writes.
- **Compare** is entirely new and client-only: `useCompare()`
  (`src/lib/use-compare.ts`) stores up to 4 `{slug, basePath}` pairs in
  localStorage (a custom `window` event keeps every mounted instance —
  rail badge, panel, every card's toggle button — in sync within the same
  tab, since the native `storage` event only fires in *other* tabs). The
  "add to compare" button lives on the shared `ListingGridCard`, which
  also renders on `/land` — land parcels live in a separate `lands` table,
  so a new `/api/compare` route resolves slugs against both `projects` and
  `lands` (via `landToProjectShape`) and tags each result with its origin.
- **z-index 60** for the rail/panel — below `.auth-modal-backdrop`'s 300
  (the highest in the app), and nothing else on these 11 routes uses
  `position: fixed`.
- **Vertical position**: the rail starts below the header, not behind it —
  `top: 82px` (site-header's fixed height) / `height: calc(100vh - 82px)`,
  rather than `top: 0` / `100vh`. It still overlaps `.site-breadcrumb`
  below the header (see offset below), just not the header itself.
- **Layout offset**: reserving 72px on the left required two separate
  fixes, because `.listing-page-shell`/`.listing-map-pane` compute their
  width off raw `100vw` (not a parent-relative `%`), while
  `.site-breadcrumb-inner` is `%`-relative:
  - `.listing-page-shell`'s `--shell-width` and `.listing-map-pane`'s
    bleed margin both get the 72px subtracted directly in their `calc()`
    (a parent padding wouldn't reach a `100vw`-based formula).
  - `.site-breadcrumb` gets `padding-left: 72px` (gated by
    `mapSidebarRoutes` from `listing-categories.ts` — an exact path match,
    not the broader `.startsWith()` prefix check `site-breadcrumb-inner-wide`
    uses, since that would incorrectly also match detail pages like
    `/projects/[slug]` where the rail never renders) — its inner bar is
    already `%`-relative, so parent padding alone re-centers it correctly.
    `.site-header` no longer needs this offset since the rail now starts
    below it instead of alongside it.

## Homepage (`src/components/marketplace/home-client.tsx`)

Every project card on the homepage (the Featured Listings grid and the
carousel "shelves" like Trending) renders the same `ListingGridCard`
component used on `/projects` category pages (exported from
`listing-page.tsx`, imported into `home-client.tsx`) — status pill, save
heart, developer byline, address, and bed/sqft facts, instead of a
homepage-only card. `home-shelf`'s carousel arrows and `featured-listings`'s
grid wrapper are unchanged; only the card markup inside them was swapped.

The hero panel's headline/subheading come from the `copy[language]`
translation object (`t.heroTitle`/`t.heroSubtitle`) — don't hardcode English
text directly in the JSX, or non-English locales silently show English. A
row of quick category-link pills (`.hero-quick-links`, styled with the same
`.listing-filter-pill` class as the listing page's filter bar) sits below
the hero search box, linking to the real filtered category pages in
`listing-categories.ts` (`allProjectCategories`) — not the freeform
`/search?q=` page, which currently ignores its query string entirely and
just lists every project unfiltered, so any "filter" UI wired to it would be
non-functional. `/search`'s own filtering is a separate, not-yet-done piece
of work — see `FilterBar`/`SearchBar` in `components.tsx`.

**Convention going forward:** any new project card anywhere on the public
site should render `ListingGridCard`, not a new bespoke card — one card
component, one visual language, styled once in `globals.css`
(`.listing-grid-card*`).

## Key Features editor (project wizard, own step)

`Project.unitFeatures` (distinct from the checkbox building amenities above
it) is `KeyFeatureCategory[]` (`src/types/index.ts`) — an ordered list of
categories, each with a `label` and a list of `{ field, value }` items (e.g.
`{ field: "Kitchen", value: "Pantry cabinets" }`). Two categories are
built in (Indoor, Outdoor, keys `"indoor"`/`"outdoor"`, not removable from
the wizard); admins can add more via a text input + "Add" button, which get
a slugified `key` and are removable.

Editor layout (`ProjectWizard`'s own "Key Features" step, pink,
`src/components/dashboard/components.tsx`): a narrow left column of category
tabs (same active/inactive treatment as other admin tabs — `border-stone-900
bg-stone-900 text-white` active) each showing its non-empty item count, next
to the active category's item rows on the right. Each row has two dropdowns
— field name, then that field's value — both falling back to a free-text
input via a "Custom…" option so nothing is locked to the preset list.
Presets (`INDOOR_FEATURE_PRESETS`/`OUTDOOR_FEATURE_PRESETS`) only exist for
the two built-in categories, sourced from standard MLS/condo feature-sheet
conventions (Kitchen, Storage, Bathroom, Windows, Climate, Lighting,
Security, Connectivity, Laundry, Appliances, Flooring, Ceiling / Balcony,
View, Parking, Outdoor space, Landscaping) — a custom category gets plain
text inputs for both field and value since there's no domain preset for an
arbitrary category name.

Backward compatibility: projects saved before this redesign still hold the
legacy `{ indoor?: string[]; outdoor?: string[]; other?: string[] }` shape
in Supabase (jsonb has no schema to migrate it). Both the wizard
(`normalizeUnitFeatures`) and the public accordion
(`normalizeUnitFeaturesForDisplay` in `marketplace/components.tsx`)
transparently read either shape — a legacy `"Kitchen: Pantry cabinets"` line
parses into `{ field: "Kitchen", value: "Pantry cabinets" }` and lands
correctly in the Kitchen preset dropdown. Saving from the wizard always
writes the new shape, so a project migrates the first time an admin re-saves
it — no bulk migration script was run.

**Convention going forward:** any other admin field that's fundamentally a
list of named field/value pairs (not just free-text lines) should reuse this
category-tabs + preset-dropdown-with-custom-escape-hatch shape, not a
textarea.

## Import a project from a website / brochure (`/cms/import`)

Developer-facing onboarding shortcut (added 2026-09-08). `ImportListing.tsx`
(admin view, linked from the nav via `NavImportLink`) posts to
`/payload-api/import-listing` (`src/collections/endpoints/import-listing.ts`)
with a project page URL and/or a brochure PDF (≤4 MB upload; a PDF linked
from the page is fetched server-side up to 15 MB). The extractor
(`src/lib/listing-import/extract.ts`) is heuristic and conservative: title,
meta/paragraph description, `<li>` highlights, images (classified into
photos vs floor-plan images by alt/filename), brochure link, phones/emails,
address (JSON-LD first), city/district/type by vocabulary match, amenity
keywords, "N km to X" distances, unit/floor counts, move-in year, and a
"from Rs. X" starting price. Sizes, bedroom counts, other prices and
payment-plan lines are returned as **signals** for the developer to confirm —
never written into floor plans (Standing Rule 4: no invented numbers).
Photos are copied into R2 (`projects/<slug>/gallery|floor-plans|brochure/…`,
`src/lib/listing-import/mirror.ts`); the draft is created **unpublished**
under the signed-in developer (admins choose one) with `overrideAccess:
false`, so ownership rules still apply. Image-only PDFs (most brochures)
yield nothing but are stored as the brochure. Route handler has
`maxDuration = 60`.

## Lead alerts, pipeline and response time

**Alert.** Creating a lead in Payload (the `/api/leads` route mirrors every
Request-info / brochure request there; admins can add one by hand) fires
`notifyDeveloperOfLead` (`src/collections/hooks/lead-hooks.ts` →
`src/lib/lead-alerts.ts`): an email to the project's developer, and a
WhatsApp template message when the Cloud API is configured. Both name the
project and the floor plan the buyer asked from (`floor_plan`, set by the
plan page's dialog as "Unit A · 3 bed · 1,300 SqFt"), carry the buyer's
name / phone / email / preferred channel / message, and give one-tap
replies: **Reply on WhatsApp** (wa.me to the buyer with an opener), **Call**,
**Email**, plus a link to the lead in `/cms`. Recipients: Developers →
Lead alerts → Alert email (fallback Contact Email, then the linked
account's login email) and Alert WhatsApp number (fallback Social Links →
WhatsApp); the "Send instant lead alerts" checkbox turns them off. Alerts
never throw — a failed send is logged, the lead is still saved.

**Buyer confirmation.** The buyer gets their own email at once
(`src/lib/lead-confirmation-email.ts`): "Your request was sent to
<developer>", how they'll be reached, the developer's phone / email /
WhatsApp button, the listing link and My enquiries; Reply-To is the
developer's email so a reply goes straight to them. Always sent to the
address the buyer typed (test routing only concerns the developer's side);
brochure requests skip it because `/api/leads` already emails the
brochure. Logged on the lead as channel "buyer confirmation".

**Test routing — a trial inquiry can't reach a real developer.**
`resolveLeadAlertRouting` redirects the email to the test inbox, prefixes
the subject `[TEST — not sent to <developer>]` and skips WhatsApp when any
of these hold: not the production deployment (local dev and Vercel
previews — `VERCEL_ENV !== 'production'`; `LEAD_ALERTS_LIVE=true` forces
live); the admin switch **Lead alert settings → Mode = Test** (`/cms`
Settings; a red banner sits on the dashboard while it's on); the buyer
email is an admin account's email or on a test domain (resend.dev,
example.com, example.org/.net, test.com, mailinator.com); or
`LEAD_ALERTS_OVERRIDE_TO` is set. Test inbox: Lead alert settings → Test
inbox, else `LEAD_ALERTS_TEST_INBOX`, else delivered@resend.dev. So to QA
on the live site either flip the switch, or submit with your admin email
or a resend.dev / example.com address.

**WhatsApp Cloud API setup** (`src/lib/whatsapp-cloud.ts`; email works
without it): in Meta Business Suite create an app with the WhatsApp
product, add/verify the sending number, create a System User with a
permanent token, then set `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`
on Vercel. Business-initiated messages must be templates, so create and
submit one named `lead_alert` (language `en`, category Utility) with this
body and a URL button:

```
New lead for {{1}}
From: {{2}} ({{3}}) — prefers {{4}}
"{{5}}"
```
Button: *Open lead* → `https://www.lankanewhomes.com/cms/{{1}}` (dynamic URL).
Optional env: `WHATSAPP_LEAD_TEMPLATE` (default `lead_alert`),
`WHATSAPP_TEMPLATE_LANG` (default `en`), `WHATSAPP_API_VERSION` (`v21.0`).

**One-tap reply links = the answer signal.** The alert's Reply on
WhatsApp / Call / Email buttons are signed links
(`src/lib/lead-reply-links.ts`, HMAC of lead id + channel with
`PAYLOAD_SECRET`) through `/api/leads/reply`. A tap moves a "New" lead to
Contacted (stamping the response time and re-judging the badge), records
a `reply_events` entry and `first_reply_via`, then forwards — WhatsApp as
a redirect to wa.me, Call / Email via a tiny "✓ Marked as contacted" page
that opens tel: / mailto:. So replying the way developers already do is
what counts; changing the status in the CMS still works too
(`first_reply_via: cms`).

**Lead activity (admin).** `/cms/lead-activity` (nav link, admins only;
`src/collections/endpoints/lead-activity.ts` + `LeadActivity.tsx`): every
lead in the period with its alert trail (`alert_log`: channel, recipient,
sent/failed, live or test routing), status, first reply channel and
minutes, and a per-developer scoreboard (leads, awaiting, answered, avg
response, within-1-hour %, failed alerts, badge). Rows expand to the full
trail. The Leads list also shows `first_reply_via`, `response_minutes` and
`alert_summary` as columns. **Origin:** `/api/leads` stores where the
buyer was (`origin`: country / region / city from Vercel's `x-vercel-ip-*`
geo headers, device class, traffic source, referrer —
`src/lib/request-origin.ts`) and each reply tap records the developer's
country / city / device on its `reply_events` entry, so the page shows
"📍 Dubai, United Arab Emirates · mobile · Google Ads" under the buyer and
"from Colombo, Sri Lanka · mobile" on the reply. Blank on localhost and for
hand-added leads; non-LK buyers are tinted amber.

**Pipeline.** `status` on Leads is New → Contacted → Site visit → Closed
(`new | contacted | site_visit | closed`). The first move off New stamps
`first_response_at` and `response_minutes` (admin-only fields, written
with overrideAccess by `stampFirstResponse`) — that is the number a future
"responds within 1 hour" badge is built on. Status changes are mirrored to
the buyer's Supabase `leads` row via `supabase_lead_id`
(`syncLeadStatusToSupabase`; Supabase labels: New / Contacted / Site visit /
Closed). The `/cms` Analytics dashboard shows the pipeline counts, leads
awaiting reply, average and median first response and the share answered
within an hour (`src/lib/lead-pipeline.ts`, added to `/analytics-summary`).

**"Responds within 1 hour" badge** (`src/lib/response-badge.ts`). Earned,
never entered: over the last 90 days, every lead on the developer's
projects that is at least an hour old is judged; the badge holds when at
least 5 such leads exist and 80%+ were answered (moved off New) within 60
minutes. Unanswered leads count against it once they pass the hour, so
ignoring inquiries loses it. Stored on Developers → `response_stats`
(read-only, admin-only update; mirrored to Supabase as
`respondsWithinHour` / `responseStats`), recomputed when a lead is first
answered (`stampFirstResponse`) and weekly by the analytics-digest cron.
Shown as an emerald pill (`.badge-responder`, kind `responder` in the
hero's `extraBadges`) on project / floor-plan / land heroes, on the
builder card, and on the developer profile header; the Analytics
dashboard shows the standing ("3 of 5 leads judged · 100% within the
hour"). Thresholds are the constants at the top of that file.

**"Verified" badge.** Set, not earned: an admin sets `Developer →
Verification Status` to `approved` directly via the existing select field
in `/cms` (already mirrored to Supabase as `verificationStatus`; no
separate approve/reject UI was built — the select is the whole workflow).
Shown as a cyan pill (`.badge-verified`, kind `verified` in the hero's
`extraBadges`) in the exact same three spots as "Responds within 1 hour" —
project / floor-plan / land heroes, the builder card
(`StatsContactCard`), and the developer profile header — deliberately a
different hue (cyan, not indigo/blue) since indigo is already
`.badge-move-in-now` and blue is already used twice
(`.listing-hero-tag-move-in`, `.badge-quick-move-in`). Note this is
distinct from `Project.isVerified` (a separate, unrelated 7-item
per-listing verification checklist on the Verification tab) — this badge
reads `Developer.verificationStatus` only. No filter for verified
developers exists yet — `/developers` is a bare A–Z directory with no
filter UI at all today; left on `docs/todo.md` as a follow-up.

## Follow -> notification digest (weekly, buyer-facing)

Completes the promise on `/account/developments` ("see their new units and
price changes here" — was previously just placeholder copy, nothing was
ever sent). Runs from `src/lib/follower-digest.ts`, called from the
existing weekly analytics-digest cron (`/api/cron/analytics-digest`, same
Monday-08:00-UTC trigger as the developer digest and the response-badge
sweep) — no separate `vercel.json` cron entry, and no Payload instance:
followers are Supabase Auth buyers (`public.saved_developers`), not
Payload accounts, so this whole feature reads/writes Supabase directly and
sends mail via a plain `nodemailer` transport (the same `SMTP_*`/
`EMAIL_FROM` env vars Payload's adapter uses).

**Mechanism**: `project_notification_snapshots` (one row per project)
stores the last-notified `starting_price_lkr` / floor-plan count /
available-units / construction-update count. Each run diffs current
values against the snapshot — a project with no snapshot yet is seeded
silently (first run never "changes" against nothing) — then every project
gets its snapshot refreshed at the end, changed or not, so next week
diffs against today's reality.

**What counts as a change**: price change (either direction); floor-plan
count or available-units *increase* only (a decrease means units sold,
not newsworthy); a `constructionUpdates` count increase (newest 1–2
entries included, via the same `sortConstructionUpdates` helper the
timeline section uses, so "newest" means the same thing in both places).

**Preferences**: `profiles.notify_email` gates whether a follower gets
anything at all; `notify_price_changes`/`notify_new_properties` further
gate those specific lines. Construction-update lines have no dedicated
preference flag — always included once `notify_email` is on (a
deliberate default, since there's nowhere in Settings to toggle that
specifically). One email per follower per week, not one per project —
all of a buyer's followed developers' changes are grouped into a single
digest (`renderFollowerDigestEmailHTML`, `src/lib/follower-digest-email.ts`).

**Test routing**: reuses the same non-production guard as lead alerts
(`isProductionDeployment`, exported from `src/lib/lead-alerts.ts`) — a
local/preview run redirects every send to the test inbox
(`LEAD_ALERTS_OVERRIDE_TO`/`LEAD_ALERTS_TEST_INBOX`/`delivered@resend.dev`)
with a `[TEST — would go to …]` subject prefix, same as a lead alert would.
No new alert channel in this codebase is exempt from that guard.

## Listing completeness to-do

`src/lib/completeness.ts` is the single checklist (28 checks, equal
weight) behind `completeness_score`, the to-do panel at the top of the
project form (`CompletenessTodo`, a `ui` field reading live form values via
`useAllFormFields`) and the "Finish your listings" panel on the `/cms`
dashboard (`ListingTodoPanel` ← `/payload-api/listing-todo`, scoped to the
developer's own projects). Each unfinished item shows what it adds:
`SCORE_POINTS_PER_ITEM` to the score and `RANKING_POINTS_PER_ITEM`
(score × `COMPLETENESS_WEIGHT` from the ranking formula) to the ranking.
Adding a check: append to `COMPLETENESS_CHECKS` with an imperative label
("Add per-plan prices") and a hint naming the tab/field — every score on
the site changes on the next save, which is intended. The per-plan checks
(price, floor area, image, view + handover condition, units available) are
how the 2026-09-08 floor-plan fields get filled without chasing anyone.

## WhatsApp click-to-chat

Developers' Social Links → WhatsApp (a number in any format, or a wa.me
link) becomes a green **WhatsApp** button beside "Request info" in the
hero (desktop actions + mobile bar), a labelled row on the builder card
(`StatsContactCard`, dropped from the social icon strip so it isn't shown
twice) and a line on the sales-center card. `src/lib/whatsapp.ts`
normalises the number (local 07x → 947x) and builds the wa.me link with an
opener naming the project and plan. Clicks log a `whatsapp_click`
Analytics event (`/api/events/whatsapp-click`), bump
`whatsapp_click_count` on the project and show as "WhatsApp clicks" on the
dashboard — same path as phone clicks. No number, no button.

## Move-In Year picker (CMS)

`completionYear` on Projects is still a plain number in the database, but
the admin form renders it with `YearPickerField`
(`src/components/payload/YearPickerField.tsx`) — Payload's own `DatePicker`
element in react-datepicker's year-grid mode, so it looks like the
Sales-started / Construction-started pickers beside it. It stores `2030`,
not a date, so the Supabase sync, `isUpcomingMoveIn` and the "Move in 2030"
badge are untouched. The grid pages in blocks of 15 years (2026–2040 first,
earlier years one "previous" click back); range 2000 to this year + 15.
Reuse it for any other field that stores a bare year: point
`admin.components.Field` at it and regenerate the import map
(`npx tsx scripts/generate-payload-importmap.ts` — that script loads
`.env.local` itself and refuses to run without `R2_*`, because a map
generated without the R2 plugin registered loses
`S3ClientUploadHandler` and the whole admin renders blank).

Related fix (2026-09-08): the admin "create" view asks collection `create`
access for permission with an empty `data: {}`; `ownDeveloperAccess` used to
read that as "developer not owned" and every developer got an Unauthorized
page instead of the project form. It now only checks the relation when one
is actually submitted, and Projects' `beforeValidate` fills `developer` in
for developer users who leave it blank.

## Project wizard step isolation (admin, `ProjectWizard`)

`ProjectWizard` (`src/components/dashboard/components.tsx`) shows exactly one
step's content at a time — clicking a step in the left nav (`selectStep`)
shows only that step's fields; every other step's box is hidden via a
`stepVisible(index)` helper (`step === index ? "" : "hidden"`) appended to
its className. Sections stay **mounted** (never conditionally unmounted) so
uncontrolled/ref-backed inputs on a step you've navigated away from don't
lose their in-progress value — only CSS `display: none` (Tailwind `hidden`)
toggles visibility.

Each of the 13 steps keeps a distinct colored box (`border-{color}-200
bg-{color}-50`): slate (Project Information), emerald (Location), amber
(Pricing), cyan (Apartment Details), purple (Amenities), pink (Key
Features), lime (Gallery), yellow (Floor Plans), indigo (Neighborhood), teal
(Contact), fuchsia (SEO), violet (Preview), orange (Publish). A few steps
have more than one colored box (e.g. Project Information also covers the
slate "Badges" box and the rose "Connected Pages" box; Apartment Details
also covers Parking and the Floors/Carpark/Avg floor area box) — every such
extra box carries the same `stepVisible(N)` call as its parent step so it
hides/shows in lockstep. The Neighborhood step holds the "Nearby places"
editor (feeds the public `NeighborhoodSection` accordion) — moved out of
Location, which keeps only the cascading Province/District/City/
Neighborhood-name dropdowns. The Key Features step holds the left-tab
indoor/outdoor/other editor described above — moved out of Amenities, which
keeps only the building-amenity checkboxes.

**Convention going forward:** a new field group belongs inside an *existing*
step's colored box (tagged with that step's `stepVisible(N)`) rather than a
new untracked sibling div — an untracked box with no `stepVisible` call would
stay visible on every step, breaking the single-step-at-a-time behavior. If a
group is genuinely a new step, add it to the `steps` array, give it a new
`sectionRefs.current[N]` + unused color, and update every index after it.

`LandWizard` (`src/components/dashboard/land-wizard.tsx`) is a second,
separate wizard for the `Land` inventory type, built from scratch using this
same step-isolation shape (`stepVisible`, one colored box per step) rather
than the older scroll-to-anchor approach — any brand-new wizard should start
from this pattern directly instead of the pre-Neighborhood-step version.

## Stats chips vs fact sheet (project, floor-plan, plot pages)

Two places on a detail page list facts: the icon **chips** right under the
hero (`ProjectStatsChips`, `.listing-hero-stats-chips`) and the 2-per-row
**fact sheet** under Overview (`ProjectNarrativeDetails`,
`.project-fact-sheet`). The split, decided 2026-09-07:

- **Chips = the listing-card facts** a buyer filters on — short, one-line
  values only. Project default (max 8 desktop, first 6 on mobile, in this
  order): Price range · Property type · Beds · Baths · SqFt · Listing status ·
  Move-in year · Total units. **Overflow** (added 2026-09-08): when a default
  has no data the next of Floors · Construction status · Ownership · Parking
  · Units available · Floor plans · Sales started fills the slot, so the row
  stays full. Land plot pages: Price · Property type · Plan type · Beds ·
  Baths · Perches · Status · Move-in year, overflow Ownership · Interior size
  · Balcony · Parking. (Project floor-plan pages have their own set — see
  "Floor plan page facts & chips".)
- **Fact sheet = the full reference table**, in this fixed order (set by the
  owner 2026-09-07): Property type · Listing status · Construction status ·
  Sales started · Move-in year · Price range · Avg unit price · Per SqFt
  (Avg) · Incentives · Total units · Units available · Units sold · Floors ·
  Floor plans · Beds · Baths · SqFt · Avg floor area · Ceilings · Ownership ·
  Parking · Carpark levels · Security · Electricity · Tap water · Address ·
  Road · Area · Neighborhood · District — then the rows that weren't in that
  list: Construction started, Developer, Architect, Marketing company, Sales
  company, Interior designer (profile links). A row is skipped when its
  field is empty. Units available/sold come from the `availableUnits` /
  `soldUnits` fields, never from counting plan types; "Per SqFt (Avg)" is the
  developer's `averagePricePerSqft` text, never computed.
- **Mobile fact sheet (≤980px)** is a shorter list in its own order
  (`MOBILE_FACT_SHEET_ORDER`): Property type · Listing status · Construction
  status · Move-in year · Price range · Per SqFt (Avg) · Beds · Baths · SqFt ·
  Total units · Floors · Ownership · Parking · Address · Neighborhood ·
  District. Both tables render (`.project-fact-sheet-desktop` /
  `.project-fact-sheet-mobile`); CSS shows one per breakpoint.
- **Column-major fill**: the two columns fill top-to-bottom — first half of
  the ordered list down the left column (top priority), second half down the
  right (least) — not left-to-right across each row.
- **Repeating is fine for headline facts** (Price range, Beds, Baths, SqFt,
  Listing status, Total units/Floors appear in both). Long text (Address,
  Electricity, Tap water, Ceilings, Security) never becomes a chip by
  default — Address is already in the hero location line.
- **One name per field, everywhere** (chips, fact sheet, admin picker):
  "Move-in year" (not "Move in" / "Completed in"), "Construction status" (not
  "Building status"), "Property type" (not "Building type" / "Project type"),
  "Total units". Chip *keys* are the stored picker enum values and never
  change; the display name comes from `STAT_DISPLAY_LABEL` in
  `components.tsx`, and the Payload options carry matching `label`s.
- **No derived numbers as chips**: "Per SqFt (Avg)" (price ÷ first plan's
  size) is retired. The only derived value is the project SqFt range, which
  is just min–max of the developer's own per-plan sizes
  (`deriveFloorAreaRange` in `project-store.ts`) and is overridden by a typed
  `floorAreaRange`.
- The per-project admin pickers (`desktopVisibleStats`, `mobileVisibleStats`,
  `floorPlanVisibleStats`) still override everything (cap 10) — the defaults
  only apply when a picker is empty, so a new project looks right unconfigured.
- Mobile: `.stats-chips-mobile-limited` on the wrapper hides chips without
  `.mobile-stat-visible` at ≤980px. The land page's hand-built chip row
  doesn't use the wrapper class and is unaffected.

## Amenities section — show-all, and what counts as an amenity

`AmenitiesShowcaseSection` renders the first 8 amenities and a "Show all
amenities (N)" button (same `.plans-more-btn` as the floor-plans section)
for the rest — it used to be a silent `slice(0, 8)`, so a listing with 21
published amenities (Waterfall Residencies) showed 8 with no hint the
others existed. The list column is already `max-height: 540px; overflow-y:
auto`, so the expanded list scrolls rather than stretching the section.

**Amenity vs. Key Feature (owner rule, 2026-09-11):** any shared or on-site
facility — pool, kids pool, gym, roof terrace, jogging track, BBQ area,
clubhouse, courts, playground, concierge, pet-friendly, etc. — is an
*Amenity* (the fixed `AMENITY_NAME_OPTIONS` vocabulary in
`shared-fields.ts`; extend it when a developer publishes a real facility
that isn't there, keeping the type union, `amenityIcons` map and
`AMENITY_SYNONYMS` in step). Key Features is for per-unit build/finish
content, and each item must be `Field: value` — the source is the
brochure's "Specifications" page (Sub Structure / Roof & Ceiling / Finishes
/ Plumbing / Doors & Windows / …), not the website's loose bullet list.
Enum values can't contain an apostrophe (Drizzle's `ALTER TYPE … ADD VALUE`
emits it unescaped and fails) — hence "Kids Pool", not "Kids' Pool".

## Hero grid vs. amenity / plan images

`ProjectHero` builds its photo grid and lightbox from `heroImage` + `gallery`,
but skips any gallery item whose URL is under `projects/<slug>/amenities/` or
`projects/<slug>/floor-plans/`. Those folders are for images the Amenities
section (matched by label) and the Floor Plans section pick up — a pool
table or a gym render is not a property photo (owner's call, 2026-09-08).
So when mirroring a developer's images: exterior / interior / beach / street
photos → `gallery/`, facility photos → `amenities/` with the amenity name as
the label, plan drawings → `floor-plans/`.

## Floor plan page facts & chips

Three developer-published extras added 2026-09-08, all on `FloorPlan` and
all rendered as fact-sheet rows only when set: `floorAvailability`
(per-floor sold/available → "Available floors: 2, 28 (of 28 floors)"; skip
it when a tracker shows every floor sold on a project that is still
selling — that's a placeholder), `planDocuments` (the developer's own
"Download floor plan ft² / m²" files → "Downloads" links) and `landPerches`
(villa plot size → "Land extent: 8.15 perches").

The floor-plan detail page (`/projects/{slug}/floor-plans/{plan}`) shows
*plan-level* facts, not the project's — `FloorPlanStatsChips` +
`FloorPlanFactSheet` in `src/components/marketplace/floor-plan-facts.tsx`,
set by the owner 2026-09-08. Every value is a field on the plan in Payload
(Projects → Floor Plans); empty fields drop out; nothing is derived (Price
per SqFt is the developer's own figure, never price ÷ size).

- **Chips** — desktop max 8: Plan type · Beds · Baths · View · Aspect ·
  Furnishing · Quick move-in · Availability. Mobile max 6: Plan type · Beds ·
  Baths · View ("Sea", not "Sea View") · Quick move-in ("Quick MI") ·
  Availability — aspect is desktop-only because view already says what a
  buyer cares about. When a primary chip has no data the overflow list
  fills in, in order: Handover condition · Parking · Maid's room · Corner
  unit. Two rows render; CSS shows one per breakpoint
  (`.stats-chips-desktop-only` / `.stats-chips-mobile-only`).
- **Fact sheet** — desktop order: Plan type · Beds · Baths · Ensuite baths ·
  Powder room · Total SqFt · Interior SqFt · Balcony SqFt · Terrace SqFt ·
  Ceiling height · Floor range · Aspect · View · Price LKR · Per SqFt ·
  Maintenance / mo · Deposit · Parking · Parking type · Storage · Utility
  area · Maid's room · Pantry · Handover condition · Furnishing · AC
  provision · Hot water · Floor finish · Units in plan · Units available ·
  Availability. Mobile order: Total SqFt · Interior SqFt · Balcony SqFt ·
  Per SqFt · Maintenance / mo · Floor range · View · Ceiling height ·
  Parking · Storage · Utility area · Maid's room · Handover condition ·
  Furnishing · Units available · Availability. Column-major, same table
  shell as the project fact sheet.
- The admin `floorPlanVisibleStats` picker no longer affects these pages
  (only land plot pages, which still use `ProjectStatsChips`).

## Similar listings (bottom of every detail page)

The last section on the project, floor-plan, land and plot pages, directly
under the builder/contact card (`StatsContactCard`), is
`SimilarListingsSection` (`src/components/marketplace/similar-listings.tsx`):
the same boxed shell and 4-up card grid as the neighborhood page's "New homes
in …" (`.developer-projects-section` + `ListingGridCard`), titled "Similar
listings". Projects show similar projects, land pages show similar land
(`basePath="/land"`). Ranking lives in `src/lib/similar-listings.ts`
(`pickSimilarListings`): same neighborhood > same city/district > same type >
starting price within ±35% > same status, ties broken by Featured then name,
padded with other published listings so the grid fills. It is pure selection
over existing fields — nothing is computed about a listing — and renders
nothing when there is no other listing to show. On mobile it's one card per
row (`.similar-listings-section .home-card-grid` overrides the shared
`.home-card-grid`'s 2-column mobile default, scoped to this section only —
the homepage/neighborhood/builder grids keep 2 columns).

## Languages (Sinhala / Tamil listing content)

The header language toggle (`LanguageProvider`, localStorage key
`newhomessrilanka-language`, `en | si | ta`) now reaches listing pages in
two layers:

- **Fixed UI strings** — section headings, nav pills, chip and fact-sheet
  labels, statuses, property types, "From Rs. …", "View more", badges —
  are translated from a dictionary keyed by the English string:
  `src/lib/i18n/listing-strings.ts`. Client components call
  `useListingT()` (`src/lib/i18n/use-listing-t.ts`) and wrap text in
  `t("Beds")` / `tPrice("From Rs. 45 M")`; a server component with one
  heading uses `<T>Similar listings</T>` (`src/components/layout/t.tsx`).
  Unknown strings fall back to English unchanged, so a missing entry never
  blanks the UI. `"3 Bed"`-style values translate the word and keep the
  number.
- **Per-project prose** — summary, highlights and description — comes from
  the project's **Translations** tab in the CMS (`translations.si.*`,
  `translations.ta.*`). `localizedProjectCopy(project, language)` picks
  each field in the current language and falls back to English field by
  field, so a project with a Sinhala summary but no description yet still
  reads correctly. Nothing is machine-translated at runtime.

Fonts: Archivo has no Sinhala/Tamil glyphs, so `--font-app` /
`--font-ref-sans` list "Noto Sans Sinhala" / "Iskoola Pota" /
"Sinhala Sangam MN" and "Noto Sans Tamil" / "Latha" / "Tamil Sangam MN"
after the Latin faces — the browser falls through per glyph. Names,
addresses and numbers stay as entered.

When adding a new fixed string to a listing component, add it to both
dictionaries in `listing-strings.ts` in the same change.

## Land detail page (`/land/{slug}`)

Deliberately reuses the *same* CSS classes as the project detail page
(`src/app/projects/[slug]/page.tsx` via `ProjectHero`/`ProjectStatsChips`/
`ProjectDescriptionSection`/`ProjectNarrativeDetails`/`StatsContactCard`)
rather than inventing new land-specific styles: `.listing-hero-sticky-bar` +
`.listing-hero-nav-back` for the back link, `.listing-hero-grid`/
`.listing-hero-grid-main`/`.listing-hero-grid-side` for the hero photo,
`.listing-hero-panel` + `.listing-hero-title-wrap` for the title/byline,
`.listing-hero-tags` + `.listing-hero-tag-status` for the status pill,
`.listing-hero-stats-chips` for the fact row, `.project-description-shell`
for each body section (Overview, Payment Plan, Site Plan, Gallery, Nearby),
`.project-narrative-shell`/`.project-fact-sheet`/`.project-fact-label` for
the 2-per-row Details table (Project's "fields section" equivalent — land
use, status, district/city/province, road, electricity, water, title, seller
— same table markup as `ProjectNarrativeDetails`), and `.stats-contact-card`
for the seller/contact block. It does *not* reuse `ProjectHero` itself (photo
lightbox, floor-plan/amenities section nav, save-listing button) or
`RequestInfoDialog` (tied to project leads) — those are meaningfully
project-specific; land only needed the shared visual shell.

Land has no floor-plan *types* (it's raw land, not units), so the "Floor
Plans" section's equivalent is a **Site Plan** section: any gallery image
whose label matches `/block\s*plan|site\s*plan|road\s*map/i` renders there
instead of the general Gallery grid — mirrors how `ProjectHero` already
pulls labeled "Block Plan"/"Road Map" images out of a project's gallery for
its own hero pills.

The `id="pricing"` section reuses `PricingInformationLayout`'s exact inline
dot-grid-background card styling (copied inline into the land page rather
than extracted into a shared component, since it stayed simple enough not to
justify the refactor) — "Pricing and fees" card (price, price-per-perch
range) plus a "Deposit Structure" card (payment plan lines).

`land.facilities` (`Land["facilities"]`) is the Amenities-equivalent — plain
checkbox-selected parcel characteristics (Wide Road, Corner Plot, Gated
Community, etc.), not building amenities, rendered as a simple bordered-chip
grid (`src/app/land/[slug]/page.tsx`, mirroring the plain `AmenityGrid`
component's markup rather than the interactive `AmenitiesShowcaseSection`,
which is tightly coupled to `Amenity["name"]`'s fixed vocabulary and
per-amenity gallery-image matching that doesn't apply to land). Land and
plot pages render `KeyFeaturesSection` from `land.unitFeatures` when it has
content and render nothing otherwise — the section is never shown empty.

**Convention going forward:** any new single-item detail page (a future
inventory type beyond Project/Land) should reuse this same class set for the
hero/stats/description/contact shell rather than a new bespoke layout.

## Colors & type

- Neutral palette: Tailwind `stone-*` for body chrome (borders, muted text).
- Accent orange: `#f47b36` (active tab underline, primary CTA buttons — header
  "Sign up", hero search submit, etc.). Not `#ffc52d` — that gold value only
  exists in the unrelated `listing-preview` module and isn't part of the
  main site's palette; don't introduce it into new work.
- Pill palette: green `#1a6b2f`/`#e8f4e8`, blue `#1a53a3`/`#e8f1fd`, red
  `#c0392b`/`#fdeaec`, purple `#4338ca`/`#eef2ff`.
- No serif anywhere on the site — every heading, including listing-page
  H1s, uses the site's default sans stack (`var(--font-ref-sans)`, Archivo).
  A leftover `font-family: Georgia, "Times New Roman", serif` on a listing
  H1 is a bug, not a variant to preserve.

### Type scale

Font: Archivo everywhere (`var(--font-ref-sans)`, set on `body`), standing in
for the original Neue Haas Grotesk reference — new rules should reference
`var(--font-ref-sans)` rather than a hardcoded font name.

- **Major section headings** (a page's own H1 inside a hero/intro panel —
  "Find the City For You", the project detail "Overview" heading,
  "Amenities", "Key Features", "Plans & Homes", the homepage's featured
  listings head): `32px` / `400` weight (not bold) / `1.15` line-height /
  `#1f1f1f`. `26px` on mobile (`max-width: 760px`) — every one of these
  sections should carry this exact mobile size too, not its own one-off
  value. These are two different roles that both currently use an `<h2>`
  or `<h1>` tag depending on the section — match by role (does this
  heading introduce a whole content block on the page?), not by tag name.
- **Body copy / links / list-item labels** ("View more cities", "Explore
  {neighborhood} neighborhood", paragraph text): `14px` / `400` weight /
  `20px` line-height. This is `body`'s own default (`src/app/globals.css`),
  so most text inherits it for free — only re-declare it explicitly on an
  element that needs to survive being nested inside something with a
  different font-size (e.g. a link sitting inside a larger heading block).
- **Small emphasized labels** (stat-chip values, card sub-headings):
  `14px`–`15px` / `600` weight. Amenity names specifically are the same
  size but `400` weight (not bold) — `.amenities-showcase-item-copy
  strong`, despite the tag.
- **Muted meta/caption text** (stat-chip labels, hours-of-operation rows,
  helper text under an image): `12px`–`13px` / `400` weight.
- Never jump a label past ~15px on a narrower breakpoint just because
  there's more vertical room — that was the bug in
  `.amenities-showcase-item-copy strong` (15px desktop, mistakenly 20px on
  mobile). A mobile override should only change a size when the *mobile*
  layout specifically needs it (e.g. a hero H1 shrinking to fit), not as a
  reflex — when in doubt, carry the desktop size over unchanged.

**Convention going forward:** before sizing any new small label/link, check
this scale first and reuse the closest existing value instead of picking a
new one — and when two elements are meant to look identical (e.g. two
"explore more" links in different sections), give them the *same CSS class*
rather than duplicating the declaration, so a future edit to one style
updates both automatically.

## Where things live

- Shared detail-page hero/nav: `src/components/marketplace/components.tsx`
  (`ProjectHero`, `ProjectDescriptionSection`, etc. — most take override
  props rather than being duplicated per page). `ProjectHero`'s media pill
  bar (Photos/Videos/Map/Plots/Road Map/Block Plan/Street View) is the
  pattern for "extra media that isn't a whole page section" — Block Plan
  images, Road Map images, and (land-only) video links surface there via
  optional `roadMapImages`/`blockPlanImages`/`videoLinks` props (each opens
  the shared lightbox) rather than as standalone sections lower on the page.
  Projects also have their own `blockPlanImages`/`roadMapImages` array
  fields (same shape as Land's, added 2026-09-10) — pass them the same way
  (`roadMapImages={project.roadMapImages ?? []}`) at every `ProjectHero` call
  site for a real project (`projects/[slug]/page.tsx`,
  `components/listing-preview/listing-preview.tsx`; the per-floor-plan
  sub-page deliberately doesn't, same as Land's plot sub-page). When the prop
  is empty, `ProjectHero` falls back to scanning `project.gallery` for a
  single item labeled `/block\s*plan/i` / `/road\s*map/i` — a project with
  older, label-matched gallery photos (rather than the dedicated fields)
  still gets one pill each this way, just not more than one image per type.
  Prefer the dedicated fields for anything new: they support multiple images
  and don't depend on an exact label string. A gallery photo sitting under a
  `/block-plan/` or `/road-map/` R2 folder isn't picked up by either
  mechanism automatically — folder placement is just a storage convention,
  someone still has to either label it correctly or move it into the
  dedicated field (`scripts/_tmp-migrate-blockplan-roadmap.ts`, since
  deleted, did this in bulk for the Prime Lands/Rush batch).
- Listing/category page system: `src/lib/listing-categories.ts`,
  `src/components/marketplace/listing-shell.tsx`,
  `src/components/marketplace/listing-page.tsx`,
  `src/components/marketplace/map-pane.tsx`.
- Map sidebar: `src/components/marketplace/map-sidebar.tsx`,
  `src/lib/use-compare.ts`, `src/lib/use-saved-searches.ts`,
  `src/lib/use-recent-views.ts`, `src/app/api/recent-views/route.ts`,
  `src/app/api/compare/route.ts`.
- Admin/developer dashboard pages all share one wrapper pattern
  (`grid gap-4 px-4 pt-6 pb-16 lg:grid-cols-[220px_1fr] lg:px-6 lg:pt-8` +
  `DashboardSidebar` + `DashboardHeader`) — keep new admin pages consistent
  with this rather than custom padding per page.
- `DashboardSidebar` (in `src/components/dashboard/components.tsx`) renders
  `ADMIN_NAV_LINKS` by default — a single shared list. Add a new admin
  section there once rather than editing every `/admin/*` page's inline
  `links` array (that duplication is what caused the nav to drift out of
  sync across pages before this convention).
- `RequestInfoDialog` (`src/components/marketplace/components.tsx`) has a
  `variant?: "standard" | "inquiry"` prop. `"inquiry"` swaps in the "Send us
  your inquiry" copy/field order (Name, Email, Contact Number with a fixed
  🇱🇰 +94 prefix, Message, a "keep me posted" opt-in) — currently used only
  on the land detail page via `ProjectHero`'s and `StatsContactCard`'s own
  `requestInfoVariant` prop. Everything else keeps the original "Contact Us"
  layout. The dialog's own chrome/colors (centered modal, orange accent)
  were kept as-is rather than copying a reference screenshot's slide-out
  panel — only field content/copy was matched.
- Partner directories linked from a project's "Connected Pages" section
  (architects, marketing companies, sales companies, interior designers) all
  share one `CompanyProfile` shape (`src/types/index.ts`), one store factory
  (`src/lib/company-profile-store.ts`), one API route factory
  (`src/lib/company-profile-api.ts`), one admin form
  (`src/components/dashboard/company-profile-form.tsx`), and one pair of
  public list/detail views (`src/components/marketplace/company-profile-views.tsx`,
  a client component — needed because it renders `SOCIAL_ICON` lookups from
  `marketplace/components.tsx`, a `"use client"` module, and indexing into a
  client-module export from server code silently resolves to `undefined`
  rather than the real value). `CompanyProfile.officeHours` reuses the same
  `OfficeHoursEntry` shape/editor as `Developer.officeHours` — the
  `OfficeHoursEditor`/`buildInitialOfficeHours`/`weekDays` helpers
  (`src/components/dashboard/components.tsx`) and the `formatOfficeHours`
  formatter (`src/lib/format.ts` — deliberately in a non-`"use client"`
  module so both server and client components can call it directly) are
  shared rather than re-implemented per entity type. Construction companies
  predate this convention and stay separate (they have their own category
  sub-pages) — don't fold them in without asking.
- SEO/keyword conventions: `docs/seo-strategy.md` (separate file — that one
  is about metadata/keywords/URLs, this one is about visual/UI patterns).

## Payload admin (/cms) sidebar groups

Every collection sets `admin.group` so the `/cms` sidebar reads as named
sections instead of one flat alphabetical list:
- **Users & Team**: Users, Team Members
- **Properties**: Projects, Lands, Neighborhoods
- **Companies & Professionals**: Developers, Construction Companies, and the
  four `directoryCollection()`-built directories (Marketing Companies, Sales
  Companies, Architects, Interior Designers) — the group is set once on the
  shared helper (`shared-fields.ts`) rather than per file for those four.
- **Leads & Engagement**: Leads, Saved Listings, Reviews
- **Business**: Payments, Placement Pricing, Analytics
- **Content**: Articles, Media, Hero Slides

Globals aren't part of this — Payload lists them in their own sidebar
section regardless of collection groups. `LeadAlertSettings` already sets
`admin.group: 'Settings'` (predates this pass); `SiteSettings` stays
ungrouped, which is what puts it under the default "Globals" heading. When
adding a new collection, put it in the matching group above rather than
leaving it ungrouped (ungrouped collections get dumped in an unlabeled
overflow section above the named groups).

## /for-developers (developer-acquisition landing page)

First standalone marketing/B2B page on the site (2026-09-09) — not a
filtered listing page, so it doesn't follow the config-driven
category-page factory pattern; it's plain server-rendered JSX with no
client component (the page has no interactivity that needs JS — a small
CSS-only badge preview is the only "demo" element).

**Visual pattern, new for this page but meant to be reused** for any future
marketing/landing page: a dark hero (`#1c1c20`, matching the footer, white
text, orange `#f47b36` eyebrow/CTA) bookended by a matching dark closing CTA
band, with light `.fd-section` content bands in between reusing the
existing `.{feature}-shell` light-card look (`#f7f7f6` background, `#e5e5e4`
border) rather than inventing a new palette. Class prefix `.fd-*`.

**Content rule for any future page like this**: no invented statistics,
testimonials, "trusted by" logos, or dollar figures — there's no
authoritative live count of developers/projects/leads anywhere in the
codebase to cite, and `PlacementPricing`'s current rows are seed-script
placeholder prices, not real rates (see `scripts/seed-placement-pricing.ts`
header comment). Every claim on the page traces to a real, currently-live
mechanic (lead alerts with one-tap reply links, the `Developer.verification_status`
badge, `response_stats`-driven "Responds within 1 hour" badge, the
Analytics dashboard, free WhatsApp click-to-chat, the brochure/website
import tool, the completeness-score ranking boost, the follower digest) —
lean on specific real mechanics instead of social proof that doesn't exist
yet.

Linked from: footer brand-column CTA, footer "For developers" column (new
"Why list with us" link, above "Register"/"Developer login"), and
`/about`'s developer paragraph. All three used to jump straight to the bare
`/developers/register` form.

**`/web-design`** (2026-09-10) reuses this same `.fd-*` system for a second,
unrelated offer — custom project websites, separate from a marketplace
listing. New `.fd-hero-grid-single` variant (single centered column, no
photo) for pages with no real listing image to show. Linked from the
`/for-developers` and `/web-design` CTA bands into each other ("List your
project instead" / "See what we do for websites") and from the footer
"For developers" column.

**`.fd-feature-grid`/`.fd-feature-card`/`.fd-feature-icon`** (service/feature
cards — same look as `.fd-lead-step`: `#f7f7f6` background, `#e5e5e4`
border, `4px` radius, orange `#f47b36` icon) is the reusable grid for a
plain "here's what's included" list on any `.fd-*` page. It briefly existed
only as responsive overrides with no base rule — `/for-developers` moved its
own feature list to the `ForDevelopersFeatures` accordion component and the
base `.fd-feature-grid` CSS was deleted in that pass, silently breaking
`/web-design` (still using the old plain grid) until caught and restored
2026-09-10. `.fd-feature-grid.fd-compare-grid` is a 2-column variant for a
short side-by-side (e.g. "a listing vs. a website").

**CSS Grid + `white-space: nowrap` gotcha**: `.fd-hero-stats` reuses
`.listing-hero-stat-chip`, whose label is `white-space: nowrap` (by design —
it's meant to ellipsis-truncate on the listing hero's own light background).
A grid track sized as bare `1fr` still respects each item's *default*
`min-width: auto`, which for a nowrap label is its full unwrapped text
width — so a long stat label (fine on the listing hero's 5-column
`minmax(0, 1fr)` grid) forced `.fd-hero-stats`' `repeat(4, 1fr)` grid to
overflow the whole page horizontally on mobile once a longer label was
used here. Fixed by switching every `.fd-hero-stats` track to
`minmax(0, 1fr)` (base + both breakpoints). Applies generally: any grid
column holding `white-space: nowrap` content needs `minmax(0, 1fr)`, not
bare `1fr` — `.listing-hero-stats-chips` already did this correctly; this
`.fd-*` copy didn't.

**Mobile nav menu breathing room** (`.mobile-menu-panel`, `globals.css`):
panel padding is `28px 20px 32px` (was `16px 20px 24px` — too tight right
below the header divider), and `.mobile-menu-actions` /
`.mobile-menu-language.language-segmented` padding/margin around Log
in/Sign up and the language switcher is `22px` (was `16px`) — those two sit
back-to-back at the bottom of the panel and read as cramped together at the
tighter spacing.
