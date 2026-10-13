"use client";

import { useEffect, useMemo, useState } from "react";
import { useDocumentInfo, useField } from "@payloadcms/ui";
import { OUTREACH_SENDERS, OUTREACH_TEMPLATES } from "@/lib/outreach-templates";

// Outreach log: one friendly screen to write, preview and send an email to a developer (owner, 2026-10-12: "redesign this better").
// Left: four numbered steps. Right: the email exactly as it will arrive, with the Send button. The seven underlying Payload fields are
// hidden and written with useField, so the normal Save button still keeps everything.
type Option = { id: number; name: string; slug?: string };
type Preview = { subject: string; html: string; live: boolean };

const line = "1px solid var(--theme-elevation-150)";
const card = { border: line, background: "var(--theme-elevation-0)", padding: 18, marginBottom: 16 } as const;
const input = { width: "100%", padding: "9px 10px", border: line, background: "var(--theme-input-bg, var(--theme-elevation-0))", color: "var(--theme-text)", fontSize: 14, boxSizing: "border-box" } as const;
const label = { display: "block", fontSize: 13, fontWeight: 600, margin: "0 0 4px" } as const;
const help = { fontSize: 12, opacity: 0.65, margin: "4px 0 0" } as const;

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section style={card}>
      <h3 style={{ margin: "0 0 14px", fontSize: 16, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ background: "var(--theme-text)", color: "var(--theme-bg)", width: 24, height: 24, borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>{n}</span>
        {title}
      </h3>
      {children}
    </section>
  );
}

