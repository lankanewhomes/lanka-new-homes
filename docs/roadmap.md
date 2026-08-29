# Product Roadmap — Admin / Developer Portal / User Dashboard

Captured from the user's planning notes. This file records what's been
scoped out so far, what already exists in code, and what's still to be
built. Nothing in the "Planned" sections below has been built yet unless
explicitly marked existing — update the status as pieces ship.

## The three interfaces (system overview)

User's framing of how the whole system separates:

```
Public                          Developer                       Admin
Visitor                         Developer                       Admin
 ↓                                ↓                                ↓
Search                          Dashboard                       Review
 ↓                                ↓                                ↓
Development                     Create Development               Verify
 ↓                                ↓                                ↓
Lead                             Add Inventory                    Publish
                                  ↓                                ↓
                                  Submit                           Monitor
                                  ↓                                ↓
                                  Admin Approval                   Manage Leads
                                  ↓
                                  Published
```

This ties the Admin panel, Developer portal, and User-facing site (below)
into one pipeline: a developer creates + submits a development, it goes
through admin approval/verification, then it's published and visible to
public visitors, who search, view a development, and submit a lead — which
the admin then monitors/manages. The "Developer approval" and "Listing
verification" sections below are the two gates in the middle of this flow
that don't exist yet.

## Admin panel

Target nav:

```
ADMIN
├── Dashboard
├── Developments
├── Developers
├── Locations
├── Floor Plans
├── Units
├── Images / Documents
├── Leads
├── Users
├── Subscriptions
├── Featured Listings
├── Payments
├── Reports
├── Content / Articles
├── SEO
└── Settings
```

Status against what's in the codebase today:

| Nav item | Status | Notes |
|---|---|---|
| Dashboard | exists, basic (`/admin`) | Needs the stats-cards + charts upgrade below |
| Developments | exists, but scoped per-developer only | `/admin/developers/[slug]/projects` — no unified cross-developer `/admin/developments` list yet |
| Developers | exists (`/admin/developers`) | List/new/edit |
| Locations | exists as "Neighborhoods" (`/admin/neighborhoods`) | List/new/edit |
| Floor Plans | not separate | Currently edited inline within a project's edit form |
| Units | not built | |
| Images / Documents | not separate | Currently just image URL fields inline in project/developer forms |
| Leads | not built | Lead data is captured (`leads` table, `src/lib/tracking-db.ts`) but has no admin list/view page |
| Users | not built | No buyer/developer account management UI (auth accounts exist as of this session, but no admin list) |
| Subscriptions | not built | No billing/subscription model exists yet |
| Featured Listings | exists as "Hero Ads" (`/admin/hero-ads`) | |
| Payments | not built | |
| Reports | not built | |
| Content / Articles | not built | `src/data/articles.ts` exists as static data, no admin CRUD |
| SEO | not built | SEO is currently config-driven in code (`docs/seo-strategy.md`), not an admin UI |
| Settings | not built | |

### Admin dashboard — target spec

Top stat cards:
- Listings — count
- Developers — count
- Users — count
- Leads — count
- Views — count

Charts:
- New listings (over time)
- Leads (over time)
- Page views (over time)
- Popular developments
- Popular cities
- Developer activity

### Admin → Developments — target spec

- `[+ Add Development]` button
- Search bar
- Table columns: Name, Developer, Location, Status, Published
- Row actions: Edit, Duplicate, Preview, Publish, Unpublish, Feature, Verify, Delete

### Admin → Developer approval — target spec (not built)

Workflow for a developer's company registration to go live:
1. Developer submits company profile (e.g. "ABC Developments")
2. Admin sees pending submission with **Approve** / **Reject** / **Request Changes**
3. Once approved, the developer account/profile is marked **Verified Developer**

Note: developer accounts already exist (this session's Supabase Auth work —
`profiles.role = 'developer'`, `developers.auth_user_id`), but there's no
approval gate yet — any developer who registers goes live immediately via
`/developers/register`. This workflow would add a pending/approved state on
top of that.

### Admin → Listing verification — target spec (not built)

User's note: *"This is something I'd strongly recommend for Sri Lanka."*

Each listing gets a verification checklist:
- [ ] Developer verified
- [ ] Address verified
- [ ] Price verified
- [ ] Floor plans verified
- [ ] Completion date verified
- [ ] Ownership verified
- [ ] Documents verified

Once complete → listing is marked **Verified Listing** (a trust badge shown
publicly, presumably similar to the existing status/featured pill pattern —
see `docs/design.md` "Status / badge pills").

## Developer portal

Target nav:

```
DEVELOPER PORTAL
├── Dashboard
├── My Developments
├── Add Development
├── Edit Development
├── Floor Plans
├── Units / Inventory
├── Images
├── Documents
├── Leads
├── Analytics
├── Company Profile
├── Subscription
└── Team Members
```

Status:

| Nav item | Status | Notes |
|---|---|---|
| Dashboard | exists, basic (`/developers/dashboard`) | Shows aggregate stats + a projects table; needs the "mini-SaaS" spec below |
| My Developments | partial | Dashboard lists them, but no dedicated management list separate from the stats view |
| Add Development | gap | Only reachable via the admin route (`/admin/developers/[slug]/projects/new`), not a developer-portal-branded page, and that admin route has no auth gate of its own |
| Edit Development | same gap as above | `/admin/developers/[slug]/projects/[projectSlug]/edit` — admin-only route today |
| Floor Plans | not separate | Inline in project edit form |
| Units / Inventory | not built | |
| Images | not separate | Inline URL fields |
| Documents | not built | |
| Leads | not built | Dashboard shows lead *counts* only, no leads list/detail |
| Analytics | exists, basic | Views/leads stats on the dashboard |
| Company Profile | partial | Editable via `/developers/register` (creation) but no dedicated "edit my profile" page in the portal itself |
| Subscription | not built | No billing model yet |
| Team Members | not built | One auth account per developer company today — no multi-user team support |

