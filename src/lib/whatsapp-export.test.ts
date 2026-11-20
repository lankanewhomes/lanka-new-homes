import { describe, expect, it } from "vitest";
import { parseWhatsAppExport } from "./whatsapp-export";

describe("parseWhatsAppExport", () => {
  it("reads iPhone lines and multi-line messages", () => {
    const r = parseWhatsAppExport("[11/19/26, 3:45:12 PM] Me: Hello\nsecond line\n[11/19/26, 3:50:00 PM] Dev: Hi there", "mdy", 0);
    expect(r).toHaveLength(2);
    expect(r[0]).toMatchObject({ sender: "Me", text: "Hello\nsecond line" });
    expect(r[0].sentAt.toISOString()).toBe("2026-11-19T15:45:12.000Z");
    expect(r[1].sender).toBe("Dev");
  });
  it("reads Android lines, day-first dates and 12am", () => {
    const r = parseWhatsAppExport("19/11/2026, 12:05 am - Dev: Ayubowan", "dmy", 0);
    expect(r[0].sentAt.toISOString()).toBe("2026-11-19T00:05:00.000Z");
  });
  it("skips media placeholders and applies the timezone offset", () => {
    const r = parseWhatsAppExport("11/19/26, 3:45 PM - Me: <Media omitted>\n11/19/26, 3:46 PM - Me: ok", "mdy", 300);
    expect(r).toHaveLength(1);
    expect(r[0].sentAt.toISOString()).toBe("2026-11-19T20:46:00.000Z");
  });
});
