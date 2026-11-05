import { compactLkr } from "@/lib/format";

// Title and description for a neighbourhood page. Search Console (2026-11-02): area words such as "meegoda" were shown 700+ times
// at position 8 to 10 with almost no clicks, and many searches are "which district is X in". So the title names the district and
// what is for sale, and the description opens with the district and the lowest published price.

export type AreaMetaInput = {
  name: string;
  city?: string;
  district?: string;
  homeCount: number;
  plotCount: number;
  /** Lowest published price per perch among the area's plots, 0 when none. */
  lowestPerPerch: number;
  /** Lowest starting price among the area's new homes, 0 when none. */
  lowestHomePrice: number;
  /** First sentences of the area's own overview. */
  intro: string;
};

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/** The wider place to show after the name: the district, else the city, and nothing when it just repeats the name. */
function wherePart({ name, city, district }: Pick<AreaMetaInput, "name" | "city" | "district">): string {
  const place = (district || city || "").trim();
  return place && place.toLowerCase() !== name.trim().toLowerCase() ? place : "";
}

export function areaTitle(input: AreaMetaInput): string {
  const where = wherePart(input);
  const found = [input.homeCount > 0 ? plural(input.homeCount, "New Home", "New Homes") : "", input.plotCount > 0 ? plural(input.plotCount, "Land Plot", "Land Plots") : ""].filter(Boolean).join(" & ");
  const base = `Houses & Land for Sale in ${input.name}${where ? `, ${where}` : ""}`;
  return found ? `${base}: ${found}` : `${base}: Prices & Area Guide`;
}

export function areaDescription(input: AreaMetaInput, max = 160): string {
  const where = wherePart(input);
  const bits = [
    input.homeCount > 0 ? plural(input.homeCount, "new home", "new homes") + (input.lowestHomePrice > 0 ? ` from ${compactLkr(input.lowestHomePrice)}` : "") : "",
    input.plotCount > 0 ? plural(input.plotCount, "land plot", "land plots") + (input.lowestPerPerch > 0 ? ` from ${compactLkr(input.lowestPerPerch)} per perch` : "") : "",
  ].filter(Boolean);
  const lead = `${input.name}${where ? ` is in ${where}` : ""}. ` + (bits.length ? `${bits.join(" and ")} for sale, with prices and developers. ` : "Houses and land for sale: area guide and new homes. ");
  const room = max - lead.length;
  const intro = room >= 50 ? trimToSentence(input.intro, room) : "";
  return `${lead}${intro}`.trim();
}

/** Cut at the last full sentence that fits, else at a word with an ellipsis. */
function trimToSentence(text: string, max: number): string {
  const first = (text.split(/\n{2,}/)[0] ?? "").replace(/\s+/g, " ").trim();
  if (first.length <= max) return first;
  const cut = first.slice(0, max);
  const stop = cut.lastIndexOf(". ");
  return stop > 40 ? cut.slice(0, stop + 1) : `${cut.replace(/\s+\S*$/, "")}…`;
}
