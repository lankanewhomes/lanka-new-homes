# LankaNewHomes dashboard

A new admin dashboard for admins and developers, in the site's brand. **It reads and writes real Payload data** through Payload's own REST API (`/payload-api`) with the signed-in user's cookie, so every access rule, hook and Supabase sync behaves exactly as in `/cms`. It lives in its own route group and does not change `/cms`, the public site or `payload.config.ts`.

Sign in at `/dashboard/login` with a Payload account whose role is `admin` or `developer`. Every page checks the session on the server (`(app)/layout.tsx`) and redirects signed-out visitors to the login page.

- Code: `src/app/(dashboard)/dashboard/`
- Schema reference: `docs/PAYLOAD-SCHEMA.md` (generated)
- Open it at `http://localhost:3000/dashboard/login` (or go straight to `/dashboard/overview`)

> **Why `/dashboard/overview` and not `/dashboard`?** The public site already has a page at `/dashboard` (the buyer "Your dashboard" placeholder in `src/app/(frontend)/dashboard/page.tsx`). Two pages cannot own one URL, so the overview sits at `/dashboard/overview` and the public page is untouched. When this replaces the placeholder, move `overview/page.tsx` to `dashboard/(app)/page.tsx` and delete the old one.

## Look and feel

Matches the site's own account area (`/account/compare`): white page, square corners, flat 1px bordered boxes, a dark split hero with a faint grid and one white stat card (`_components/PageHero.tsx`), lilac grid-textured sections (`.d-box`), a side menu of bordered rows where the open page is a solid dark row with a tick, an orange search button, Archivo type, and outline pill buttons on the dark hero. All colours are tokens in `_components/dashboard.css`; the brand orange is `--d-brand`, the dark ink `--d-ink`.

## How it works

| Piece | Where | What it does |
|---|---|---|
| Schema export | `scripts/export-dashboard-schema.ts` | Reads the loaded Payload config and writes one JSON file per collection/global into `_mock/schema/`, plus `index.json` (sidebar groups, who can see what) and `loaders.ts` (lazy imports). Re-run it after changing a collection. |
| Mock data | `_mock/generate.ts`, `_mock/seeds.ts` | Builds realistic Sri Lankan records from the schema (Prime Lands, Colombo 08, Rs. prices, perches). Deterministic, so the same records every load. Types come from `@/payload-types` (`_mock/types.ts`). |
| State | `_components/DashProvider.tsx` | Role, theme, mock records, toasts. The only place to change when connecting to Payload (replace `ensure`, `saveRow`, `deleteRows` with Local API calls). |
| Forms | `_components/FieldsRenderer.tsx`, `_components/fields/*` | One component per Payload field type. Admin `condition` functions are evaluated, so fields show and hide as in /cms. |
| List / edit | `_components/CollectionList.tsx`, `CollectionEdit.tsx` | Generic, driven by the schema. Every collection uses the same two components. |

Field type to component: text/email/textarea `TextField`, number `NumberField`, select `SelectField` (searchable when long), radio `RadioField`, checkbox `CheckboxField` (toggle), date `DateField`, relationship `RelationshipField` (searchable, polymorphic), array `ArrayField` (reorder by drag or arrows), group `GroupField` (card; a lat/lng group gets the map picker), tabs `TabsField`, richText `RichTextField`, upload and image-URL text fields `UploadField` (drag and drop), point `PointField`, join `JoinField`, ui `UiField`, blocks `BlocksField`, json `JsonField`.

## Pages

All URLs start with `/dashboard`. `<c>` is any collection slug.

| URL | What | Payload source | Mock data |
|---|---|---|---|
| `/login` | Centered sign-in card, picks the role to preview | Users (auth) | none |
| `/overview` | Stats, 30-day views chart, recent leads, featured spots | Analytics, Leads, Projects, Subscriptions | `generate.ts` + chart series in `Overview.tsx` |
| `/package` | Current package, featured spot swapper, end date, upgrade options | Subscriptions, Payments, Projects, Placement pricing | `generate.ts` (tier copy is placeholder) |
| `/inbox` | Gmail-style mail for developers@, support@, no-reply@ with open/click tracking | `/cms/mail` + Mail accounts/folders/messages | `_mock/mail.ts` |
| `/inbox/connection` | Mailbox connection status | `/cms/mail/settings` | `ConnectionStatus.tsx` |
| `/billing` | Revenue chart, subscriptions table | `/cms/billing`, Subscriptions, Payments | `generate.ts` |
| `/<c>` | List: search, filters, sort, columns, pagination, bulk select | every collection | `generate.ts` |
| `/<c>/new` and `/<c>/<id>` | Edit form with sticky save bar | every collection | `generate.ts` |
| `/globals/site-settings`, `/globals/lead-alert-settings` | Edit forms | the two globals | `generate.ts` |

Sidebar groups and order are read from `AdminNav.tsx` (Listings, Developers, Leads, Content, Marketing, Mail, Billing, Analytics, Users, Settings) plus an "Other" group for collections that are not in the /cms menu.

## Roles

The user menu has a **Preview as** switch.

| | Admin | Developer (pretends to be Prime Lands) |
|---|---|---|
| Sidebar | everything | only collections the Payload `hidden` rules show a developer, plus Company profile |
| Records | all | only their own: projects, lands, leads and analytics of their projects, subscriptions, payments, team members, reviews, hero slides, their developer profile |
| Inbox, Site/Lead alert settings | yes | no |

## Known limits of the preview

- The map picker draws a rough Sri Lanka outline, not real map tiles.
- Rich text edits plain HTML; Payload keeps Lexical JSON.
- Custom /cms panels (`ui` fields) are shown as a labelled placeholder.
- Package spot counts and prices are placeholders, not the real price list.
- Mock numbers are sample values; nothing is read from or written to Supabase.
