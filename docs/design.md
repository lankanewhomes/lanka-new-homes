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
- Serif is reserved for listing-page H1s only (Zolo-style pages); everything
  else uses the site's default sans stack.

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
