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

// Access / Road / Business exist on neighborhood pages only, so on a project page
// they simply never produce a group.
const NEARBY_CATEGORY_ORDER: NearbyPlace["category"][] = ["Access", "Road", "School", "Hospital", "Shopping", "Restaurant", "Business", "Transport", "Landmark"];

const NEARBY_LABEL: Partial<Record<NearbyPlace["category"], string>> = { Access: "Accessibility", Road: "Major roads", Business: "Business districts" };

// Neighborhood pages name the groups the way a buyer asks about them.
const NEIGHBORHOOD_LABEL: Record<NearbyPlace["category"], string> = {
  Access: "Accessibility",
  Road: "Major roads",
  School: "Schools",
  Hospital: "Hospitals",
  Shopping: "Shopping",
  Restaurant: "Restaurants",
  Business: "Business districts",
  Transport: "Public transportation",
  Landmark: "Landmarks",
};

export function groupNearbyPlaces(nearby: NearbyPlace[], options?: { neighborhood?: boolean }): NearbyPlaceGroup[] {
  return NEARBY_CATEGORY_ORDER
    .map((category) => ({
      key: category,
      label: options?.neighborhood ? NEIGHBORHOOD_LABEL[category] : NEARBY_LABEL[category] ?? category,
      items: [...nearby.filter((place) => place.category === category)].sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity)),
    }))
    .filter((group) => group.items.length > 0);
}
