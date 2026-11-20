import type { SlotContext } from "./types";

// Which featured projects suit which guide. Matching is by place and type, never by developer.
export const GUIDE_TOPICS: Record<string, { context: SlotContext; fallbacks?: SlotContext[] }> = {
  "foreigners-buying-property": { context: { type: "Apartments" } }, // foreign buyers can own units on the 4th floor or above
  "investment-property": { context: { type: "Apartments", location: "Colombo" }, fallbacks: [{ type: "Apartments" }] },
  "golden-visa": { context: { tags: ["luxury", "residences", "premium"] }, fallbacks: [{ type: "Apartments", location: "Colombo" }] },
  "apartment-prices-in-colombo": { context: { type: "Apartments", location: "Colombo" } },
  "house-prices-in-sri-lanka": { context: { type: "Housing" }, fallbacks: [{ type: "Villas" }] },
  "buy-land-in-sri-lanka": { context: { type: "Housing" }, fallbacks: [{ type: "Villas" }] },
};
