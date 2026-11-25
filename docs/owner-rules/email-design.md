# Email design rules

Every email the site sends uses ONE shared layout, `src/lib/email-layout.ts`. The owner's standing instruction is "Be consistent with the design"
(2026-11-23 "be consistent with the design ... for all of them"; repeated 2026-11-25). Reuse the helpers below; never write new markup for
something a helper already draws. Long history is in `docs/design.md`; this file is the short rule list.

## The shell (top to bottom, every email)

| Part | Rule |
|---|---|
| Page | Cream background `#f3efe8`, one white card, max 620px, 1px `#e4e2db` border. Tables and inline styles only, Arial/Helvetica, so Gmail and Outlook render it |
| Header | Dark ink cell `#1c1c20` with a 4px orange top rule and the white logo PNG (`/brand/lankanewhomes-logo-white-on-dark.png`, 124px). The PNG has the dark colour baked in (owner, 2026-11-22: "black background for where the image is"). Never an SVG logo: mail apps block it |
| Heading | `emailHero`: 30px regular weight (not bold), then an optional muted lead line |
| Body | Built only from the helpers in the next table, each one a full table row with 32px side padding |
| Sign-off | "Warm regards, LankaNewHomes Team" (`emailSignoff` / `emailTeamSignoff`). No mailbox, no phone number (2026-11-19) |
| Notes | White rows, divider line, 12px grey centred text (`emailNoteRow`). Order: "why you got this", then the help line, then `lastRow` (unsubscribe or "turn alerts off"). All notes sit ABOVE the dark footer |
| Dark footer | ALWAYS the last section of every email (owner, 2026-11-23): site blurb, `www.lankanewhomes.com`, "Follow us: Instagram · Facebook · TikTok". No phone, no mailing address (removed 2026-11-19). Nothing may be placed under it |

## Building blocks (use these, in this order of preference)

