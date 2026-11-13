import { toWhatsAppNumber } from "@/lib/whatsapp";

// Helpers for the admin WhatsApp inbox (/dashboard/whatsapp, /api/whatsapp/inbox): who a number belongs to, the approved templates we
// may start a conversation with, and the free-text sender. Nothing here sends on its own: the API only sends a message the admin approved.

/** Templates approved (or submitted) in Meta for starting a conversation with a developer. Texts mirror Meta exactly. */
export const WHATSAPP_TEMPLATES = {
  developer_lead_intro: {
    label: "Lead intro",
    params: ["Developer contact name", "Number of buyer enquiries", "Project"],
    body: "Hi {{1}}, LankaNewHomes has {{2}} buyer enquiries for {{3}}. Are units still available? Reply YES or NO.",
  },
  developer_followup: {
    label: "Follow-up",
    params: ["Developer contact name", "Project"],
    body: "Hi {{1}}, following up on our earlier message about {{2}}. Can your sales team contact the buyers today?",
  },
} as const;
export type TemplateName = keyof typeof WHATSAPP_TEMPLATES;

export function renderTemplate(name: TemplateName, params: string[]): string {
  return WHATSAPP_TEMPLATES[name].body.replace(/\{\{(\d)\}\}/g, (_, n) => params[Number(n) - 1] ?? "");
}

export const digitsOnly = (v: string) => v.replace(/\D/g, "");
/** Two numbers are the same person when their last nine digits match (ignores +94 / 0 / spaces). */
export const sameNumber = (a: string, b: string) => digitsOnly(a).slice(-9) === digitsOnly(b).slice(-9) && digitsOnly(a).length >= 9;

type Developer = { id: number; name?: string | null; lead_alerts?: { whatsapp?: string | null } | null; socialLinks?: { whatsapp?: string | null } | null };
export type Recipient = { developerId: number; name: string; phone: string };

type Finder = { find: (a: Record<string, unknown>) => Promise<{ docs: unknown[] }> };

/** Every developer that has a usable WhatsApp number (Lead alerts number first, else Social Links). */
export async function loadRecipients(payload: Finder): Promise<Recipient[]> {
  const { docs } = await payload.find({ collection: "developers", limit: 1000, depth: 0, pagination: false, overrideAccess: true });
  const out: Recipient[] = [];
  for (const d of docs as Developer[]) {
    const phone = toWhatsAppNumber(d.lead_alerts?.whatsapp) || toWhatsAppNumber(d.socialLinks?.whatsapp);
    if (phone && d.name) out.push({ developerId: d.id, name: d.name, phone });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

/** Free-form text is only allowed within 24 hours of the other person's last message. */
export const WINDOW_MS = 24 * 60 * 60 * 1000;

export async function sendWhatsAppText(to: string, body: string): Promise<{ ok: true; messageId: string | null } | { ok: false; error: string }> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) return { ok: false, error: "WhatsApp Cloud API is not configured" };
  try {
    const response = await fetch(`https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION || "v21.0"}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body, preview_url: false } }),
      signal: AbortSignal.timeout(10_000),
    });
    const json = (await response.json().catch(() => null)) as { messages?: { id: string }[]; error?: { message?: string } } | null;
    if (!response.ok) return { ok: false, error: json?.error?.message || `WhatsApp API responded ${response.status}` };
    return { ok: true, messageId: json?.messages?.[0]?.id ?? null };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
