import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  describeMessage,
  inboundNoticeSubject,
  parseWhatsAppWebhook,
  renderInboundNoticeHTML,
  renderInboundNoticeText,
  verifyWebhookChallenge,
  verifyWhatsAppSignature,
} from "./whatsapp-webhook";

const SECRET = "test-app-secret";
const bytes = (text: string) => new TextEncoder().encode(text).buffer as ArrayBuffer;
const sign = (text: string, secret = SECRET) => `sha256=${createHmac("sha256", secret).update(text, "utf8").digest("hex")}`;

// Shape of a real Cloud API "messages" webhook (one text message from a buyer).
const textWebhook = (message: Record<string, unknown> = { type: "text", text: { body: "Hi, is Bay One still available?" } }) => ({
  object: "whatsapp_business_account",
  entry: [
    {
      id: "1432531762069175",
      changes: [
        {
          field: "messages",
          value: {
            messaging_product: "whatsapp",
            metadata: { display_phone_number: "16477795729", phone_number_id: "1502698179583100" },
            contacts: [{ profile: { name: "Nimal Perera" }, wa_id: "94771234567" }],
            messages: [{ from: "94771234567", id: "wamid.TEST1", timestamp: "1763301600", ...message }],
          },
        },
      ],
    },
  ],
});

describe("verifyWebhookChallenge", () => {
  const params = (token: string, mode = "subscribe") => new URLSearchParams({ "hub.mode": mode, "hub.verify_token": token, "hub.challenge": "1158201444" });

  it("echoes the challenge when the token matches", () => {
    expect(verifyWebhookChallenge(params("my-token"), "my-token")).toBe("1158201444");
  });
  it("refuses a wrong token", () => {
    expect(verifyWebhookChallenge(params("guess"), "my-token")).toBeNull();
  });
  it("refuses when no token is configured", () => {
    expect(verifyWebhookChallenge(params(""), undefined)).toBeNull();
  });
  it("refuses a mode other than subscribe", () => {
    expect(verifyWebhookChallenge(params("my-token", "unsubscribe"), "my-token")).toBeNull();
  });
});

describe("verifyWhatsAppSignature", () => {
  const body = JSON.stringify(textWebhook());

  it("accepts the HMAC-SHA256 of the raw body", async () => {
    expect(await verifyWhatsAppSignature(bytes(body), sign(body), SECRET)).toBe(true);
  });
  it("accepts upper-case hex", async () => {
    expect(await verifyWhatsAppSignature(bytes(body), sign(body).toUpperCase().replace("SHA256=", "sha256="), SECRET)).toBe(true);
  });
  it("checks the exact bytes, including non-ASCII text", async () => {
    const sinhala = JSON.stringify(textWebhook({ type: "text", text: { body: "ආයුබෝවන් 🏠" } }));
    expect(await verifyWhatsAppSignature(bytes(sinhala), sign(sinhala), SECRET)).toBe(true);
  });
  it("rejects a changed body", async () => {
    expect(await verifyWhatsAppSignature(bytes(body.replace("Bay One", "Bay Two")), sign(body), SECRET)).toBe(false);
  });
  it("rejects a signature made with another secret", async () => {
    expect(await verifyWhatsAppSignature(bytes(body), sign(body, "someone-else"), SECRET)).toBe(false);
  });
  it("rejects a missing or malformed header", async () => {
    expect(await verifyWhatsAppSignature(bytes(body), null, SECRET)).toBe(false);
    expect(await verifyWhatsAppSignature(bytes(body), "sha1=abc", SECRET)).toBe(false);
    expect(await verifyWhatsAppSignature(bytes(body), "sha256=nothex", SECRET)).toBe(false);
  });
  it("rejects everything when no secret is set", async () => {
    expect(await verifyWhatsAppSignature(bytes(body), sign(body, ""), "")).toBe(false);
  });
});

