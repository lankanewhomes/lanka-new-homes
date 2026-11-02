import { describe, expect, it } from "vitest";
import { landsInArea } from "./area-lands";
import type { Land } from "@/types";

const land = (city: string, location: string) => ({ slug: `${city}-${location}`, city, location }) as unknown as Land;

describe("landsInArea", () => {
  const area = { name: "Hokandara", slug: "hokandara" };
  it("matches the city or one part of the location", () => {
    const lands = [land("Hokandara", ""), land("", "Hokandara, Colombo"), land("Malabe", "Malabe, Colombo")];
    expect(landsInArea(lands, area)).toHaveLength(2);
  });
  it("does not match a part of a longer name", () => {
    expect(landsInArea([land("", "Galle Road, Colombo")], { name: "Galle", slug: "galle" })).toHaveLength(0);
    expect(landsInArea([land("Colombo 14", "")], { name: "Colombo 02", slug: "colombo-02" })).toHaveLength(0);
  });
  it("matches the slug spelling too", () => {
    expect(landsInArea([land("Colombo 02", "")], { name: "Colombo 02", slug: "colombo-02" })).toHaveLength(1);
  });
});
