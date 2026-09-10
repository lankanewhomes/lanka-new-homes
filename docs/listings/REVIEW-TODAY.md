# Review when you're back — 2026-09-09

One file, everything that needs your eyes. Ordered by how urgent it is, not
alphabetically. Checked items are done; unchecked items are yours to decide
or approve.

---

## 🚩 #1 — Fix this first: a blank page was live

**`rupannew`** (project id 14, developer "rupan new construc") had **zero
content** — no photos, no location, no floor plans, no description — but
was **published** on the live site, with 3 real leads already attached to
it. This looks like it came from your own test of the developer signup/
dashboard flow (matches the `webdesignetobicoke@gmail.com` account from
earlier this session), not something I created.

**What I did:** unpublished it just now so nobody can land on a blank page
while you're out. Did **not** delete it — it has real lead data attached
and I don't delete things without asking first.

**What you need to decide:**
- [ ] Delete it entirely (and the "rupan new construc" developer/user
  test account with it)?
- [ ] Fill it in for real and republish?
- [ ] Leave it as your own private sandbox (stays unpublished, ignore it)?

---

## Prime Lands houses (17 listings) — status after today's full pass

Started the day with only one confirmed floor plan per project. You caught
that ("you have missed lots of floor plans... go check all the pages") and
everything below reflects the full re-check that followed.

### What's now fully done, all 17
- ✅ **Every unit/lot type confirmed** — 104 floor plan types total, every
  bed/bath/sqft read directly off that type's own drawing (not estimated).
- ✅ **Hero images fixed** — 14 of 17 were unsuitable (10 were a bare
  project logo, not a photo at all; 4 were a real photo with a "TYPE X" or
  "LOT N" label baked in). All swapped for a real, generic exterior/site
  photo from that project's own gallery.
- ✅ **Names shortened** — dropped the repeated "- City" suffix from the
  hero title (city already shows below it).
- ✅ **Key Features & Nearby Places** added for 14 of 17 (from bullet data
  that had only been used for amenities/payment terms until re-checked).
- ✅ All 17 **published**.
- ✅ Confirmed none are sold out.

### Still genuinely incomplete (not a mistake — the developer just doesn't publish this)
- [ ] **No price published** for 10 of 17 (shows a "Contact for pricing"
  badge instead): Magna, Prime Urban Art, Prime Life Kadawatha, Prime
  Villas Nugegoda, Prime Villas Weera Mawatha, Signature Villas, Water
  Estate. Worth asking Prime Lands directly for a price list if you want
  these filled in.
- [ ] **A few unit types have no drawing published at all** on Prime
  Lands' own site — Prime Urban Art (types B/C/D/E/SS-A/SS-D), Waterfall
  Residencies (types A/B). Nothing to confirm there unless Prime Lands
  publishes them later.
- [ ] **2 projects have no fully clean hero option** — Prime Villas Weera
  Mawatha and Signature Villas only publish labeled renders on their whole
  site (checked every photo). Used the one matching the project's main
  confirmed type as the least-bad choice.
- [ ] **4 projects show zero amenities** (Water Estate, The Residence,
  Clover, Magna) — worth a quick manual look at their pages in case
  there's an amenities list I didn't catch, though it may just be that
  these are individual house lots with no shared facilities.
- [ ] Prime Lands' `verification_status` is still "pending" — approve in
  `/cms` if you're satisfied (turns on the "Verified" badge).
- [ ] Prime Lands also has **Apartments** and **Lands** sections on its
  site — not touched yet, house listings only were done today.

**Per-project detail:** [docs/listings/README.md](README.md) links to all
25 reports; [FOLLOW-UPS.md](FOLLOW-UPS.md) has the running list with more
technical detail than this file.

---

## Rush Lanka (7 listings) + Oceana — spot-checked today, no issues found

Re-checked all 7 Rush Lanka hero images by eye (same concern as the Prime
Lands bug — logo or mislabeled renders) since they were built with a
similar process earlier this session. **All 7 are clean real exterior
renders, no action needed.** Oceana's hero was already a deliberate choice
you made earlier ("hero = beach-villa-01, by the owner's choice") — also
fine.

---

## Not re-checked today (lower priority, but flagging so you know)

These predate this session's Prime Lands work and were **not** re-audited
with today's checks (hero image content, full floor-plan-type coverage,
etc.) — no known problem, just genuinely unverified this round:
- `imaarat-bambalapitiya`
- `barrington-towers`
- `viva-la-vida`
- `cest-la-vie`
- `capitol-twinpeaks`

If you want, I can run the same audit pass on these next.

---

## Site features shipped today (not listing data — code changes)

- "Show all plans & homes" button now actually works (was in the page but
  did nothing).
- Home page: new "Land for sale sri lanka" and "Upcoming Projects"
  sections (Land section has nothing to show yet — there are 0 Land
  listings in the system at all; may be worth checking why, since `Lands`
  is hidden from non-admin users in `/cms` today).
- "Contact for pricing" badge added wherever a price is missing (listing
  cards, floor-plan cards, project hero).
- `/cms` sidebar regrouped into your requested categories (Users & Team,
  Properties, Companies & Professionals, Leads & Engagement, Business,
  Content).

**None of this is committed to git yet** — still waiting on your go-ahead.
