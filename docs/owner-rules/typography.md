# Typography

| Item | Rule |
|---|---|
| Font | Archivo everywhere, via `var(--font-ref-sans)` (self-hosted, `src/lib/local-fonts.ts`). Never hard-code a font name |
| Serif | None on the site. A leftover Georgia/serif heading is a bug |
| Sinhala / Tamil | Fallback faces (Noto Sans Sinhala, Noto Sans Tamil) already in the stack; Archivo has no such glyphs |
| Major section headings (Key Features, Amenities, Plans & Homes, Overview) | 32px, weight 400, line-height 1.15, `#1f1f1f`; 26px under 760px wide |
| Body text, links, list items | 14px, weight 400, line-height 20px (body default) |
| Small emphasised labels (stat chips, card sub-headings) | 14-15px, weight 600 |
| Amenity names | 14-15px, weight 400 |
| Room titles inside Key Features boxes | 16px, weight 400, `#1f1f1f` |
| Muted captions / meta | 12-13px, weight 400 |
| Weights | The owner reads 500 as bold: use 400 for headings and labels unless the existing rule says 600. "no bold" (2026-10-01, 2026-09-28) |
| Uppercase | No uppercase eyebrow tags above headings (2026-09-30); no uppercase labels in new UI |
| Mobile | Do not enlarge a label on mobile; only change a size when the mobile layout truly needs it |
| Reuse | Before sizing new text, reuse the nearest value from this table; give look-alike elements the same CSS class |
| Social graphics | Bold 50px carousel headline, light (300-400) labels, uppercase on bars: see `social-media-rules.md` |
