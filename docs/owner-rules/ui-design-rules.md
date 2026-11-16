# UI and design rules (short list)

Long page-by-page detail is in `docs/design.md`. Check it before any UI change and update it when a new convention is set.

| Rule | Detail |
|---|---|
| Contained boxes | New non-hero sections: max-width 1280px, centred, own soft flat background, 34px between boxes, left-aligned heading (2026-09-30) |
| No eyebrow labels | No small uppercase tag over a heading |
| Corners | Square or very small radius; the owner said "no radius, no bold" on new pages |
| Icons | Plain single-colour Lucide line icons (stroke 1.5), same set as the rest of the site; no colour, no emoji. Match the site's own icons (door, bath, sofa...) |
| Lines | No orange rule lines under headings; thin grey hairlines only |
| Backgrounds | Very light and neutral for boxes (`#fafafa`); warm only where the existing section is warm |
| Accordions | Key Features and Ownership & Services keep the accordion rows (icon, label, chevron, `#fdf3e0` open state); only the body changes |
| Badges / pills | Dedicated CSS class per pill type, never by sibling order; Sold Out is solid red |
| Nav | Section tabs: back link unbold, active tab bold with orange underline (`#f47b36`); floating quick-jump menu lists every section |
| Hero | No floor plan or master plan image in the hero or gallery; plans go in Floor Plans or Block Plan |
| Placeholders | A "Coming Soon" map is only used when the developer has no render; flag it |
| Consistency | Same look for the same thing across project, land, plot, floor-plan and preview pages (one shared component) |
| Check before shipping | Look at the page in a browser (hydrated, section opened), not just type-check |
| Mobile | 390px phone must work; no horizontal scroll |
| Language | Listing text can be English, Sinhala or Tamil; see "Languages" in `docs/design.md` |
