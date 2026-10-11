// Map marker glyphs, the same icons as the site header: "New Homes for Sale" (building) and "Land" (plot grid).
// Used by the /search + /lanka360 map (explorer-map.tsx) and the single-listing map (map-pane.tsx).
export function MarkerIcon({ kind, size }: { kind: "homes" | "land"; size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" width={size} height={size} aria-hidden="true">
      {kind === "land" ? (
        <path strokeLinecap="butt" strokeLinejoin="miter" d="M9 4.5v15m6-15v15M3 4.5h18v15H3z" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205 3 1m1.5.5-1.5-.5M6.75 7.364V3h-3v18m3-13.636 10.5-3.819" />
      )}
    </svg>
  );
}
