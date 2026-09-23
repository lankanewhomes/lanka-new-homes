import type { Neighborhood, Project } from "@/types";

// Plain module (no "use client") — called from the neighborhood server page.
// The questions about new homes are answered from the live listings, so they never go stale
// or need editing; only the two area questions (known for / close to Colombo) are authored.

type FaqItem = { question: string; answer: string };

type TypeGroup = { key: "apartments" | "houses" | "villas" | "mixed" | "hotel"; noun: string };

const TYPE_GROUPS: { test: RegExp; group: TypeGroup }[] = [
  { test: /condominium|apartment/i, group: { key: "apartments", noun: "apartments and condominiums" } },
  { test: /villa/i, group: { key: "villas", noun: "villas" } },
  { test: /house/i, group: { key: "houses", noun: "houses" } },
  { test: /mixed/i, group: { key: "mixed", noun: "mixed-use developments" } },
  { test: /hotel|retreat/i, group: { key: "hotel", noun: "hotel and coastal retreat developments" } },
];

function groupOf(type: string): TypeGroup | undefined {
  return TYPE_GROUPS.find((entry) => entry.test.test(type))?.group;
}

function list(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** Short labels for the "Typical property types" chip, in a fixed order, e.g. ["Apartments", "Villas"]. */
export function propertyTypeLabels(projects: Project[]): string[] {
  const order: TypeGroup["key"][] = ["apartments", "houses", "villas", "mixed", "hotel"];
  const labels: Record<TypeGroup["key"], string> = { apartments: "Apartments", houses: "Houses", villas: "Villas", mixed: "Mixed-use", hotel: "Coastal retreat" };
  const present = new Set(projects.map((project) => groupOf(project.type ?? "")?.key).filter(Boolean) as TypeGroup["key"][]);
  return order.filter((key) => present.has(key)).map((key) => labels[key]);
}

export function buildNeighborhoodFaqs(neighborhood: Neighborhood, projects: Project[]): FaqItem[] {
  const name = neighborhood.name;
  const authored = (neighborhood.faqs ?? []).filter((faq) => faq.question && faq.answer);
  const count = projects.length;
  const projectNames = projects.map((project) => project.name);
  const developerNames = Array.from(new Set(projects.map((project) => project.developerName).filter(Boolean)));

  const items: FaqItem[] = [];

  items.push({
    question: `What new homes are available in ${name}?`,
    answer:
      count > 0
        ? `LankaNewHomes currently lists ${count} new ${count === 1 ? "project" : "projects"} in ${name}: ${list(projectNames)}. Each listing page has the floor plans, amenities and developer details.`
        : `No new projects are listed in ${name} on LankaNewHomes yet. Browse the nearby areas below, or check back as new developments are added.`,
  });

  if (authored[0]) items.push(authored[0]);
  if (authored[1]) items.push(authored[1]);

  if (count > 0) {
    const counts = new Map<string, number>();
    for (const project of projects) {
      const group = groupOf(project.type ?? "");
      if (group) counts.set(group.noun, (counts.get(group.noun) ?? 0) + 1);
    }
    if (counts.size > 0) {
      const parts = Array.from(counts.entries()).map(([noun, n]) => `${noun} (${n} ${n === 1 ? "project" : "projects"})`);
      items.push({
        question: `What types of new homes are being built in ${name}?`,
        answer: `The projects listed in ${name} are ${list(parts)}.`,
      });
    }

    const flats = projects.filter((project) => groupOf(project.type ?? "")?.key === "apartments").map((project) => project.name);
    items.push({
      question: `Are there new apartment or condominium projects in ${name}?`,
      answer:
        flats.length > 0
          ? `Yes. New apartment and condominium projects listed in ${name} include ${list(flats)}.`
          : `No apartment or condominium projects are listed in ${name} at the moment. The projects listed here are ${counts.size > 0 ? list(Array.from(counts.keys())) : "of other types"}.`,
    });

    if (developerNames.length > 0) {
      items.push({
        question: `Who is building new homes in ${name}?`,
        answer: `The projects listed in ${name} are being built by ${list(developerNames)}. Each developer's page shows its other projects.`,
      });
    }
  }

  return items;
}
