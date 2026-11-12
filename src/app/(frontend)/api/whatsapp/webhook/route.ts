import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getPayload } from "payload";
import config from "../../../../../../payload.config";

// Meta WhatsApp Cloud API webhook: developer replies and delivery receipts land here.
//   GET  = Meta's one-time verification (hub.verify_token must equal WHATSAPP_VERIFY_TOKEN).
//   POST = messages and status updates, signed with WHATSAPP_APP_SECRET (X-Hub-Signature-256).
// Fails closed: unsigned or mis-signed posts are rejected and nothing is stored. Messages are only stored; nothing is sent from here.
// Env: WHATSAPP_VERIFY_TOKEN (any string you choose, also typed into Meta), WHATSAPP_APP_SECRET (Meta app secret).
export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams;
  const expected = process.env.WHATSAPP_VERIFY_TOKEN;
  if (expected && q.get("hub.mode") === "subscribe" && q.get("hub.verify_token") === expected) {
    return new NextResponse(q.get("hub.challenge") ?? "", { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

function validSignature(raw: string, header: string | null): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret || !header?.startsWith("sha256=")) return false;
  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  const given = header.slice("sha256=".length);
  return given.length === expected.length && crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

type WaMessage = { id?: string; from?: string; timestamp?: string; type?: string; text?: { body?: string } };
type WaStatus = { id?: string; status?: string; errors?: { title?: string }[] };
type WaChange = { value?: { messages?: WaMessage[]; statuses?: WaStatus[] } };

export async function POST(request: NextRequest) {
  const raw = await request.text();
  if (!validSignature(raw, request.headers.get("x-hub-signature-256"))) return new NextResponse("Forbidden", { status: 403 });

  let body: { entry?: { changes?: WaChange[] }[] };
  try {
    body = JSON.parse(raw);
  } catch {
    return new NextResponse("Bad request", { status: 400 });
  }

  const payload = await getPayload({ config });
  // The generated Payload types are refreshed separately; the collection is addressed by slug here.
  const db = payload as unknown as {
    find: (a: Record<string, unknown>) => Promise<{ docs: { id: number | string }[] }>;
    create: (a: Record<string, unknown>) => Promise<unknown>;
    update: (a: Record<string, unknown>) => Promise<unknown>;
  };

  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const message of change.value?.messages ?? []) {
        if (!message.id || !message.from) continue;
        const seen = await db.find({ collection: "whatsapp-messages", where: { waMessageId: { equals: message.id } }, limit: 1, depth: 0, overrideAccess: true });
        if (seen.docs.length) continue;
        await db.create({
          collection: "whatsapp-messages",
          overrideAccess: true,
          data: {
            direction: "inbound",
            phone: message.from.replace(/\D/g, ""),
            text: message.text?.body ?? null,
            messageType: message.type ?? "text",
            status: "received",
            waMessageId: message.id,
            sentAt: new Date(Number(message.timestamp ?? 0) * 1000 || Date.now()).toISOString(),
          },
        });
      }
      for (const status of change.value?.statuses ?? []) {
        if (!status.id || !status.status || !["sent", "delivered", "read", "failed"].includes(status.status)) continue;
        const row = await db.find({ collection: "whatsapp-messages", where: { waMessageId: { equals: status.id } }, limit: 1, depth: 0, overrideAccess: true });
        if (!row.docs[0]) continue;
        await db.update({ collection: "whatsapp-messages", id: row.docs[0].id, overrideAccess: true, data: { status: status.status, error: status.errors?.[0]?.title ?? null } });
      }
    }
  }
  return NextResponse.json({ ok: true });
}
