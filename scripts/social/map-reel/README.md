# Map "minutes from" reel (design system 2026-11-16)

1. `python3 scripts/social/map_reel_geo.py OUT LAT LNG --landmarks "Name@lat,lng=>DISPLAY|..."` : OSM roads + OSRM driving routes (`mapgeo.json`, `basemap.png`).
   Pick real, well-known landmarks yourself (auto candidates can be junk). Public Overpass servers are often busy; `overpass.openstreetmap.fr` was the fast one.
2. Copy `MapGeneric.tsx` into a Remotion project (`src/`), register `MapGeneric` in Root with `calculateMetadata` (see `timeline()`), put `basemap.png` in `public/maps/<id>/` and photos in `public/media/<id>/`, logo `public/media/logo-white.png`, fonts Archivo.
3. `python3 build_map_reel.py cfg.json` : Ava voice (edge-tts in `ttsenv`) for intro, callouts, routes and end; writes `props_<id>.json` and `mix_<id>.wav` (see `stage_cfgs.py` for the config shape).
4. `npx remotion render src/index.ts MapGeneric out.mp4 --props=props_<id>.json --crf=14`, then mux the mix with ffmpeg.
Rules: logo on every reel, Archivo, title bold uppercase + city regular accent colour, "N MINS" under the place name, info low on the end card, cover from `reel_cover_light.py` (label "-" and city as 9th arg), plain URL, no developer names.
