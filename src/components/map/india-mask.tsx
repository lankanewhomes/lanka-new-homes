"use client";

import { Layer, Source } from "react-map-gl/maplibre";

// Owner's call (2026-10-11): no map on the site should show India. The OpenFreeMap basemap draws all of South Asia, so this
// covers India's land (and its labels) with a flat sea-coloured shape on top of the basemap. The coastline is a coarse trace
// kept a little inside the real shore near Sri Lanka (Palk Strait), so the island itself is never touched. Add it as a child
// of every <Map>.
const INDIA: [number, number][] = [
  [74, 7.95], [77.45, 7.95], [77.54, 8.07], [77.9, 8.2], [78.12, 8.49], [78.14, 8.8], [78.35, 9.12], [78.9, 9.3], [79.2, 9.28], [79.4, 9.18],
  [79.3, 9.3], [79.1, 9.36], [78.95, 9.5], [79.0, 9.74], [79.38, 10.3], [79.85, 10.3], [79.86, 10.8], [79.83, 11.9], [80.28, 13.05],
  [80.2, 15.5], [81.0, 16.5], [82.3, 17.1], [84, 18.5], [85.6, 19.9], [87, 21.3], [88.5, 22], [88.5, 30], [74, 30],
];

const MASK = { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [[...INDIA, INDIA[0]]] } } as const;

export function IndiaMask() {
  return (
    <Source id="india-mask" type="geojson" data={MASK as never}>
      <Layer id="india-mask-fill" type="fill" paint={{ "fill-color": "rgb(158,189,255)", "fill-opacity": 1 }} />
    </Source>
  );
}
