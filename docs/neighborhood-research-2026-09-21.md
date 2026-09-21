# Neighborhood research and photos — 2026-09-21

Every area with a published project now has a `/neighborhoods/<slug>` page (22 pages, 38 of 38 published projects linked to theirs). Rows are written through Payload (mirrored to Supabase). All prices in the text are asking prices as printed on the source page on 2026-09-21 — none of LankaPropertyWeb (LPW), PropertyGuide (PG) or ikman carries a date — and nothing was averaged by us. LPW's own `/area/<slug>/` price charts were empty for every area, so price lines use LPW's land/apartment/rent listing pages, PG area guides and developer pages. LPW's printed "average" sentences are often garbled (e.g. a "monthly selling price" of Rs. 200–300 million for a house); those were not used.

## Status

| Neighborhood | Status | Photos (hero + gallery) | Main sources |
|---|---|---|---|
| dehiwala | updated (batch 1) | 6 | LPW, PG, Wikipedia, Dept of Census & Statistics, rome2rio, ikman, Sunday Times |
| kalkudah | updated (batch 1) | 6 (hero kept) | Wikipedia, LPW listings, Happy Homes Lanka, rome2rio, Cinnamon Air |
| mount-lavinia | created (batch 1) | 6 | LPW, PG, Wikipedia, rome2rio, Newswire |
| nugegoda | created (batch 1) | 6 | LPW, PG, Wikipedia, rome2rio, trainschedule.lk, EconomyNext |
| kadawatha | created (batch 1) | 6 | LPW, PG, Wikipedia, primelands.lk, rome2rio, Newswire |
| battaramulla | updated | 6 | LPW, PG, Wikipedia, Newswire, Ada Derana, The Morning |
| kahathuduwa | updated | 5 | LPW, Wikipedia, rome2rio, EconomyNext / FT (Ruwanpura Expressway) |
| kottawa | updated | 6 | LPW, PG, Wikipedia, rome2rio, mmck.lk |
| bambalapitiya | updated | 6 | LPW, PG, Wikipedia, trainschedule.lk, FT, Newswire |
| malabe | updated | 6 | LPW, PG, Wikipedia, rome2rio, FT, Cabinet Office |
| moratuwa | created | 6 | LPW, PG, Wikipedia, citypopulation.de, rome2rio, Newswire |
| gampaha | created | 6 | LPW, PG, Wikipedia, botanicgardens.gov.lk, rome2rio, Copernicus / UNICEF |
| wadduwa | created | 6 | LPW, PG, Wikipedia, trainschedule.lk, rome2rio, Ada Derana |
| kalutara | created | 6 | LPW, PG, Wikipedia, rome2rio, primelands.lk |
| mattegoda | created | 6 | LPW, Wikipedia, rome2rio, ikman, primelands.lk |
| colombo-14 (Grandpass) | created | 6 | LPW, PG, Wikipedia, ikman |
| colombo-02 (Slave Island / Union Place) | created | 6 | LPW, PG, Wikipedia, developer page, Google News headlines |
| dematagoda | created | 6 | LPW, PG, Wikipedia, sl railway forum, Newsfirst |
| dalugama (Kelaniya) | created | 6 | LPW, PG, Wikipedia, rome2rio, primelands.lk |
| digana | created | 6 | LPW, PG, Wikipedia, rome2rio, primelands.lk |
| south-coast (Ahangama, Weligama, Mirissa) | created | 6 | LPW, PG, Wikipedia, rome2rio, agent guides |
| thalawathugoda | photos only | 6 | (text unchanged) |

Out of scope, untouched (no published project): hokandara, homagama, ratmalana, kollupitiya — they still carry the old generic hero and have no gallery.

## Photos
- Sources: Unsplash, Pexels and Wikimedia Commons (CC0 / CC BY / CC BY-SA). Every photo has a caption and a credit line; the hero's credit prints under the gallery. Files are copies in R2 under `neighborhoods/<slug>/`.
- Unsplash and Pexels have almost no photographed landmarks for these suburbs (their search does not index the location tag, and most Sri Lankan suburbs have 0–5 photos). Commons filled most gaps, but a Commons hit matches on words, not place ("Richmond Castle" returned Yorkshire, "Jubilee Post" returned Cleveland) — each pick was checked against its description and categories.
- Where a small suburb has no photographed landmark of its own (Kadawatha, Kahathuduwa, Kottawa, Mattegoda, Malabe, Nugegoda, Dematagoda, Colombo 14, Kalkudah), the gallery mixes the few in-area photos with the nearest famous ones, and the caption says so ("nearby", "about N km away"). Swap them when better photos exist.
- Quality gate on every file: 2400 px wide (or the largest available, at least 1800), Laplacian sharpness measured, no watermarks, no black-and-white scans, no night noise.

