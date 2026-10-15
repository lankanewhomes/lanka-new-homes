const GOOD = new Set(["active", "published", "approved", "verified", "completed", "available", "now selling", "fulfilled", "confirmed", "contacted", "site_visit", "paid", "yes", "true", "developer-pro", "ok", "converted", "move in now"]);
const WARN = new Set(["pending", "new", "requested", "invited", "coming soon", "reserved", "under construction", "past_due", "launching soon", "draft", "unpublished", "incomplete", "queued", "nearly complete"]);
const BAD = new Set(["failed", "rejected", "canceled", "cancelled", "sold", "closed", "unpaid", "refunded", "archived", "no", "false", "spam", "not_interested"]);

export function chipTone(value: string): "good" | "warn" | "bad" | "plain" {
  const v = value.toLowerCase();
  return GOOD.has(v) ? "good" : WARN.has(v) ? "warn" : BAD.has(v) ? "bad" : "plain";
}

// The same small square tags as the listing page on the site (.listing-hero-tags): 11px, bold, uppercase, letter-spaced, a tinted
// background with a matching border (green for "Now Selling" / "Published"). Amber, red and grey follow the same recipe.
const LIGHT = {
  good: "border-[#cfe6cf] bg-[#e8f4e8] text-[#1a6b2f]",
  warn: "border-[#f1dba8] bg-[#fdf3dc] text-[#8a5a00]",
  bad: "border-[#f3b8c0] bg-[#fdeaec] text-[#c0392b]",
  plain: "border-[#dedbd2] bg-[#f4f2ed] text-[#5b564b]",
};
const DARK = {
  good: "dark:border-[#26492f] dark:bg-[#14301c] dark:text-[#7ddc98]",
  warn: "dark:border-[#4d3b12] dark:bg-[#2b2210] dark:text-[#f2c66b]",
  bad: "dark:border-[#5a2a30] dark:bg-[#2e1519] dark:text-[#f19aa4]",
  plain: "dark:border-[#34343a] dark:bg-[#222228] dark:text-[#b9b3a6]",
};

/** "Published" is a solid green tag so it stands apart from the tinted status next to it ("Now Selling"). */
const PUBLISHED = "border-[#1a6b2f] bg-[#1a6b2f] text-white dark:border-[#2e9d4f] dark:bg-[#2e9d4f]";

/** `onDark`: always the light tag colours (used on the dark page hero, in either theme). */
export function StatusChip({ value, label, onDark }: { value: string; label?: string; onDark?: boolean }) {
  const tone = chipTone(value);
  const colors = value.toLowerCase() === "published" ? PUBLISHED : `${LIGHT[tone]} ${onDark ? "" : DARK[tone]}`;
  return <span className={`inline-block whitespace-nowrap rounded-[3px] border px-[7px] py-[3px] text-[11px] font-bold uppercase leading-[1.3] tracking-[0.06em] ${colors}`}>{label ?? value.replace(/[_-]/g, " ")}</span>;
}
