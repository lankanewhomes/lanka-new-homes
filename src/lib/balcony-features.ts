import type { KeyFeatureCategory } from "@/types";

// A dedicated "Balcony" / "Balconies" Key Features item ("Balcony: Private
// balcony") is a fact about the unit, so floor-plan pages show it as the
// fact sheet's "Balcony" row (owner, 2026-09-21) instead of inside Key
// Features. Passing mentions in other fields ("Finishes: … balconies … laid
// with tiles", "Kitchen: … kitchen balconies") are not balcony facts and stay.
const BALCONY_FIELD = /^balcon(y|ies)$/i;
const BALCONY_VALUE_ONLY = /^(private |wraparound |shared )?balcon(y|ies)$/i;
const BARE_BALCONY = /^balcon(y|ies)$/i;

export function splitBalconyFeature(unitFeatures: unknown): { balcony: string | undefined; rest: unknown } {
  if (!Array.isArray(unitFeatures)) return { balcony: undefined, rest: unitFeatures };

  const found: string[] = [];
  const rest = (unitFeatures as KeyFeatureCategory[]).map((group) => ({
    ...group,
    items: (group.items ?? []).filter((item) => {
      const field = (item.field ?? "").trim();
      const value = (item.value ?? "").trim();
      const isBalcony = field ? BALCONY_FIELD.test(field) : BALCONY_VALUE_ONLY.test(value);
      if (!isBalcony) return true;
      // "Balcony" on its own says nothing more than "there is one".
      const shown = BARE_BALCONY.test(value) ? "Yes" : value;
      if (shown && !found.includes(shown)) found.push(shown);
      return false;
    }),
  }));

  return { balcony: found.length ? found.join("; ") : undefined, rest };
}