describe("parseWhatsAppWebhook", () => {
  it("flattens a text message", () => {
    const { messages, statuses } = parseWhatsAppWebhook(textWebhook());
    expect(statuses).toEqual([]);
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({
      id: "wamid.TEST1",
      from: "94771234567",
      phone: "94771234567",
      name: "Nimal Perera",
      type: "text",
      text: "Hi, is Bay One still available?",
      toNumber: "16477795729",
      phoneNumberId: "1502698179583100",
    });
    expect(messages[0].receivedAt.toISOString()).toBe("2025-11-16T14:00:00.000Z");
  });

  it("reads delivery updates, including why one failed", () => {
    const body = {
      object: "whatsapp_business_account",
      entry: [{ changes: [{ field: "messages", value: { statuses: [{ id: "wamid.OUT1", status: "failed", timestamp: "1763301600", recipient_id: "94770000000", errors: [{ code: 131047, title: "Re-engagement message", error_data: { details: "More than 24 hours have passed" } }] }] } }] }],
    };
    const { messages, statuses } = parseWhatsAppWebhook(body);
    expect(messages).toEqual([]);
    expect(statuses).toEqual([{ id: "wamid.OUT1", status: "failed", recipient: "94770000000", at: new Date(1763301600 * 1000), errors: [{ code: 131047, title: "Re-engagement message", message: undefined, details: "More than 24 hours have passed" }] }]);
  });

  it("ignores other webhooks and malformed bodies without throwing", () => {
    expect(parseWhatsAppWebhook({ object: "page", entry: [] })).toEqual({ messages: [], statuses: [] });
    expect(parseWhatsAppWebhook(null)).toEqual({ messages: [], statuses: [] });
    expect(parseWhatsAppWebhook({ object: "whatsapp_business_account", entry: "nope" })).toEqual({ messages: [], statuses: [] });
    expect(parseWhatsAppWebhook({ object: "whatsapp_business_account", entry: [{ changes: [{ field: "messages", value: { messages: [{ type: "text" }] } }] }] })).toEqual({ messages: [], statuses: [] });
  });

  it("has no phone links for a username sender without a number", () => {
    const body = textWebhook();
    const value = body.entry[0].changes[0].value as Record<string, unknown>;
    value.contacts = [{ profile: { name: "Kasun" }, user_id: "LK.12345abc" }];
    value.messages = [{ from: "LK.12345abc", id: "wamid.TEST2", timestamp: "1763301600", type: "text", text: { body: "hello" } }];
    const [message] = parseWhatsAppWebhook(body).messages;
    expect(message).toMatchObject({ from: "LK.12345abc", phone: null, name: "Kasun" });
  });
});

describe("describeMessage", () => {
  const cases: [string, Record<string, unknown>, string][] = [
    ["template quick reply", { type: "button", button: { text: "Call me", payload: "CALL" } }, 'Tapped "Call me"'],
    ["interactive button", { type: "interactive", interactive: { type: "button_reply", button_reply: { id: "yes", title: "Yes" } } }, 'Chose "Yes"'],
    ["list choice", { type: "interactive", interactive: { type: "list_reply", list_reply: { id: "2br", title: "2 bedrooms", description: "From LKR 45M" } } }, 'Chose "2 bedrooms" (From LKR 45M)'],
    ["photo with caption", { type: "image", image: { id: "1", caption: "This one?" } }, "[Photo] This one?"],
    ["voice note", { type: "audio", audio: { id: "1", voice: true } }, "[Voice note]"],
    ["document", { type: "document", document: { id: "1", filename: "payslip.pdf" } }, "[Document: payslip.pdf]"],
    ["location", { type: "location", location: { latitude: 6.9271, longitude: 79.8612, name: "Colombo" } }, "[Location] Colombo https://maps.google.com/?q=6.9271,79.8612"],
    ["reaction", { type: "reaction", reaction: { message_id: "x", emoji: "👍" } }, "[Reacted 👍]"],
    ["contact card", { type: "contacts", contacts: [{ name: { formatted_name: "Saman" }, phones: [{ phone: "+94 77 000 0000" }] }] }, "[Contact card] Saman +94 77 000 0000"],
    ["unknown type", { type: "unsupported" }, "[Message type WhatsApp does not support yet]"],
    ["ad referral", { type: "text", text: { body: "Price?" }, referral: { headline: "Bay One, Colombo 3" } }, "Price? (came from: Bay One, Colombo 3)"],
  ];
  for (const [name, message, expected] of cases) {
    it(name, () => expect(describeMessage(message)).toBe(expected));
  }
});

describe("owner notice", () => {
  const [message] = parseWhatsAppWebhook(textWebhook({ type: "text", text: { body: 'Is <b>Bay One</b> "ready"?' } })).messages;

  it("subject names the sender and the start of the message", () => {
    expect(inboundNoticeSubject(message)).toBe('WhatsApp from Nimal Perera (+94771234567): Is <b>Bay One</b> "ready"?');
  });
  it("HTML escapes what the sender typed and links a reply", () => {
    const html = renderInboundNoticeHTML(message);
    expect(html).toContain("Is &lt;b&gt;Bay One&lt;/b&gt; &quot;ready&quot;?");
    expect(html).not.toContain("<b>Bay One</b>");
    expect(html).toContain("https://wa.me/94771234567");
  });
  it("plain-text version carries the same facts", () => {
    const text = renderInboundNoticeText(message);
    expect(text).toContain("From: Nimal Perera");
    expect(text).toContain("Number: +94771234567");
    expect(text).toContain("Sent to: +16477795729");
  });
});
