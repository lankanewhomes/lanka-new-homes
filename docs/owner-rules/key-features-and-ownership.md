# Key Features, Ownership & Services, Amenities

| Topic | Rule |
|---|---|
| Layout (2026-11-15) | Category rows (accordion). An open row shows its rooms/topics as light-grey (`#fafafa`) boxes in 3 columns (2 under 1000px), each with a plain line icon and a 16px title with a thin grey underline |
| Categories available | General Features, Building & Structure, Building Services, Indoor Features, Outdoor Features, Interior, Finishes, Utilities & Services, Safety & Security, Sustainability (plus older Specifications, Recreation & Wellness, Accessibility, Road & Access). Add more whenever a listing needs them |
| New category name needs the database | The category key is a Postgres enum; adding a key means `ALTER TYPE payload.enum_projects_unit_features_key ADD VALUE ...` (and the `lands` one) first. Additive only |
| Items | `field` = room/topic (Doors & Windows, Living Areas, Kitchen, Bedrooms, Bathrooms, Flooring, Walls & Ceilings, Air Conditioning, Hot Water, Elevators, Parking, Foundation...). Several lines per field; `a; b; c` shows as separate lines. A value must not just repeat the field name (use "Available") |
| Items with no field | Plain lines (Safety & Security, Building Services) |
| Never in Key Features | Floors/storeys, unit counts, sizes, prices, dates, bedroom counts, location, developer, architect (owner: "dont add how many floors"); shared amenities (pool, gym, clubhouse, rooftop); marketing wording |
| Amenities | Facilities shared by residents; Key Features is per-unit and building construction/services |
| Ownership & Services | Same room-box design; two groups: Ownership & Purchase, After-Sales & Services; topic icons by keyword (`featureFieldIcon`) |
| Source of facts | Only what the developer published (brochure spec page, project page). Brochures can be images: read them visually. Third-party sites (PropertyGuide) are not a source: hold and verify |
| Never invent | If nothing is published, leave Key Features empty and say why |
| Backend links | Save the developer page and spec source as backend-only reference links on the project (admin "Links" tab) so the owner can re-check later |
| Re-running scripts | Scripts must replace their own groups, not append (a re-run once duplicated Interior tabs) |
| Code | `KeyFeaturesSection`, `OwnershipServicesSection`, `featureFieldIcon`, `KEY_FEATURE_CATEGORY_LABELS` in `src/components/marketplace/components.tsx` and `src/collections/shared-fields.ts` |
