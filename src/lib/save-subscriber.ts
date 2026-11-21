import type { Payload } from "payload";

export const UPDATE_INTERESTS = ["newsletter", "news", "listings", "launches"];

/** Keeps only the known update choices from untrusted input. */
export function cleanInterests(input: unknown): string[] {
  return Array.isArray(input) ? Array.from(new Set(input.filter((v): v is string => typeof v === "string" && UPDATE_INTERESTS.includes(v)))) : [];
}

/** Adds the buyer to "Contacts & subscribers" with what they ticked (status subscribed). Merges with an existing row for the same email.
 * Only called when at least one box is ticked and an email is given; callers must not let a failure block the enquiry. */
export async function saveSubscriber(payload: Payload, input: { email: string; name?: string; phone?: string; interests: string[]; source: string; note?: string }) {
  const email = input.email.trim().toLowerCase();
  if (!email || !input.interests.length) return;
  const found = await payload.find({ collection: "subscribers", where: { email: { equals: email } }, limit: 1, depth: 0, overrideAccess: true });
  const existing = found.docs[0];
  const merged = Array.from(new Set([...(existing?.interests ? existing.interests.split(", ") : []), ...input.interests])).join(", ");
  const data = { name: input.name || existing?.name || undefined, phone: input.phone || existing?.phone || undefined, interests: merged, status: "subscribed" as const };
  if (existing) await payload.update({ collection: "subscribers", id: existing.id, data, overrideAccess: true });
  else await payload.create({ collection: "subscribers", data: { ...data, email, source: input.source, message: input.note }, overrideAccess: true });
}