### Developer dashboard — target spec

User's note: *"This should feel like a mini SaaS platform."*

```
Dashboard
Welcome, {Company Name}

Your Listings   8
Views           42,381
Leads           384
Favorites       721

[+ Add Development]
```

## User dashboard ("My Account")

Target nav:

```
My Account
├── Saved Developments
├── Saved Searches
├── Recently Viewed
├── Compare
├── Messages
├── My Inquiries
└── Account Settings
```

Status:

| Nav item | Status | Notes |
|---|---|---|
| Saved Developments | exists (`/account/saved`) | Built this session — Supabase-backed saved listings |
| Saved Searches | not built | |
| Recently Viewed | not built | View events are tracked (`project_views` table) but not surfaced per-user in an account page |
| Compare | not built | |
| Messages | not built | |
| My Inquiries | not built | Leads a buyer submits aren't tied to their account yet (leads are captured but not linked to `auth.users`) |
| Account Settings | not built | `/account` exists but is just a stub landing page today |

## City-based SEO URL structure (important — do not lose)

User: *"This is very important for Google SEO."* Pattern:

```
/colombo/new-homes
/colombo/new-condos
/colombo/new-houses

/kandy/new-homes
/galle/new-homes
/negombo/new-homes
```

i.e. **city-first** URLs (`/{city}/{type}`), distinct from the existing
`/projects/colombo` pattern documented in `docs/seo-strategy.md`. This
needs a decision on how it coexists with the current `/projects/*`
category system before building — see the note added to
`docs/seo-strategy.md`.

## Lands for sale (new inventory type — template built, no real content yet)

User: *"I'll be adding lands for sale too... so the lands will be sold by
the developers, also construction company, or the builders, or whatever it
is. My website is just not new developments — I'm also gonna be selling
lands too."*

Built: a second listing type alongside `Project` — raw land parcels, sold by
developers, construction companies, or independent builders.
- Type: `Land` in `src/types/index.ts` (perches/acres, price, land use,
  road/electricity/water, title/deed type, seller link).
- Data: `lands` Supabase table (`docs/supabase-schema.sql`,
  `src/lib/land-store.ts`), same jsonb-plus-indexed-columns pattern as
  `projects`. Empty — no rows — until real listings are entered.
- Admin: `LandWizard` (`src/components/dashboard/land-wizard.tsx`),
  `/admin/lands` (list), `/admin/lands/new`, `/admin/lands/[slug]/edit` —
  linked from every admin page's sidebar.
- Public: `/land` (listing) and `/land/{slug}` (detail), linked from the
  main site nav.
- Keyword research captured in `docs/seo-strategy.md` under "Lands for
  sale."

User also asked to analyze a specific competitor listing
(primelands.lk/land/PLATINUM-GROVE-BERUKATIYA) and pull its images/content
for a new land listing page — flagged as a copyright concern (reusing
another company's photos and marketing copy as this site's own listing).
User chose to build the template now and fill in real content later, so no
competitor content was copied — real facts (distances, terms) were used in
original wording; a placeholder hero image stands in for the seller's own
photos. First real listing (`grace-field-garden`, seller: Lanka Poolworks)
has since been entered through the wizard.

The land detail page (`/land/{slug}`) reuses the same shared components as
`/projects/{slug}` (`ProjectHero`, `PricingInformationLayout`,
`KeyFeaturesSection`, `AmenitiesShowcaseSection` titled "Facilities",
`PlansAndHomesSection` titled "Plots") via a `landToProjectShape` adapter in
`src/app/land/[slug]/page.tsx`, plus a custom stats-chip row and details
table (no Beds/Baths — those don't apply to land). Block Plan, Road Map, and
Video content (each supporting multiple entries, with upload-or-paste-URL
inputs in the wizard) surface as pills in the shared hero media bar
(`ProjectHero`'s `roadMapImages`/`blockPlanImages`/`videoLinks` props) next
to Photos/Map/Plots, rather than as separate page sections — that's a
land-only extension; Project pages keep their existing single-image
gallery-label-matched Road Map behavior unless they pass the same props.

## Partner directories (architects, marketing companies, sales companies, interior designers)

A project's "Connected Pages" section (in `ProjectWizard`) lets an admin
pick a real profile page for the project's architect, marketing company,
sales company, and interior designer — shown on the public project page via
`renderEntityLink`. These four previously pointed at hardcoded placeholder
options; they're now backed by real admin-managed directories, built the
same way as Construction Companies: `CompanyProfile` shape
(`src/types/index.ts`), one Supabase table per type (`marketing_companies`,
`sales_companies`, `architects`, `interior_designers` —
`supabase/migrations/20260829120000_company_directories.sql`), admin CRUD
under `/admin/{marketing-companies,sales-companies,architects,interior-designers}`,
and public list/detail pages reusing
`src/components/marketplace/company-profile-views.tsx`. The admin sidebar
(`ADMIN_NAV_LINKS` in `src/components/dashboard/components.tsx`) now lists
every section in one place instead of each `/admin/*` page carrying its own
copy of the nav array.

## Sequencing

Nothing above has been built as part of this note — this is a capture-only
pass so none of the user's rapid-fire planning notes get lost mid-session.
Next step: get the user's priority order before starting any of it, since
it's a large amount of work (full admin CRUD surfaces, a verification
workflow, a developer approval workflow, and a new SEO URL family).
