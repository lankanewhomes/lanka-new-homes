// WhatsApp helpers shared by the public site (click-to-chat button) and the
// server (lead alerts). No Payload imports — safe in client components.

const SRI_LANKA_COUNTRY_CODE = "94";

/**
 * International number as digits only, the form wa.me and the WhatsApp
 * Cloud API want: "077 123 4567" → "94771234567", "+94 77 123 4567" →
 * "94771234567", "https://wa.me/94771234567" → "94771234567". Local
 * numbers (leading 0, ten digits) are assumed Sri Lankan. Returns null when
 * there is no usable number.
 */
export function toWhatsAppNumber(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  const fromLink = trimmed.match(/(?:wa\.me\/|whatsapp\.com\/send\/?\?phone=|phone=)(\+?[\d\s().-]+)/i);
  const raw = fromLink ? fromLink[1] : trimmed;
  let digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 10) digits = `${SRI_LANKA_COUNTRY_CODE}${digits.slice(1)}`;
  if (digits.length < 8 || digits.length > 15) return null;
  return digits;
}

/** "+94 77 123 4567" style for display, from whatever the developer typed. */
export function formatWhatsAppNumber(value: string | null | undefined): string | null {
  const digits = toWhatsAppNumber(value);
  if (!digits) return null;
  if (digits.startsWith(SRI_LANKA_COUNTRY_CODE) && digits.length === 11) {
    return `+94 ${digits.slice(2, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return `+${digits}`;
}

/** wa.me link with an optional pre-filled message; null when no number. */
export function whatsappChatHref(value: string | null | undefined, text?: string): string | null {
  const digits = toWhatsAppNumber(value);
  if (!digits) return null;
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/** What a buyer's chat opens with when they tap the button on a listing. */
export function buyerWhatsAppMessage(projectName: string, planName?: string | null): string {
  const what = planName ? `${planName} at ${projectName}` : projectName;
  return `Hi, I'm interested in ${what} that I saw on LankaNewHomes. Could you send me more details?`;
}

/** The listing page's click-to-chat link: developer's WhatsApp + opener naming the project (and plan). */
export function listingWhatsAppHref(developerWhatsApp: string | null | undefined, projectName: string, planName?: string | null): string | null {
  return whatsappChatHref(developerWhatsApp, buyerWhatsAppMessage(projectName, planName));
}
