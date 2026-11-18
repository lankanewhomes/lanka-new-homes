import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPayload } from "payload";
import config from "../../../../../../payload.config";
import { getSession } from "../../_data/session";
import { renderNewsletter, SAMPLE_NEWSLETTER } from "@/lib/newsletter-email";

export const metadata: Metadata = { title: "Newsletter" };
export const dynamic = "force-dynamic";

// Admin only. Shows what a newsletter looks like with its unsubscribe link at the very end, the subscriber counts, and who has unsubscribed.
export default async function Page() {
  if ((await getSession())?.role !== "admin") notFound();
  const payload = await getPayload({ config });
  const count = async (status: string) => (await payload.count({ collection: "subscribers", where: { status: { equals: status } }, overrideAccess: true })).totalDocs;
  const [subscribed, contactOnly, unsubscribed] = await Promise.all([count("subscribed"), count("contact_only"), count("unsubscribed")]);
  const gone = await payload.find({ collection: "subscribers", where: { status: { equals: "unsubscribed" } }, sort: "-updatedAt", limit: 100, depth: 0, overrideAccess: true });
  const sample = await renderNewsletter({ ...SAMPLE_NEWSLETTER, email: "sample.reader@example.com" });
  const card = { background: "#fff", border: "1px solid #e4e2db", borderRadius: 8, padding: 16 } as const;
  return (
    <div style={{ display: "grid", gap: 20, maxWidth: 1100 }}>
      <h1 style={{ margin: 0 }}>Newsletter</h1>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {[["Subscribed (gets newsletters)", subscribed], ["Contact only (never ticked a box)", contactOnly], ["Unsubscribed", unsubscribed]].map(([label, n]) => (
          <div key={String(label)} style={{ ...card, minWidth: 200 }}><div style={{ fontSize: 28, fontWeight: 600 }}>{n}</div><div style={{ fontSize: 13, color: "#6b6a66" }}>{label}</div></div>
        ))}
      </div>
      <div style={card}>
        <h2 style={{ marginTop: 0 }}>Sample newsletter</h2>
        <p style={{ fontSize: 14, color: "#6b6a66" }}>Every newsletter ends with the unsubscribe line (scroll to the bottom). The link is different for each reader and works for real.</p>
        <iframe title="Sample newsletter" srcDoc={sample.html} style={{ width: "100%", height: 760, border: "1px solid #e4e2db", borderRadius: 6, background: "#f3efe8" }} />
      </div>
      <div style={card}>
        <h2 style={{ marginTop: 0 }}>Unsubscribed ({unsubscribed})</h2>
        {gone.docs.length === 0 ? <p style={{ fontSize: 14, color: "#6b6a66" }}>Nobody has unsubscribed yet.</p> : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead><tr style={{ textAlign: "left", color: "#6b6a66" }}><th style={{ padding: 6 }}>Email</th><th style={{ padding: 6 }}>Name</th><th style={{ padding: 6 }}>Date</th></tr></thead>
            <tbody>{gone.docs.map((d) => (<tr key={d.id} style={{ borderTop: "1px solid #eee" }}><td style={{ padding: 6 }}>{d.email}</td><td style={{ padding: 6 }}>{d.name ?? ""}</td><td style={{ padding: 6 }}>{new Date(d.updatedAt).toISOString().slice(0, 10)}</td></tr>))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
