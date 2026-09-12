import type { Payload } from "payload";

// Daily sweep: no payment gateway is wired yet (see docs/todo.md — PayHere
// is the intended one), so a subscription past its current_period_end
// can't auto-renew — it simply expires. Marking it `canceled` fires the
// existing Subscriptions afterChange hook (sync-subscription-package.ts),
// which reverts the project to Free — same as any other cancellation.
// Project content is never touched, only `package`/`featured`.
export async function expirePastDueSubscriptions(payload: Payload): Promise<{ expired: number; failed: number }> {
  const nowIso = new Date().toISOString();
  const { docs } = await payload.find({
    collection: "subscriptions",
    where: { status: { equals: "active" }, current_period_end: { less_than: nowIso } },
    limit: 500,
    depth: 0,
    overrideAccess: true,
  });

  let expired = 0;
  let failed = 0;
  for (const doc of docs) {
    try {
      await payload.update({
        collection: "subscriptions",
        id: doc.id,
        data: { status: "canceled" },
        overrideAccess: true,
      });
      expired += 1;
    } catch (error) {
      console.error(`Failed to expire subscription ${doc.id}`, error);
      failed += 1;
    }
  }
  return { expired, failed };
}
