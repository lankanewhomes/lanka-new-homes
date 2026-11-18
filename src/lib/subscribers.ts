// The one rule for who may get a newsletter or any marketing email (owner, 2026-11-18): only people whose status is "subscribed" in
// Contacts & subscribers (they ticked a box). "contact_only" (just wrote to us) and "unsubscribed" are never emailed. A send can also be
// limited to one choice (newsletter, news, listings, launches). Any future sender must get its recipients from here.
export type SubscriberRow = { email: string; status?: string | null; interests?: string | null }

export function sendableRecipients(rows: SubscriberRow[], interest?: string): string[] {
  const seen = new Set<string>()
  for (const r of rows) {
    if (r.status !== 'subscribed' || !r.email) continue
    if (interest && !(r.interests ?? '').split(',').map((v) => v.trim()).includes(interest)) continue
    seen.add(r.email.trim().toLowerCase())
  }
  return [...seen]
}

/** Loads the list from the database and applies the rule. `payload` is a Payload instance (getPayload). */
export async function loadSendableRecipients(
  payload: { find: (args: Record<string, unknown>) => Promise<{ docs: SubscriberRow[]; hasNextPage: boolean }> },
  interest?: string,
): Promise<string[]> {
  const rows: SubscriberRow[] = []
  for (let page = 1; ; page++) {
    const res = await payload.find({ collection: 'subscribers', where: { status: { equals: 'subscribed' } }, limit: 500, page, depth: 0, overrideAccess: true })
    rows.push(...res.docs)
    if (!res.hasNextPage) break
  }
  return sendableRecipients(rows, interest)
}
