const GOOD = new Set(["active", "published", "approved", "verified", "completed", "available", "now selling", "fulfilled", "confirmed", "contacted", "site_visit", "paid", "yes", "true", "developer-pro", "ok"]);
const WARN = new Set(["pending", "new", "requested", "invited", "coming soon", "reserved", "under construction", "past_due", "launching soon", "draft", "unpublished", "incomplete", "queued"]);
const BAD = new Set(["failed", "rejected", "canceled", "cancelled", "sold", "closed", "unpaid", "refunded", "archived", "no", "false", "spam"]);

export function chipTone(value: string): "good" | "warn" | "bad" | "plain" {
  const v = value.toLowerCase();
  return GOOD.has(v) ? "good" : WARN.has(v) ? "warn" : BAD.has(v) ? "bad" : "plain";
}

export function StatusChip({ value, label }: { value: string; label?: string }) {
  const tone = chipTone(value);
  const cls = tone === "good" ? "bg-ok/10 text-ok" : tone === "warn" ? "bg-warn/10 text-warn" : tone === "bad" ? "bg-bad/10 text-bad" : "bg-subtle text-muted";
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{label ?? value.replace(/[_-]/g, " ")}</span>;
}
