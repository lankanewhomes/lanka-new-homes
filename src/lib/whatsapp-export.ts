// Parses a chat exported from the WhatsApp phone app ("Export chat" > Without media) into messages.
// iPhone lines look like   [11/19/26, 3:45:12 PM] Name: text      Android lines look like   11/19/26, 3:45 PM - Name: text
// Lines that do not start with a timestamp belong to the previous message (multi-line messages).
export type ParsedChatMessage = { sender: string; text: string; sentAt: Date };

const IOS = /^‎?\[(\d{1,4})[/.\-](\d{1,2})[/.\-](\d{1,4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s?([APap]\.?[Mm]\.?)?\]\s+([^:]+?):\s?(.*)$/;
const ANDROID = /^‎?(\d{1,4})[/.\-](\d{1,2})[/.\-](\d{1,4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s?([APap]\.?[Mm]\.?)?\s+-\s+([^:]+?):\s?(.*)$/;

/** dateOrder: which number comes first in the exported date. tzOffsetMinutes: the browser's getTimezoneOffset() so times land correctly. */
export function parseWhatsAppExport(raw: string, dateOrder: "mdy" | "dmy", tzOffsetMinutes = 0): ParsedChatMessage[] {
  const out: ParsedChatMessage[] = [];
  for (const line of raw.replace(/\r/g, "").split("\n")) {
    const m = IOS.exec(line) ?? ANDROID.exec(line);
    if (!m) {
      const last = out[out.length - 1];
      if (last && line.trim()) last.text += `\n${line}`;
      continue;
    }
    let [a, b, c] = [Number(m[1]), Number(m[2]), Number(m[3])];
    if (a > 31) [a, b, c] = [c, b, a];
    const year = c < 100 ? 2000 + c : c;
    const month = dateOrder === "mdy" ? a : b;
    const day = dateOrder === "mdy" ? b : a;
    let hour = Number(m[4]);
    const ampm = m[7]?.toLowerCase().replace(/\./g, "");
    if (ampm === "pm" && hour < 12) hour += 12;
    if (ampm === "am" && hour === 12) hour = 0;
    const sentAt = new Date(Date.UTC(year, month - 1, day, hour, Number(m[5]), Number(m[6] ?? 0)) + tzOffsetMinutes * 60_000);
    if (Number.isNaN(sentAt.getTime())) continue;
    const text = m[9].trim();
    if (/^<?(media omitted|image omitted)>?$/i.test(text) || /^‎?(messages and calls are end-to-end encrypted)/i.test(text)) continue;
    out.push({ sender: m[8].trim(), text, sentAt });
  }
  return out;
}
