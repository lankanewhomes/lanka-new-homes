# Design Reference — LankaLiving

Living reference for UI conventions established across the site. Check here
before building a new page or component so new work matches existing
patterns without the user having to repeat instructions. Update this file
whenever a new convention is set or an existing one changes.

## Section navigation bar (project / floor plan pages)

Used on the project detail page and the floor plan detail page, via the
shared `ProjectHero` component (`src/components/marketplace/components.tsx`).

- Optional **back link** on the far left (`backHref` + `backLabel` props):
  chevron-left icon + label, **regular weight** (never bold), separated from
  the section tabs by a vertical divider (`border-right`).
- **Section tabs** (Overview / Pricing / Plans & homes / Amenities /
  Neighborhood): regular weight when inactive, **bold + gold underline**
  (`#ffc52d`) when active. Active section is tracked via the URL hash.
- Tabs are conditionally shown — pass `showAmenitiesAndNeighborhoodNav={false}`
  on pages where those sections don't exist (e.g. the floor plan page).
- `titleOverride` / `heroImageOverride` swap the H1 and hero photo without
  touching the rest of the hero (stats row, tags, developer byline).

**Convention going forward:** any new page nested under a project or floor
plan (or anything with a similar "detail page with sub-sections" shape)
should reuse this same nav pattern — back link unbold, active tab bold — via
`ProjectHero`'s props rather than a new bespoke nav.

## Unit availability section (project detail page)

`UnitAvailabilitySection` (`src/components/marketplace/components.tsx`) shows
per-unit floor/price/status inventory as a status-filtered table
(`UnitTable`), fed by real `units` table rows (`getUnitsByProjectSlug`,
`src/lib/unit-store.ts`). Only renders when a project has unit rows —
projects without unit-level data (the majority, still using just
`floorPlans`) are unaffected. Plain Tailwind utility classes, not custom
`globals.css` — matches `UnitTable`'s existing minimal admin-table style
rather than the more designed marketing sections around it. Status filter
tabs only render for statuses actually present in the data (no empty
"Reserved (0)" tab, etc.).

**Convention going forward:** any project with real per-unit inventory
(floor-by-floor availability, not just floor-plan types) should populate the
`units` table and get this section for free — no per-project UI work needed.

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

- **Filter bar**: pill-shaped dropdowns (For sale / Home type / Any price /
  0+ beds / Construction status / More), white background, rounded-full,
  1px border.
- **Header row**: small uppercase eyebrow ("N COMMUNITIES") above a serif
  H1 (`font-family: Georgia, "Times New Roman", serif`), sort dropdown
  right-aligned on the same row, intro paragraph below the H1.
- **Cards**: `.listing-grid-card` — vertical card, status pill top-left on
  the image (dark translucent), save heart top-right, "Featured" tag
  bottom-right of the image, then name / price / "{type} by {developer}" /
  address / beds+sqft icon row below.
- **Layout**: 55% list / 45% map split by default; a List/Map toggle button
  pair swaps to full-width list or full-width map (CSS-driven, both panes
  stay mounted so content is always in the server HTML — never remove the
  list from the DOM for a "map view").
- **Map**: visual layer only (no real map SDK wired in — no Mapbox/Google
  Maps key configured). Green background, cream boundary polygon, navy
  boundary stroke, blue circular pins sized by cluster count. Always
  `next/dynamic(..., { ssr: false })` so it never blocks LCP.

**Convention going forward:** a new directory/listing-style page (more
project categories, more construction-company categories, anything with a
"filterable list of cards + intro copy" shape) should reuse this same shell
— add a config entry to the relevant `*-categories.ts` file and a thin
`page.tsx`, not a new one-off layout.

## Colors & type

- Neutral palette: Tailwind `stone-*` for body chrome (borders, muted text).
- Accent gold: `#ffc52d` (active tab underline, primary CTA buttons).
- Pill palette: green `#1a6b2f`/`#e8f4e8`, blue `#1a53a3`/`#e8f1fd`, red
  `#c0392b`/`#fdeaec`, purple `#4338ca`/`#eef2ff`.
- Serif is reserved for listing-page H1s only (Zolo-style pages); everything
  else uses the site's default sans stack.

## Where things live

- Shared detail-page hero/nav: `src/components/marketplace/components.tsx`
  (`ProjectHero`, `ProjectDescriptionSection`, etc. — most take override
  props rather than being duplicated per page).
- Listing/category page system: `src/lib/listing-categories.ts`,
  `src/components/marketplace/listing-shell.tsx`,
  `src/components/marketplace/listing-page.tsx`,
  `src/components/marketplace/map-pane.tsx`.
- Admin/developer dashboard pages all share one wrapper pattern
  (`grid gap-4 px-4 pt-6 pb-16 lg:grid-cols-[220px_1fr] lg:px-6 lg:pt-8` +
  `DashboardSidebar` + `DashboardHeader`) — keep new admin pages consistent
  with this rather than custom padding per page.
- SEO/keyword conventions: `docs/seo-strategy.md` (separate file — that one
  is about metadata/keywords/URLs, this one is about visual/UI patterns).