## Flags and open items
- **Maison Ceylon copy**: the three villa listings say the plots are "in Ahangama, Weligama, or Mirissa (Galle District)" and `district` is Galle. Only Ahangama is in Galle District; Weligama and Mirissa are in Matara District (Wikipedia, PropertyGuide). Not changed — the copy was the owner's; the South Coast page uses the correct districts.
- **Wrong text corrected**: Dehiwala's old description said "a town of around 15,000 residents" (about 89,000 in the DS division, about 246,000 in the council area, 2012 census).
- **Conflicts kept visible in the text**: Kottawa/Kahathuduwa/Mattegoda distances to Fort vary by source; Malabe is "about 10 km" (Wikipedia, PG) vs 15 km by road (rome2rio); Nugegoda PG apartment average (Rs 28,350 /sq ft) vs its own latest month (Rs 35,097); several DS divisions/councils and populations were unverifiable and are omitted.
- **Excluded as single-snippet / unverified**: Nawaloka Medical Centre (Mount Lavinia), Hejaaz/Alethea schools, restaurants for Kadawatha/Kalkudah/Gampaha, Rosewood-style clinics without a second source, the Southern Expressway "Wadduwa interchange" (there is none).
- **Flood note**: Gampaha and Dalugama carry a due-diligence line about the Kelani basin / Cyclone Ditwah (Nov 2025).
- The agents that researched Nugegoda replayed LPW's own public stats request to try to read its price charts (it returned nothing).

## Named places to spot-check (source in brackets)
- **Mount Lavinia**: S. Thomas' College, Science College (Wikipedia); Colombo South Teaching Hospital; Medihelp Hospital (medihelp.lk); Arpico Super Centre 147 Galle Rd (Waze), Singer Mega (PG); Soul Beach, The Lion Pub (kupi.com / PG).
- **Dehiwala**: Holy Family Convent, Presbyterian Girls' National School (Wikipedia); Dehiwala Flyover; Attidiya Bird Sanctuary; National Zoological Gardens (Rs 300 million upgrade, Sunday Times 24 May 2026).
- **Nugegoda**: Anula Vidyalaya, Lyceum International, Royal Institute International, University of Sri Jayewardenepura (Wikipedia); Sri Jayewardenepura General Hospital (infolanka), Winlanka Hospital; Nugegoda Market, Arpico; Jubilee Post; Urban Wetland Park (Yamu); Ananda Samarakoon Open-Air Theatre (Newsfirst).
- **Kadawatha**: Kadawatha Central College, York International School, Vidyaloka Vidyalaya; Rosewood Hospital, Kadawatha Hospital (Pvt) Ltd, Suwasiri Hospital, Colombo North Teaching Hospital (Ragama); Arpico Super Centre, Cargills Food City; Multimodal Transport Centre (transport.gov.lk, opened 21 Aug 2024).
- **Battaramulla**: Overseas School of Colombo, Sri Subhuthi Central College; Diyatha Uyana (opened 15 Sep 2014), Water's Edge; National War Memorial; Lanka Metro Transit HQ at Sethsiripaya.
- **Kottawa / Mattegoda / Kahathuduwa**: Kottawa Dharmapala Maha Vidyalaya (1970), Ananda Vidyalaya (1902); Makumbura Multimodal Centre (opened 31 Mar 2019); Wetara District Hospital; Kahathuduwa interchange = E01 Exit 2; Ruwanpura Expressway Phase 1 procurement approved 28 Jul 2026.
- **Bambalapitiya**: St. Peter's College (1922), Holy Family Convent (1903), Hindu College; Majestic City (opened 1991); station renovation reopened 10 Sep 2026 (FT).
- **Malabe**: SLIIT Malabe campus, Horizon Campus, CINEC; Dr Neville Fernando Teaching Hospital (government-run since Aug 2017); Malabe Boys' School (1987).
- **Moratuwa**: University of Moratuwa, Prince of Wales' College, St. Sebastian's College; K-Zone (John Keells Properties); Moratuwa District Hospital; De Soysa Stadium; Holy Emmanuel Church.
- **Gampaha / Wadduwa / Kalutara**: Henarathgoda Botanic Gardens (est. 1876, botanicgardens.gov.lk); Bandaranayake College; Sethma Hospital; Wadduwa Central College; The Blue Water (Geoffrey Bawa); Kalutara Vidyalaya (1941), Kalutara Balika Vidyalaya (1942), Holy Cross College; Teaching Hospital Kalutara; Kalutara Bodhiya.
- **Colombo 02 / 14 / Dematagoda / Dalugama**: Nawaloka Hospital (H.K. Dharmadasa Mw); R. Premadasa and Sugathadasa Stadiums; Sulaiman's Hospital; Wesley, Nalanda, St. John's, Ananda and Zahira colleges; Lady Ridgeway Hospital; University of Kelaniya (218 Kandy Road), Kelaniya Raja Maha Vihara.
- **Digana / South Coast**: Victoria Dam (opened 1985), Pallekele International Cricket Stadium; Taprobane Island, Kusta Raja Gala, Parrot Rock, Coconut Tree Hill.
