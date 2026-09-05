# Design Reference — LankaNewHomes

Living reference for UI conventions established across the site. Check here
before building a new page or component so new work matches existing
patterns without the user having to repeat instructions. Update this file
whenever a new convention is set or an existing one changes.

## Brand / logo

Site brand is "LankaNewHomes" (contact: lankanewhomes@gmail.com, canonical
domain: lankanewhomes.com — set as `FALLBACK_SITE_URL` in `src/lib/seo.ts`).
Logo is an
image asset at `public/logo.svg` (orange house-badge icon + wordmark),
rendered via `next/image` in the Header (`.site-logo-img`, dark wordmark) and
Footer (`.footer-logo-img`, inverted to white via CSS `filter` for the dark
footer background) in `src/components/marketplace/components.tsx`. Replace
`public/logo.svg` directly to change the mark; both header/footer pull from
the same file.

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

The single wide-photo view (`.listing-hero-image-trigger` / `.listing-hero-image`)
is no longer the default but is still used by the explicit "Photos" tab
browse mode (clicking that tab in the toolbar below the hero) — that markup
wasn't removed, just no longer shown first.

This only changes the *default* view (`activeMedia === null`, before the
visitor picks a tab). The tab bar below the media area — Photos / Videos /
Map / Block Plan / Road Map / Interactive map / Virtual tours — and the full
lightbox gallery are unchanged either way.

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
| Move-In Now / Quick Move-In / Featured | `.listing-badge-pill` (hero) / `.home-card-badge-row span` (cards) / `.plans-home-badge-row span` (floor plan cards) | Purple |

Badges are driven by `Project.isFeatured`, `Project.isMoveInNow`, and
per-floor-plan `FloorPlan.quickMoveIn` — set in the project editor's
"Badges" box.

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
per-amenity gallery-image matching that doesn't apply to land). There is
**no** Key Features section on land — `unitFeatures` (Kitchen/Bathroom/
Flooring/etc.) describes in-unit building finishes, which don't exist on an
empty parcel; skipped deliberately rather than added as a meaningless empty
section.

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
  pattern for "extra media that isn't a whole page section" — land's Block
  Plan images, Road Map images, and video links surface there via optional
  `roadMapImages`/`blockPlanImages`/`videoLinks` props (each opens the
  shared lightbox) rather than as standalone sections lower on the page.
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
