import type { NearbyPlace } from "@/types";

// Plain (non-"use client") module on purpose — groupNearbyPlaces is called
// from server components (e.g. the neighborhood page) as well as from
// components.tsx's own client components, and a function exported from a
// "use client" file can't be invoked during server rendering. Its return
// value also can't carry a resolved icon *component* across that boundary
// (React elements/component references aren't serializable server->client
// props) — so this only returns the category key, and whichever client
// component renders the groups looks up its own icon from that key.
export type NearbyPlaceGroup = { key: NearbyPlace["category"]; label: string; items: NearbyPlace[] };

const NEARBY_CATEGORY_ORDER: NearbyPlace["category"][] = ["School", "Hospital", "Shopping", "Restaurant", "Transport", "Landmark"];

export function groupNearbyPlaces(nearby: NearbyPlace[]): NearbyPlaceGroup[] {
  return NEARBY_CATEGORY_ORDER
    .map((category) => ({
      key: category,
      label: category,
      items: [...nearby.filter((place) => place.category === category)].sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity)),
    }))
    .filter((group) => group.items.length > 0);
}
