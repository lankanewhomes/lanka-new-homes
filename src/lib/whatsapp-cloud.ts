// Server-side sender for the WhatsApp Business (Meta Cloud) API.
//
// A business-initiated message (our lead alert) must use a pre-approved
// message template — free-form text is only allowed inside the 24 hours
// after the *recipient* wrote to us. So this sends a template by name with
// its body parameters filled in. Setup and the exact template text live in
// docs/design.md under "Lead alerts".
//
// Env (all optional — when unset, alerts fall back to email only):
//   WHATSAPP_ACCESS_TOKEN      permanent System User token from Meta Business
//   WHATSAPP_PHONE_NUMBER_ID   the sending number's Phone number ID
//   WHATSAPP_LEAD_TEMPLATE     template name (default "lead_alert")
//   WHATSAPP_TEMPLATE_LANG     template language code (default "en")
//   WHATSAPP_API_VERSION       Graph API version (default "v21.0")

export function isWhatsAppCloudConfigured(): boolean {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

// Meta rejects parameters with newlines, tabs, or 4+ consecutive spaces,
// and caps the total body length — collapse whitespace and trim.
function templateParam(value: string, max = 300): string {
  const collapsed = value.replace(/\s+/g, " ").trim();
  return collapsed.length > max ? `${collapsed.slice(0, max - 1)}…` : collapsed || "-";
}

export type WhatsAppTemplateSend = {
  /** Recipient in international digits, e.g. "94771234567". */
  to: string;
  /** Text parameters for the template body, in {{1}}, {{2}}… order. */
  bodyParams: string[];
  /** Dynamic suffix for a URL button on the template (button index 0). */
  buttonUrlSuffix?: string;
  template?: string;
  language?: string;
};

export type WhatsAppSendResult = { ok: true; messageId: string | null } | { ok: false; error: string };

export async function sendWhatsAppTemplate(input: WhatsAppTemplateSend): Promise<WhatsAppSendResult> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) return { ok: false, error: "WhatsApp Cloud API is not configured" };

  const version = process.env.WHATSAPP_API_VERSION || "v21.0";
  const template = input.template || process.env.WHATSAPP_LEAD_TEMPLATE || "lead_alert";
  const language = input.language || process.env.WHATSAPP_TEMPLATE_LANG || "en";

  const components: Record<string, unknown>[] = [
    { type: "body", parameters: input.bodyParams.map((text) => ({ type: "text", text: templateParam(text) })) },
  ];
  if (input.buttonUrlSuffix) {
    components.push({ type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: input.buttonUrlSuffix }] });
  }

  try {
    const response = await fetch(`https://graph.facebook.com/${version}/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: input.to,
        type: "template",
        template: { name: template, language: { code: language }, components },
      }),
      signal: AbortSignal.timeout(10_000),
    });
    const body = (await response.json().catch(() => null)) as { messages?: { id: string }[]; error?: { message?: string } } | null;
    if (!response.ok) return { ok: false, error: body?.error?.message || `WhatsApp API responded ${response.status}` };
    return { ok: true, messageId: body?.messages?.[0]?.id ?? null };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
