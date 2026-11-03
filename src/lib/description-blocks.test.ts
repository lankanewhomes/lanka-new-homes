import { describe, expect, it } from "vitest"
import { descriptionBlocks } from "./description-blocks"

describe("descriptionBlocks", () => {
  it("groups the short distance lines into one list and keeps sentences as paragraphs (Prime Dawn Artigala)", () => {
    const text = [
      "The land of all lands in Artigala is now on the market; Prime Dawn Artigala is the very latest land project by Prime Group.",
      "4Km to 122 Avissawella - Colombo bus route",
      "3Km to Hanwella town",
      "200m to 219 bus route",
      "Just 1.5km from  low-level road with easy access to banks and other supermarkets",
      "Meegoda Economic Center within 6km makes the land suitable for investment purposes",
      "Prime Dawn Artigala is an ideal land plot among Artigala Lands for residential and investment purposes that come with an interest-free payment plan.",
      "Reserve your Land in Artigala today",
    ].join("\n\n")
    const blocks = descriptionBlocks(text)
    expect(blocks.map((b) => b.type)).toEqual(["p", "list", "p", "p"])
    expect(blocks[1]).toEqual({ type: "list", items: ["4Km to 122 Avissawella - Colombo bus route", "3Km to Hanwella town", "200m to 219 bus route", "Just 1.5km from low-level road with easy access to banks and other supermarkets", "Meegoda Economic Center within 6km makes the land suitable for investment purposes"] })
  })

  it("handles the Elite Avenue layout (Km lines and Close-to lines in one list)", () => {
    const text = "ELITE AVENUE – KAHATHUDUWA, a serene land enclave where nature and connectivity come together in perfect harmony.\n\n1 Km to Koralaima Junction (120 Road)\n\n3.5 Km to Kahathuduwa Highway Entrance\n\n3.5 Km to Kahathuduwa Junction\n\n6 Km to Pokunuwita Junction\n\nClose to Piliyandala Town\n\nClose to Kasbawa Town\n\nLocated near key access points, ELITE AVENUE offers seamless connectivity to Colombo."
    const blocks = descriptionBlocks(text)
    expect(blocks.map((b) => b.type)).toEqual(["p", "list", "p"])
    expect((blocks[1] as { items: string[] }).items).toHaveLength(6)
  })

  it("keeps a single short line as a paragraph, collapses spaces and joins soft line breaks", () => {
    expect(descriptionBlocks("Reserve   your land today")).toEqual([{ type: "p", text: "Reserve your land today" }])
    expect(descriptionBlocks("This is one sentence\nthat wraps onto a second line, and it ends here.")).toEqual([{ type: "p", text: "This is one sentence that wraps onto a second line, and it ends here." }])
  })

  it("does not turn question lines or long lines into list items", () => {
    const blocks = descriptionBlocks("Do you want to own a land?\n\nTalk to our experts today.")
    expect(blocks.every((b) => b.type === "p")).toBe(true)
    expect(descriptionBlocks("")).toEqual([])
    expect(descriptionBlocks(undefined)).toEqual([])
  })
})