export function OutreachComposer() {
  const { id } = useDocumentInfo();
  const developer = useField<number | string | null>({ path: "developer" });
  const projects = useField<(number | string)[] | null>({ path: "projects" });
  const template = useField<string | null>({ path: "template" });
  const contactName = useField<string | null>({ path: "contactName" });
  const toEmail = useField<string | null>({ path: "toEmail" });
  const fromAddress = useField<string | null>({ path: "fromAddress" });
  const customNote = useField<string | null>({ path: "customNote" });
  const lead = useField<number | string | null>({ path: "lead" });

  const [developers, setDevelopers] = useState<Option[]>([]);
  const [listings, setListings] = useState<Option[]>([]);
  const [leads, setLeads] = useState<{ id: number; name: string; project?: { name?: string } | number; createdAt?: string }[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const devId = developer.value ? String(developer.value) : "";
  const selected = useMemo(() => (projects.value ?? []).map(String), [projects.value]);
  const from = fromAddress.value || OUTREACH_SENDERS[0].value;

  useEffect(() => {
    fetch("/payload-api/developers?limit=500&depth=0&sort=name&select[name]=true", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { docs: [] }))
      .then((b) => setDevelopers((b.docs ?? []) as Option[]))
      .catch(() => setDevelopers([]));
  }, []);

  useEffect(() => {
    if (!devId) return;
    fetch(`/payload-api/projects?where[developer][equals]=${devId}&limit=100&depth=0&sort=name&select[name]=true&select[slug]=true`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { docs: [] }))
      .then((b) => setListings((b.docs ?? []) as Option[]))
      .catch(() => setListings([]));
  }, [devId]);

  const shownListings = devId ? listings : [];
  const needsLead = template.value === "lead-followup";
  const leadId = needsLead && lead.value ? String(lead.value) : "";

  useEffect(() => {
    if (!devId || !needsLead) return;
    fetch(`/payload-api/leads?where[project.developer][equals]=${devId}&sort=-createdAt&limit=30&depth=1&select[name]=true&select[project]=true&select[createdAt]=true`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { docs: [] }))
      .then((b) => setLeads((b.docs ?? []) as typeof leads))
      .catch(() => setLeads([]));
  }, [devId, needsLead]);

  useEffect(() => {
    if (!id || !template.value || !devId) return;
    const timer = setTimeout(() => {
      setError("");
      const query = new URLSearchParams({ template: template.value ?? "", contactName: contactName.value ?? "", note: customNote.value ?? "", developerId: devId, projectIds: selected.join(","), leadId });
      fetch(`/api/outreach/${id}?${query}`, { credentials: "include" })
        .then(async (r) => { const body = await r.json().catch(() => ({})); if (!r.ok) throw new Error(body.error ?? "Could not load the preview."); return body as Preview; })
        .then(setPreview)
        .catch((e: Error) => { setPreview(null); setError(e.message); });
    }, 450);
    return () => clearTimeout(timer);
  }, [id, template.value, contactName.value, customNote.value, devId, selected, leadId]);

  function toggleListing(listingId: number) {
    const key = String(listingId);
    projects.setValue(selected.includes(key) ? selected.filter((x) => x !== key) : [...selected, key]);
  }

  async function send() {
    if (!window.confirm(`Send this email to ${toEmail.value}?${preview?.live === false ? "\n\n(Test mode: it will go to the test inbox, not to them.)" : ""}`)) return;
    setBusy(true); setMessage(""); setError("");
    try {
      const res = await fetch(`/api/outreach/${id}`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template: template.value, contactName: contactName.value, toEmail: toEmail.value, fromAddress: from, customNote: customNote.value, developerId: devId, projectIds: selected, leadId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) setError(body.error ?? "Could not send.");
      else {
        setMessage(body.live ? `✓ Sent to ${body.sentTo}. Refreshing…` : `✓ Test mode: sent to ${body.sentTo} instead of the developer. Refreshing…`);
        setTimeout(() => window.location.reload(), 1800);
      }
    } finally { setBusy(false); }
  }

  const ready = Boolean(id && devId && template.value && toEmail.value && (!needsLead || leadId));
  const missing = !id ? "Press Save once so this email gets its tracked links." : !devId ? "Pick a company." : !template.value ? "Pick a template." : !toEmail.value ? "Enter their email address." : needsLead && !leadId ? "Choose which lead this is about." : "";

  return (
    <div className="ln-composer" style={{ marginBottom: 24 }}>
      <style>{`.ln-composer-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);gap:20px;align-items:start}@media(max-width:1100px){.ln-composer-grid{grid-template-columns:minmax(0,1fr)}}`}</style>
      <div className="ln-composer-grid">
        <div>
          <Step n={1} title="Who is it for?">
            <label style={label} htmlFor="oc-company">Company</label>
            <select id="oc-company" style={input} value={devId} onChange={(e) => { developer.setValue(e.target.value ? Number(e.target.value) : null); projects.setValue([]); }}>
              <option value="">Choose a company…</option>
              {developers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            {devId ? (
              <div style={{ marginTop: 14 }}>
                <span style={label}>Listings to mention <span style={{ fontWeight: 400, opacity: 0.65 }}>(optional, each gets its own tracked link)</span></span>
                {shownListings.length ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {shownListings.map((l) => {
                      const on = selected.includes(String(l.id));
                      return (
                        <button key={l.id} type="button" onClick={() => toggleListing(l.id)} aria-pressed={on}
                          style={{ padding: "6px 12px", border: line, cursor: "pointer", fontSize: 13, background: on ? "var(--theme-text)" : "transparent", color: on ? "var(--theme-bg)" : "var(--theme-text)" }}>
                          {on ? "✓ " : ""}{l.name}
                        </button>
                      );
                    })}
                  </div>
                ) : <p style={help}>No listings found for this company.</p>}
              </div>
            ) : null}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
              <div>
                <label style={label} htmlFor="oc-name">Contact first name</label>
                <input id="oc-name" style={input} value={contactName.value ?? ""} onChange={(e) => contactName.setValue(e.target.value)} placeholder="Erwan" />
                <p style={help}>Used in “Hi ___,”.</p>
              </div>
              <div>
                <label style={label} htmlFor="oc-email">Their email address</label>
                <input id="oc-email" type="email" style={input} value={toEmail.value ?? ""} onChange={(e) => toEmail.setValue(e.target.value)} placeholder="name@company.com" />
              </div>
            </div>
          </Step>

          <Step n={2} title="Choose a template">
            <div style={{ display: "grid", gap: 10 }}>
              {OUTREACH_TEMPLATES.map((t) => {
                const on = template.value === t.id;
                return (
                  <button key={t.id} type="button" onClick={() => template.setValue(t.id)} aria-pressed={on}
                    style={{ textAlign: "left", padding: "12px 14px", border: on ? "2px solid var(--theme-text)" : line, background: on ? "var(--theme-elevation-50)" : "transparent", color: "var(--theme-text)", cursor: "pointer" }}>
                    <strong style={{ display: "block", fontSize: 14 }}>{on ? "● " : "○ "}{t.label}</strong>
                    <span style={{ fontSize: 13, opacity: 0.75 }}>{t.description}</span>
                  </button>
                );
              })}
            </div>
          </Step>

          {needsLead ? (
            <Step n={3} title="Which lead is waiting?">
              <label style={label} htmlFor="oc-lead">Lead</label>
              <select id="oc-lead" style={input} value={lead.value ? String(lead.value) : ""} onChange={(e) => lead.setValue(e.target.value ? Number(e.target.value) : null)}>
                <option value="">{devId ? "Choose a lead…" : "Pick a company first"}</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} · {typeof l.project === "object" ? l.project?.name : ""} · {l.createdAt ? new Date(l.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : ""}
                  </option>
                ))}
              </select>
              <p style={help}>The buyer&apos;s details are put in the email.</p>
            </Step>
          ) : null}

          <Step n={needsLead ? 4 : 3} title="Make it yours (optional)">
            <label style={label} htmlFor="oc-note">Extra note</label>
            <textarea id="oc-note" rows={4} style={{ ...input, resize: "vertical" }} value={customNote.value ?? ""} onChange={(e) => customNote.setValue(e.target.value)} placeholder="Added right after the greeting. Leave empty to send the template as is." />
            <p style={help}>Do not mention pricing.</p>
            <label style={{ ...label, marginTop: 14 }} htmlFor="oc-from">Send from</label>
            <select id="oc-from" style={input} value={from} onChange={(e) => fromAddress.setValue(e.target.value)}>
              {OUTREACH_SENDERS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <p style={help}>A copy of every email also goes to this address.</p>
          </Step>
        </div>

        <div style={{ position: "sticky", top: 16 }}>
          <Step n={needsLead ? 5 : 4} title="Check it, then send">
            {!template.value || !devId ? <p style={{ margin: 0, opacity: 0.7 }}>Pick a company and a template to see the email here.</p> : null}
            {error ? <p style={{ margin: "0 0 10px", color: "var(--theme-error-500)" }}>{error}</p> : null}
            {template.value && devId && preview ? (
              <>
                <div style={{ fontSize: 13, lineHeight: 1.7, borderBottom: line, paddingBottom: 10, marginBottom: 10 }}>
                  <div><span style={{ opacity: 0.6 }}>From </span>LankaNewHomes &lt;{from}&gt;</div>
                  <div><span style={{ opacity: 0.6 }}>To </span>{toEmail.value || <em>their email address</em>}</div>
                  <div><span style={{ opacity: 0.6 }}>Subject </span><strong>{preview.subject}</strong></div>
                </div>
                <iframe title="Email preview" srcDoc={preview.html} sandbox="" style={{ width: "100%", height: 460, border: line, background: "#fff" }} />
              </>
            ) : null}
            <div style={{ marginTop: 14 }}>
              <button type="button" className="btn btn--style-primary" disabled={busy || !ready} onClick={send} style={{ width: "100%" }}>
                {busy ? "Sending…" : "Send this email"}
              </button>
              {missing ? <p style={help}>{missing}</p> : null}
              {preview && preview.live === false ? <p style={help}>Test mode: sending from this session goes to the test inbox only.</p> : null}
              {message ? <p style={{ margin: "10px 0 0" }}>{message}</p> : null}
              <p style={help}>Edits here are kept when you press Save. The preview updates as you type.</p>
            </div>
          </Step>
        </div>
      </div>
    </div>
  );
}
