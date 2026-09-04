# GA4 analytics

## What's wired up

- **Base tracking**: `@next/third-parties`'s `<GoogleAnalytics>` in
  `src/app/(frontend)/layout.tsx`, gated on `NEXT_PUBLIC_GA_MEASUREMENT_ID` —
  loads on every public page, no-ops entirely if that env var is unset.
- **`view_listing` event** — fires once per project detail page load
  (`src/components/marketplace/view-tracker.tsx`, alongside the existing
  internal view-count tracker), with `listing_id` (the project's slug) and
  `listing_name` as custom event params.
- **`generate_lead` event** — fires on successful inquiry-form submission
  (`RequestInfoDialog` in `src/components/marketplace/components.tsx`), with
  `listing_id`, `listing_name`, `traffic_source` (a simplified channel guess
  computed client-side — see `src/lib/ga4.ts`), and `utm_campaign` if the
  visitor's session landed with one.
- **UTM capture** (`src/components/analytics/utm-capture.tsx`, mounted in the
  root layout) — persists first-touch `utm_source`/`utm_medium`/`utm_campaign`
  to `sessionStorage` on landing, so `generate_lead` can still report them
  even after client-side navigation away from the original URL. GA4's own
  session attribution (organic/paid/referral/direct channel grouping) reads
  UTM params from the URL directly and doesn't need this — this is only for
  our own custom event params.
- **Payload analytics endpoint**:
  `GET /payload-api/listing-analytics/:listingId` (`listingId` is the
  Payload Projects document id) — `src/collections/endpoints/analytics.ts`.
  Named `listing-analytics`, not `analytics`, because a Payload collection
  already owns the `/payload-api/analytics/*` routes
  (`src/collections/Analytics.ts`). Computes:
  - Views, avg. time on page, pages/session, top city, traffic-source
    breakdown — all from the **GA4 Data API** (`src/lib/ga4-data-client.ts`,
    `src/lib/analytics-report.ts`).
  - Inquiry count and lead-status breakdown — from **Payload's own `leads`
    collection** directly, not GA4. `generate_lead` can undercount (ad
    blockers, consent declines) so it's only used for traffic-source
    attribution, never as the inquiry total.
  - Platform-wide averages (views/listing, inquiries/listing, inquiry rate)
    and two derived insights (top traffic source, best day of week for
    inquiries).
  - Accepts `startDate`/`endDate`/`bucket` (`week`|`month`) query params for
    the trend time series.
  - Access: admin sees any listing; a `developer`-role Payload user only
    sees listings their own linked developer company owns (`ownDeveloperAccess`
    pattern, same as everywhere else in `src/collections/access.ts`).
- **Admin panel component**: `src/components/payload/ListingAnalyticsPanel.tsx`
  — a new **Analytics** tab on every Project's edit view in `/payload-admin`
  (stat cards, insight callouts, traffic-source table, lead-status chips, a
  recharts trend line). Renders fine with zero GA4 setup — views/traffic
  just show 0 until GA4 is configured; inquiries/lead status are live from
  day one since they don't depend on GA4 at all.
- **Lead status** — `src/collections/Leads.ts` gained a `status` field
  (`new`/`contacted`/`toured`/`sold`). A developer can change their own
  projects' lead status directly in `/payload-admin` (every other field on a
  lead stays admin-only — see the field-level `access.update` on each).
- **Live inquiry form → Payload bridge** — `src/app/(frontend)/api/leads/route.ts`
  (the actual public inquiry form's submit endpoint) now also mirrors each
  new lead into Payload's `leads` collection, best-effort, so builders
  actually see real inquiries in `/payload-admin` and the analytics panel's
  inquiry counts reflect real submissions. Previously Payload's `leads`
  collection only held the one-time historical migration snapshot from
  `scripts/migrate-to-payload.ts` — new leads never reached it. The mirror
  sets `context.skipSupabaseSync` so the collection's own
  `afterChange` sync hook doesn't also insert a duplicate row into
  Supabase's `leads` table (the route already writes there directly).
- **Weekly digest email** — `src/lib/analytics-digest.ts` +
  `src/app/(frontend)/api/cron/analytics-digest/route.ts`, triggered by
  Vercel Cron (`vercel.json`, Mondays 08:00 UTC). Not built on Payload's own
  Jobs Queue — that needs a persistent process polling it, which doesn't fit
  a Vercel serverless deployment. The route does the whole run in one
  invocation instead, protected by a `CRON_SECRET` bearer token that Vercel
  attaches automatically once that env var is set on the project.

## Required setup (none of this works until you do it)

### 1. GA4 property + measurement ID

Create (or reuse) a GA4 property for lankanewhomes.com in
[Google Analytics](https://analytics.google.com), then Admin → Data Streams
→ your web stream → copy the **Measurement ID** (`G-XXXXXXXXXX`) into
`NEXT_PUBLIC_GA_MEASUREMENT_ID`.

### 2. Register the `listing_id` custom dimension

GA4 only lets the Data API query a custom event parameter (`listing_id`,
sent by `view_listing`/`generate_lead` above) if it's registered as a
**custom dimension** first:

Admin → Custom definitions → Custom dimensions → Create custom dimension:
- Dimension name: `Listing ID` (any label)
- Scope: **Event**
- Event parameter: `listing_id`

Without this step, every report the Payload endpoint runs will silently
return zero rows for views/traffic/trend — inquiries and lead status will
still work fine since those don't touch GA4 at all.

### 3. Service account for the GA4 Data API

The Payload endpoint reads GA4 server-side via a service account (never a
user login):

1. Google Cloud Console → create/select a project → enable the **Google
   Analytics Data API**.
2. IAM & Admin → Service Accounts → create one → create a JSON key for it.
3. In GA4: Admin → Property Access Management → add the service account's
   email as a **Viewer**.
4. Set env vars from the JSON key:
   - `GA4_PROPERTY_ID` — the numeric property id (Admin → Property Details),
     with or without the `properties/` prefix — both work.
   - `GA4_SERVICE_ACCOUNT_EMAIL` — the key's `client_email`.
   - `GA4_SERVICE_ACCOUNT_PRIVATE_KEY` — the key's `private_key`. `.env`
     files can't hold real newlines, so paste it with literal `\n` sequences
     (the JSON key file already has these) — the code un-escapes them.

### 4. Vercel

Add all of the above, plus `CRON_SECRET` (already generated into
`.env.local` — reuse that same value, don't regenerate it, or the two won't
match), to the Vercel project's Environment Variables. Vercel Cron reads
`CRON_SECRET` itself and signs its own requests to
`/api/cron/analytics-digest` with it automatically — nothing else to wire up
once the env var is set there.

### 5. SMTP

The weekly digest email reuses Payload's existing `nodemailerAdapter`
(`SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`/`EMAIL_FROM` in
`.env.local`) — same credentials gap as the magic-link email feature. Until
those are filled in, digest sends fail individually (logged, not thrown) and
the cron run still completes normally.

## Design decisions worth knowing

- **`listing_id` = the project's `slug`**, everywhere — not Payload's
  internal numeric id. The public frontend only knows the slug (it reads
  Supabase, not Payload, for project data); the admin endpoint resolves the
  Payload id it's given back to that same slug before querying GA4, so both
  sides agree on one correlation key without the frontend needing to know
  anything Payload-specific.
- **Inquiry counts come from Payload's `leads` collection, not GA4's
  `generate_lead` event.** GA4 client-side events can undercount (ad
  blockers, consent declines, JS errors); Payload's collection is a direct
  server-side record of every real submission. GA4 is used only for
  traffic-source *attribution* of those visits, which Payload has no way to
  know.