| Helper | What it draws | Rule |
|---|---|---|
| `emailCompactList` / `emailNumbered` | Numbered steps | ONE bordered box for all steps, a fixed-width number column, a thin line between steps. Small orange numbers the same size and height as the bold step title, the same narrow gap between number and text on every step. `table-layout:fixed` so a wide button can never push the box wider than a phone (owner, 2026-11-23: "I like this design. Can you implement it"; "be constant with the design"). Outreach `stepCard` is the same look with an optional button inside a step |
| `emailBulletSections` | Numbered topic + bullets | One box, thin dividers, orange number before the bold topic line |
| `emailPanel` | Tinted panel | `#faf7f2` (or a given tint) with a 4px orange left rule; used for the Verified Developer steps and "where buyers see it" |
| `emailFacts` | Label / value table | Same tinted card with the orange left rule; empty values are dropped |
| `emailListingCard` | One listing | Bordered card, orange left rule, bold name, muted "city · price" line, "View listing →" link UNDER the name, never beside it (phones, 2026-11-19). Sponsored cards get the `#fef1e8` tint and a Sponsored tag |
| `emailSectionLabel` | Orange caps label | Above a group of listing cards (saved-search name, developer name). This is the only place small caps are allowed |
| `emailButton` | One action button | Square (no radius), orange `#f47b36`, dark ink text (never white on orange), 16px bold, 15px / 30px padding; optional small secondary link below |
| `emailButtonRow` | Several buttons | Stacked one on top of the other, each full width, never side by side (owner, 2026-11-23: "put one on top and other on bottom. Be constant"). WhatsApp button is green `#25d366` with white text so it stands apart (2026-10-18); Call / Email are dark ink with white text |
| `verifiedPill` | ✓ Verified Developer | Cyan pill, 11px bold uppercase, same as the site's `.badge-verified` |
| `emailNoteRow` | A note | Only way to add a note; see the shell table for where notes go |
| `darkBg` / `lightOnDark` | Dark boxes | Every dark container (header, footer, the weekly report's Featured box) stays black in the Gmail app's dark mode: `darkBg` paints the colour as a one-colour gradient too, `lightOnDark` keeps the text light (owner, 2026-11-22) |

## Colours in emails

| Use | Value |
|---|---|
| Ink (headings, links, button text) | `#1c1c20` |
| Body text | `#2b2b29` |
| Muted text | `#6b6a66` |
| Hairline / borders | `#e4e2db` |
| Page background | `#f3efe8` (cream) |
| Brand orange (buttons, numbers, left rules, section labels) | `#f47b36` (never yellow, see `brand-colors.md`) |
| Panel tint | `#faf7f2`; Verified panel `#f1fbfd`; brochure warning `#fff7ed`; Sponsored `#fef1e8` |
| WhatsApp button | `#25d366` with white text |
| Footer text on dark | `#b9b8b2`, links white |
| Note text | `#8a8a8a` on white |

## Notes, footers and senders per email type

| Email type | Note rows above the dark footer | From |
|---|---|---|
| Developer emails (lead alerts, reminders, owner notice, weekly report, invite, confirm listings, Verified, missing details) | Default note "You are receiving this because your company or project is listed on LankaNewHomes." on the cream background; the weekly report says "this weekly report"; the owner notice says "Internal notice from LankaNewHomes" | Alerts, reminders and the owner notice `no-reply@`; weekly report, invite, confirm listings, Verified, missing details `developers@` |
| Outreach emails | Help line "Questions? Just reply to this email or write to developers@lankanewhomes.com" | `developers@` |
| Buyer emails (enquiry confirmation, brochure) | "You are receiving this because you sent an enquiry / asked for a brochure"; brochure adds the support@ help line | `no-reply@` |
| Buyer alerts (saved search, follower digest) | No default note; `lastRow` says the alert is on in the account and how to turn it off | `no-reply@` |
| Newsletter and every marketing email | No default note; `lastRow` is the unsubscribe line (just above the dark footer) and the mail app's List-Unsubscribe headers are sent too (`src/lib/unsubscribe.ts`). Transactional emails never get it | `no-reply@` |
| Account emails (confirm email, reset password, sign-in link) | One note: "This inbox is not monitored ... support@lankanewhomes.com". The address must stay readable grey on white (it was white on white once, fixed 2026-11-23) | `no-reply@` |
| Mailbox / sending | Google Workspace is the only mailbox: one real mailbox with `no-reply@`, `support@`, `developers@` as aliases (Zoho deleted 2026-11-23). `sendMail` in `src/lib/mailer.ts` sends through Resend and tracks links, except password and confirmation emails | |

## The 22 designs (numbers as in the test subjects `[TEST n/22]`)

| n | Design | File |
|---|---|---|
| 1 | Lead alert to developer | `src/lib/lead-alert-email.ts` |
| 2 | Brochure request alert to developer | `src/lib/lead-alert-email.ts` |
| 3 | You got a lead (owner notice) | `src/lib/lead-notice-email.ts` |
| 4 | Lead reminder 1 (12 hours) | `src/lib/lead-reminder-email.ts` |
| 5 | Lead reminder 2 (48 hours, last) | `src/lib/lead-reminder-email.ts` |
| 6 | Enquiry confirmation to buyer | `src/lib/lead-confirmation-email.ts` |
| 7 | Brochure to buyer | `src/lib/brochure-email.ts` |
| 8 | Saved search alert to buyer | `src/lib/saved-search-alert-email.ts` |
| 9 | Follower digest to buyer | `src/lib/follower-digest-email.ts` |
| 10 | Newsletter (with unsubscribe) | `src/lib/newsletter-email.ts` |
| 11 | Developer weekly report | `src/lib/developer-weekly-report-email.ts` |
| 12 | Developer invite (register and get Verified) | `src/lib/developer-invite-email.ts` |
| 13 | Developer: please confirm your listings | `src/lib/developer-listing-confirmation-email.ts` |
| 14 | Developer: you are now Verified | `src/lib/developer-verified-email.ts` |
| 15 | Developer: missing details (3+ projects, one combined email; 1 or 2 projects get one email each, owner 2026-10-16) | `src/lib/developer-missing-info-email.ts` |
| 16 | Outreach: listings updated | `src/lib/outreach-templates.ts` |
| 17 | Outreach: verify your company | `src/lib/outreach-templates.ts` |
| 18 | Outreach: complete your listings | `src/lib/outreach-templates.ts` |
| 19 | Outreach: a buyer is waiting | `src/lib/outreach-templates.ts` |
| 20 | Account: confirm your email | `src/collections/auth/verification-email.ts` |
| 21 | Account: reset your password | `src/collections/auth/verification-email.ts` |
| 22 | Account: sign-in link | `src/collections/auth/verification-email.ts` |

## Never

| Never | Why |
|---|---|
| Buttons side by side | They wrapped onto two lines and came out different sizes on a phone (owner, 2026-11-23) |
| A separate box per numbered step | A wide button squeezed one step's number column and the steps no longer lined up (2026-11-23) |
| Anything below the dark footer | The dark footer is always last (owner, 2026-11-23) |
| White text on the orange button | Poor contrast; button text is dark ink |
| Phone number or mailing address in footer or sign-off | Removed on 2026-11-19 |
| A dark box without `darkBg` | The Gmail app's dark mode flips it light and the white text disappears (2026-11-22) |
| New markup for a thing a helper already draws | Every design must change together when the owner changes one |
| Rounded corners, emoji, coloured icons, yellow | Same brand rules as the site (`ui-design-rules.md`, `brand-colors.md`) |

## How to check and test

| Step | How |
|---|---|
| Before changing any email | Read this file and `src/lib/email-layout.ts`; change the helper, not one template, when the look changes |
| Render all 22 without sending | `DRY=1 OUT=<empty folder> npx tsx scripts/send-all-test-emails.ts` writes `1.html` to `22.html`; it reads no database and sends nothing |
| Look at them | Open the files in a browser at phone width (390px). Check: steps line up, buttons stacked, dark footer last, notes above it, no horizontal scroll |
| Say the caveat | A browser preview is not the Gmail app; say so every time. Dark mode and step spacing can only be confirmed in the Gmail app on the owner's phone |
| Send test emails | Only when the owner asks (owner, 2026-11-23: "send me test emails"): `npx tsx scripts/send-all-test-emails.ts` (or `ONLY=3,7`). It sends to the owner's Gmail only, subjects `[TEST n/22]`, sample data, links to the live site. Add a new design to this script in the same change |
| Never send to a developer or buyer unasked | `owner-preferences.md` |
| Before pushing | Type-check and tests as in `workflow-and-git.md`; then update this file and `docs/design.md` if a rule changed |

## Open items (as of 2026-11-25)

| Item | Status |
|---|---|
| `[TEST 16]` step spacing in the Gmail app on the owner's phone | 🟡 Owner was asked to look; not confirmed |
| Newsletter unsubscribe line just above the dark footer | 🟡 Owner has not said whether that placement is fine |
