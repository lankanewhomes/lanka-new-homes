import type { SampleMapPoi } from "./theme-types";

// A stylised, illustrative map for the sample site's Location section — not a
// real map of anywhere. A real site would embed the developer's actual map.
// `title`/`pois` come from the theme (site name + 4 nearby-place labels);
// the road/water/park shapes themselves stay the same across every theme —
// only the CSS custom properties they're coloured with change per theme.
export function LocationMap({ title, pois }: { title: string; pois: readonly SampleMapPoi[] }) {
  return (
    <svg viewBox="0 0 520 380" role="img" aria-label={`Illustrative map showing ${title} at the centre`} className="smp-map-svg">
      <rect width="520" height="380" className="smp-map-land" />
      <path d="M0 300 C 90 270, 150 330, 250 300 S 430 250, 520 290 L520 380 L0 380 Z" className="smp-map-water" />
      <path d="M40 40 C 90 20, 150 30, 170 80 S 120 150, 60 140 S 10 80, 40 40 Z" className="smp-map-park" />
      <path d="M380 60 C 430 50, 480 80, 470 130 S 400 160, 370 120 S 350 70, 380 60 Z" className="smp-map-park" />
      <path d="M-10 190 C 120 170, 220 210, 330 180 S 470 150, 540 170" className="smp-map-road smp-map-road-main" />
      <path d="M260 -10 C 250 90, 290 150, 270 250 S 250 340, 262 390" className="smp-map-road smp-map-road-main" />
      <path d="M0 110 C 80 120, 130 100, 200 130" className="smp-map-road" />
      <path d="M300 200 C 360 240, 420 230, 520 250" className="smp-map-road" />
      <path d="M120 250 C 170 230, 220 260, 262 230" className="smp-map-road" />
      <circle cx="262" cy="190" r="34" className="smp-map-pulse" />
      <circle cx="262" cy="190" r="12" className="smp-map-dot" />
      <text x="262" y="236" textAnchor="middle" className="smp-map-title">{title}</text>
      {pois.map((place) => (
        <g key={place.t}>
          <circle cx={place.x} cy={place.y} r="5" className="smp-map-poi" />
          <text x={place.x} y={place.y - 12} textAnchor="middle" className="smp-map-poi-label">{place.t}</text>
        </g>
      ))}
    </svg>
  );
}
