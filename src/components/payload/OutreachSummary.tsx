"use client";

import { useFormFields } from "@payloadcms/ui";

// Top of the Outreach edit screen: one line saying where this email stands.
const LABEL: Record<string, string> = { draft: "Draft, not sent yet", sent: "Sent", clicked: "Sent, they clicked a link", replied: "Replied", no_reply: "No reply" };

export function OutreachSummary() {
  const status = useFormFields(([f]) => (f.status?.value as string | undefined) ?? "draft");
  const clicks = useFormFields(([f]) => (f.clickCount?.value as number | undefined) ?? 0);
  const sentAt = useFormFields(([f]) => f.sentAt?.value as string | undefined);
  const to = useFormFields(([f]) => (f.toEmail?.value as string | undefined) ?? "");
  const verified = useFormFields(([f]) => Boolean(f.developerVerified?.value));
  const draft = status === "draft";
  const chips: [string, string][] = [
    ["Status", LABEL[status] ?? status],
    ...(!draft && sentAt ? [["Sent", new Date(sentAt).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })] as [string, string]] : []),
    ...(to ? [["To", to] as [string, string]] : []),
    ["Clicks", clicks ? String(clicks) : "none yet"],
    ["Company verified", verified ? "Yes ✓" : "Not yet"],
  ];
  const pill: Record<string, [string, string]> = { draft: ["#eceae4", "#55534e"], sent: ["#dbeafe", "#1d4ed8"], clicked: ["#dcfce7", "#15803d"], replied: ["#ede9fe", "#6d28d9"], no_reply: ["#fee2e2", "#b91c1c"] };
  const [pillBg, pillFg] = pill[status] ?? pill.draft;
  return (
    <div style={{ display: "flex", flexWrap: "nowrap", alignItems: "center", gap: 14, margin: "0 0 16px", padding: "8px 12px", border: "1px solid var(--theme-elevation-150)", fontSize: 13, overflow: "hidden", whiteSpace: "nowrap" }}>
      <span style={{ background: pillBg, color: pillFg, padding: "3px 12px", borderRadius: 999, fontWeight: 700, flex: "0 0 auto" }}>{LABEL[status] ?? status}</span>
      {chips.filter(([k]) => k !== "Status").map(([k, v]) => (
        <span key={k} style={{ display: "inline-flex", gap: 5, minWidth: 0, flex: k === "To" ? "1 1 auto" : "0 0 auto", overflow: "hidden", textOverflow: "ellipsis", borderLeft: "1px solid var(--theme-elevation-150)", paddingLeft: 14 }} title={`${k}: ${v}`}>
          <span style={{ opacity: 0.6 }}>{k}</span><strong style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{v}</strong>
        </span>
      ))}
    </div>
  );
}
