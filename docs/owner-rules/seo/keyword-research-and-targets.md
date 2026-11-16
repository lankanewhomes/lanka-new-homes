# Keyword research and targets

| Topic | Detail |
|---|---|
| Source of truth | `docs/seo-strategy.md` (keyword-to-page map), `SEO_KEYWORDS.md` (bank), per-country volumes in Supabase `keyword_volumes` (71 Sri Lanka + 6 per overseas country, refreshed 2026-11-09) |
| Tools | Ubersuggest and AI SEO Crew first; volumes are global; quota 100 lookups per day |
| Known volumes (monthly) | houses for sale sri lanka colombo 8,100; houses kandy 4,400; houses Dehiwala 2,400; Piliyandala 2,400; Negombo 1,900; Kadawatha 1,900; property for sale sri lanka 1,900; land for sale in kandy 1,900; Nugegoda 1,600; Homagama 1,600; apartments for sale sri lanka 1,300; Mount Lavinia 1,300; Maharagama 1,300; Galle 1,300; land Kurunegala 1,000; Moratuwa 1,000 |
| Colombo postcodes | 7 = 260, 5 = 260, 6 = 210, 4 = 170, 3 = 140, 2 = 110, 15 = 50 |
| Ignore | "ikman lk" variants; crossword and foreign-market noise ("Colombo's land crossword", Iceland); "Sherry land", "Emerald land" (project names) |
| Where a keyword goes | Generic Sri Lanka terms on `/projects` or `/land`; town terms on `/projects/houses-for-sale-in-{town}`; postcodes on `/projects/colombo/colombo-{n}`; land terms on `/land/*`; process questions on guides and blog |
| Build rule | Real volume + real listings. 0-1 listings: do not build; add listings first |
| Competition | Dehiwala results are mostly Facebook posts (winnable); "land for sale sri lanka" is hard (lankapropertyweb DA 39, ikman, realtor.com) |
| Not built (no listings) | Maharagama, Wellawatte, Matale, Bandarawela, Peradeniya, Borella, Avissawella (area pages exist, no listings); houses Homagama, Gampaha, Moratuwa, Panadura, Ja-Ela, Battaramulla; apartments Kandy, Malabe, Battaramulla |
