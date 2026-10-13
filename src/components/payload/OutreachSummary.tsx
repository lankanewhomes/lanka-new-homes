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
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "0 0 20px" }}>
      {chips.map(([k, v]) => (
        <span key={k} style={{ border: "1px solid var(--theme-elevation-150)", padding: "6px 12px", fontSize: 13 }}>
          <span style={{ opacity: 0.65 }}>{k}: </span><strong>{v}</strong>
        </span>
      ))}
    </div>
  );
}
