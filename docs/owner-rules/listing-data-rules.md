# Listing and data rules

| Rule | Detail |
|---|---|
| Where data lives | Supabase (projects, developers, neighborhoods, lands, leads...). Read `docs/supabase-workflow.md` and `docs/supabase-schema.sql` before touching a data model |
| New field | Push the matching column/schema change to Supabase in the same change |
| Never delete | Never drop a column or delete data without asking first |
| Never invent numbers | Only figures the developer published; disclose any estimate; never compute an average from estimates |
| Sold-out listings | Do not add sold-out projects ("if its sold out, i dont want to add"); a project with at least 1 unit left is added; mark existing sold-out ones Sold Out. Check the developer's own page first |
| New listings | Add as unpublished drafts, give a preview link (`/listing-preview/<slug>`), publish only when the owner says |
| Never repost | Skip a listing already posted anywhere |
| Developer page | Logo (copy to our storage), phone/email, website, social links (Facebook, Instagram, WhatsApp), hours, about text, awards if published (say if none), backend reference links |
| Developer names | Never tag or name developers in social posts |
| Neighbourhood | Link each project to an existing neighbourhood page when one exists (Colombo 03 = Kollupitiya, 04 = Bambalapitiya, 09 = Dematagoda); create new ones only with researched content and credited photos |
| Hero image | A render or photo, never a floor/master plan; plans go to Floor Plans / Block Plan |
| Photos with developer names | Skip them in social content |
| Backend means | `/dashboard`, not `/cms` (2026-11-15) |
| Scripts | Save data-changing scripts in `scripts/` and push them; dry-run first (`--apply` to write) |
| After a data change | Pages can show an old cached copy until the next deploy: verify on the live page |
| Phone numbers | Never store lead or contact phone numbers in memory or docs |
