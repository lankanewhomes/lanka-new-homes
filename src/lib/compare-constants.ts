// Shared between use-compare-listings.ts ("use client" — the localStorage
// hook) and compare/page.tsx (a server component) — kept in its own plain
// module with no directive. Found 2026-09-25: compare/page.tsx used to
// import MAX_COMPARE straight from use-compare-listings.ts, but importing a
// plain constant from a "use client" module into a Server Component crosses
// the RSC client-reference boundary even for a non-component export, which
// silently turned MAX_COMPARE into something that wasn't the number 4 by
// the time it reached the server — `.slice(0, MAX_COMPARE)` collapsed to
// `.slice(0, NaN)`, i.e. always an empty array, so /compare showed "Nothing
// to compare yet" no matter what valid slugs were in the URL. Any constant
// (not just this one) that a server component needs from client-side state
// code belongs here instead, not in the "use client" file itself.
export const MAX_COMPARE = 4;
