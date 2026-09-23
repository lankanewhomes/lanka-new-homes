// Turns a plan's raw `floorRange` text into a human floor label, and folds that label into the
// plan's title (owner, 2026-09-21 — Rush City's Aqua/South/Urban Crest sit on the 1st floor while
// Units A-D span the 2nd-28th, and the title didn't say so). Plain module (no "use client") so both
// the server-rendered plan detail page and floor-plan-facts.tsx's chip row can import it.
//
// Only a plain floor number or number–number range is turned into a label — a handful of projects
// (e.g. Oceana Wadduwa) store a tower name like "Tower A" in this same field, and that must pass
// through untouched rather than be swept into "1st Floor" wording.

function ordinal(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

export function floorRangeLabel(floorRange: string | undefined): string | undefined {
  const trimmed = floorRange?.trim();
  if (!trimmed) return undefined;

  const single = /^(\d+)$/.exec(trimmed);
  if (single) return `${ordinal(Number(single[1]))} Floor`;

  const range = /^(\d+)\s*[–-]\s*(\d+)$/.exec(trimmed);
  if (range) {
    const [, from, to] = range;
    // "10–10" happens when a plan is pinned to one floor but stored as a range — same as a single value.
    return from === to ? `${ordinal(Number(from))} Floor` : `Floors ${from}–${to}`;
  }

  return undefined;
}

export function planTitleWithFloor(planName: string, floorRange: string | undefined): string {
  const label = floorRangeLabel(floorRange);
  if (!label) return planName;
  // "Unit A (South City Tower)" -> "Unit A (South City Tower, Floors 2–28)"; a name with no
  // trailing parenthetical gets one of its own: "AATH-206" -> "AATH-206 (2nd Floor)".
  return planName.endsWith(")") ? `${planName.slice(0, -1)}, ${label})` : `${planName} (${label})`;
}
