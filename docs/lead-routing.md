# Where enquiries (leads) go

Owner decision, 2026-10-03.

- Default: an enquiry about a listing is emailed (and WhatsApped, when connected) to the listing's **developer** — the developer's Lead alerts email, then its Contact email, then its linked account's login email (`src/lib/lead-alerts.ts`).
- Exception: listings whose sales/marketing is handled by an agency go to the **agency**, not the developer. Each project has a "Leads go to" setting (Developer / Sales company / Marketing company). When it is set to a company, the alert goes to that company's contact email and the buyer's confirmation says it was sent to that company.
- Invoke (https://www.invoke.lk, Invoke (Pvt) Ltd, Nawala — a marketing and sales agency, not a developer): its marketed listings are set to **Marketing company** so leads reach Invoke's sales team. Developers named on those listings: Vyan Villas Ella — Provident Capital (Pvt) Ltd; Ru Residencies — Ru Isuru Homes (Pvt) Ltd; Araliya Breeze — Sandalwood Residencies; Elegant 16 / Ekroma Fortune — Ekrooma Realtors.
- Each listing's own sales email/phone/hours (e.g. Ru Residencies: Chapel Lane, Nugegoda · +94 773 711 444 · sales@ruresidencieslk.com · 9am–5pm) are stored in the listing's Contact group and shown on its contact card; they do not change where lead alerts go.
- Test routing still applies on top of all of this (non-production, test mode, admin/test buyer emails → test inbox): no trial enquiry reaches a real company.

## Copies of every enquiry (owner, 2026-10-13)

- Every enquiry goes to the **developer's** lead email, and a copy goes to the **listing's own contact email** when it differs (plus the developer's "CC on lead alerts" addresses). If an agency handles the listing ("Leads go to"), the agency is the main recipient and the developer is copied. Implemented in `sendLeadAlerts` (`src/lib/lead-alerts.ts`). Test routing still replaces all of this outside production.
- **Only the developer's email is used for accounts.** Sign-up, the Verified Developer badge, verification invites, outreach and follow-up to-dos go to the developer's own email and company domain, never to a listing's contact email. A listing email is just an extra place enquiries are copied.
- Safety net: `/api/cron/lead-alert-sweep` (every 10 minutes) emails any recent lead whose instant alert never went out.
