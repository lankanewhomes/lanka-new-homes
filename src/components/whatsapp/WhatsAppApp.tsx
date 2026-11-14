"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// Admin WhatsApp inbox (/dashboard/whatsapp): every message with developers, grouped by number. Nothing is sent until you press
// "Approve & send" on a draft. Talks to /api/whatsapp/inbox.

type Conversation = { phone: string; developerId: number | null; name: string | null; lastText: string; lastAt: string; lastDirection: "inbound" | "outbound"; unanswered: number; drafts: number };
type Message = { id: number; direction: "inbound" | "outbound"; phone: string; text?: string | null; templateName?: string | null; status: string; error?: string | null; sentAt: string };
type Recipient = { developerId: number; name: string; phone: string };
type Templates = Record<string, { label: string; params: readonly string[]; body: string }>;

const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const STATUS: Record<string, string> = { received: "", draft: "Draft: not sent", sent: "Sent", delivered: "Delivered", read: "Read", failed: "Failed" };

async function api<T>(path: string, init?: RequestInit): Promise<T & { error?: string }> {
  const res = await fetch(path, { credentials: "same-origin", ...init });
  return res.json().catch(() => ({ error: `Request failed (${res.status})` }));
}

export function WhatsAppApp() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [templates, setTemplates] = useState<Templates>({});
  const [active, setActive] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [windowOpen, setWindowOpen] = useState(false);
  const [composing, setComposing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState("");
  const threadEnd = useRef<HTMLDivElement>(null);

  const loadList = useCallback(async () => {
    const r = await api<{ conversations: Conversation[] }>("/api/whatsapp/inbox?view=conversations");
    if (r.error) setError(r.error); else setConversations(r.conversations);
  }, []);
  const loadThread = useCallback(async (phone: string) => {
    const r = await api<{ messages: Message[]; windowOpen: boolean }>(`/api/whatsapp/inbox?view=thread&phone=${phone}`);
    if (!r.error) { setMessages(r.messages); setWindowOpen(r.windowOpen); }
  }, []);

  useEffect(() => {
    // First load runs in a timer callback (not in the effect body) so state is only set from a callback.
    const first = setTimeout(() => {
      void loadList();
      void api<{ recipients: Recipient[]; templates: Templates }>("/api/whatsapp/inbox?view=recipients").then((r) => { if (!r.error) { setRecipients(r.recipients); setTemplates(r.templates); } });
    }, 0);
    const t = setInterval(() => { void loadList(); }, 20_000);
    return () => { clearTimeout(first); clearInterval(t); };
  }, [loadList]);
  useEffect(() => {
    if (!active) return;
    const first = setTimeout(() => { void loadThread(active); }, 0);
    const t = setInterval(() => { void loadThread(active); }, 15_000);
    return () => { clearTimeout(first); clearInterval(t); };
  }, [active, loadThread]);
  useEffect(() => { threadEnd.current?.scrollIntoView({ block: "end" }); }, [messages]);

  const post = async (body: Record<string, unknown>) => {
    setBusy(true); setError(null);
    const r = await api<{ ok?: boolean }>("/api/whatsapp/inbox", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false);
    if (r.error) setError(r.error);
    await loadList();
    if (active) await loadThread(active);
    return r;
  };

  const activeConv = conversations.find((c) => c.phone === active);
  const title = (c: { name: string | null; phone: string }) => c.name ?? `+${c.phone}`;

  return (
    <div className="grid min-h-[70vh] gap-0 border border-[#e4ddd0] bg-white md:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="border-b border-[#e4ddd0] md:border-b-0 md:border-r">
        <div className="flex items-center justify-between border-b border-[#e4ddd0] p-3">
          <h1 className="text-[18px] font-medium">WhatsApp</h1>
          <button type="button" onClick={() => { setComposing(true); setActive(null); setError(null); }} className="bg-[#1f1f1f] px-3 py-1.5 text-[13px] text-white">New message</button>
        </div>
        <ul className="max-h-[70vh] overflow-y-auto">
          {conversations.length === 0 ? <li className="p-4 text-[14px] text-[#6b6355]">No messages yet. Replies from developers appear here.</li> : null}
          {conversations.map((c) => (
            <li key={c.phone}>
              <button type="button" onClick={() => { setActive(c.phone); setComposing(false); setError(null); }} className={`block w-full border-b border-[#f0eadf] p-3 text-left ${active === c.phone ? "bg-[#f6f1e7]" : ""}`}>
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-[14px] font-medium">{title(c)}</span>
                  <span className="shrink-0 text-[11px] text-[#6b6355]">{when(c.lastAt)}</span>
                </span>
                {c.name ? <span className="block text-[12px] text-[#6b6355]">+{c.phone}</span> : null}
                <span className="mt-0.5 block truncate text-[13px] text-[#6b6355]">{c.lastDirection === "outbound" ? "You: " : ""}{c.lastText}</span>
                <span className="mt-1 flex gap-2 text-[11px]">
                  {c.unanswered > 0 ? <span className="bg-[#f47b36] px-1.5 py-0.5 text-white">{c.unanswered} new</span> : null}
                  {c.drafts > 0 ? <span className="bg-[#fff3c4] px-1.5 py-0.5 text-[#6b5800]">{c.drafts} draft</span> : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="flex min-w-0 flex-col">
        {error ? <p className="border-b border-[#f3c9c9] bg-[#fdecec] p-3 text-[14px] text-[#9b1c1c]">{error}</p> : null}

        {composing ? (
          <NewMessage recipients={recipients} templates={templates} busy={busy} onCancel={() => setComposing(false)} onDraft={async (body) => {
            const r = await post({ action: "draft", ...body });
            if (!r.error) { setComposing(false); setActive(String(body.phone).replace(/\D/g, "")); }
          }} />
        ) : active ? (
          <>
            <header className="border-b border-[#e4ddd0] p-3">
              <p className="text-[16px] font-medium">{activeConv ? title(activeConv) : `+${active}`}</p>
              <p className="text-[12px] text-[#6b6355]">+{active}{windowOpen ? " · they wrote in the last 24 hours, so you can send normal messages" : " · outside 24 hours: only an approved template can be sent"}</p>
            </header>
            <div className="flex-1 space-y-2 overflow-y-auto bg-[#f6f1e7] p-4" style={{ maxHeight: "55vh" }}>
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.direction === "outbound" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] px-3 py-2 text-[14px] ${m.status === "draft" ? "border border-dashed border-[#c9a400] bg-[#fff8dc]" : m.direction === "outbound" ? "bg-[#d9f2c9]" : "bg-white"}`}>
                    <p className="whitespace-pre-wrap">{m.text || `(${m.templateName ?? "message"})`}</p>
                    <p className="mt-1 text-[11px] text-[#6b6355]">{when(m.sentAt)}{STATUS[m.status] ? ` · ${STATUS[m.status]}` : ""}{m.error ? ` · ${m.error}` : ""}</p>
                    {m.status === "draft" ? (
                      <div className="mt-2 flex gap-2">
                        <button type="button" disabled={busy} onClick={() => { if (window.confirm("Send this WhatsApp message now?")) void post({ action: "send", id: m.id }); }} className="bg-[#1f1f1f] px-3 py-1 text-[12px] text-white disabled:opacity-50">Approve &amp; send</button>
                        <button type="button" disabled={busy} onClick={() => void post({ action: "discard", id: m.id })} className="border border-[#1f1f1f] px-3 py-1 text-[12px] disabled:opacity-50">Discard</button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
              <div ref={threadEnd} />
            </div>
            <footer className="border-t border-[#e4ddd0] p-3">
              {windowOpen ? (
                <form onSubmit={async (e) => { e.preventDefault(); const r = await post({ action: "draft", phone: active, text, developerId: activeConv?.developerId ?? undefined }); if (!r.error) setText(""); }} className="flex gap-2">
                  <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a reply (saved as a draft first)" className="min-w-0 flex-1 border border-[#cfc6b4] px-3 py-2 text-[14px]" />
                  <button type="submit" disabled={busy || !text.trim()} className="bg-[#1f1f1f] px-4 py-2 text-[13px] text-white disabled:opacity-50">Save draft</button>
                </form>
              ) : (
                <button type="button" onClick={() => setComposing(true)} className="border border-[#1f1f1f] px-3 py-2 text-[13px]">Write a template message</button>
              )}
            </footer>
          </>
        ) : (
          <div className="grid flex-1 place-items-center p-8 text-center text-[14px] text-[#6b6355]">Choose a conversation, or press New message.</div>
        )}
      </section>
    </div>
  );
}

function NewMessage({ recipients, templates, busy, onCancel, onDraft }: {
  recipients: Recipient[]; templates: Templates; busy: boolean; onCancel: () => void;
  onDraft: (body: { phone: string; developerId?: number; template: string; params: string[] }) => Promise<void>;
}) {
  const names = Object.keys(templates);
  const [template, setTemplate] = useState(names[0] ?? "developer_lead_intro");
  const [developerId, setDeveloperId] = useState<number | "">("");
  const [phone, setPhone] = useState("");
  const [params, setParams] = useState<string[]>([]);
  const def = templates[template];
  const dev = useMemo(() => recipients.find((r) => r.developerId === developerId), [recipients, developerId]);
  const values = def ? def.params.map((_, i) => params[i] ?? (i === 0 && dev ? dev.name : "")) : [];
  const preview = def ? def.body.replace(/\{\{(\d)\}\}/g, (_, n) => values[Number(n) - 1] || `{{${n}}}`) : "";

  return (
    <form className="space-y-3 p-4" onSubmit={(e) => { e.preventDefault(); void onDraft({ phone: dev?.phone ?? phone, developerId: dev?.developerId, template, params: values }); }}>
      <h2 className="text-[16px] font-medium">New template message</h2>
      <label className="block text-[13px]">Developer
        <select value={developerId} onChange={(e) => { setDeveloperId(e.target.value ? Number(e.target.value) : ""); setParams([]); }} className="mt-1 block w-full border border-[#cfc6b4] px-3 py-2 text-[14px]">
          <option value="">Type a number instead…</option>
          {recipients.map((r) => <option key={r.developerId} value={r.developerId}>{r.name} (+{r.phone})</option>)}
        </select>
      </label>
      {!dev ? <label className="block text-[13px]">Number with country code
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="94771234567" className="mt-1 block w-full border border-[#cfc6b4] px-3 py-2 text-[14px]" />
      </label> : null}
      <label className="block text-[13px]">Template
        <select value={template} onChange={(e) => { setTemplate(e.target.value); setParams([]); }} className="mt-1 block w-full border border-[#cfc6b4] px-3 py-2 text-[14px]">
          {names.map((n) => <option key={n} value={n}>{templates[n].label}</option>)}
        </select>
      </label>
      {def?.params.map((label, i) => (
        <label key={label} className="block text-[13px]">{label}
          <input value={values[i]} onChange={(e) => { const next = [...values]; next[i] = e.target.value; setParams(next); }} className="mt-1 block w-full border border-[#cfc6b4] px-3 py-2 text-[14px]" />
        </label>
      ))}
      <p className="bg-[#f6f1e7] p-3 text-[14px]"><span className="block text-[11px] uppercase tracking-wide text-[#6b6355]">Preview</span>{preview}</p>
      <p className="text-[12px] text-[#6b6355]">This saves a draft. Nothing is sent until you press Approve &amp; send on it.</p>
      <div className="flex gap-2">
        <button type="submit" disabled={busy || !(dev?.phone || phone)} className="bg-[#1f1f1f] px-4 py-2 text-[13px] text-white disabled:opacity-50">Save draft</button>
        <button type="button" onClick={onCancel} className="border border-[#1f1f1f] px-4 py-2 text-[13px]">Cancel</button>
      </div>
    </form>
  );
}
