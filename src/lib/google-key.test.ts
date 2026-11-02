import { describe, expect, it } from "vitest";
import { privateKeyBase64 } from "./google-key";

const BODY = "MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7";
const PEM = `-----BEGIN PRIVATE KEY-----\n${BODY}\n-----END PRIVATE KEY-----\n`;

describe("privateKeyBase64", () => {
  it("reads a normal PEM", () => expect(privateKeyBase64(PEM)).toBe(BODY));
  it("reads a PEM with written-out \\n", () => expect(privateKeyBase64(PEM.replace(/\n/g, "\\n"))).toBe(BODY));
  it("reads a PEM with doubled backslashes", () => expect(privateKeyBase64(PEM.replace(/\n/g, "\\\\n"))).toBe(BODY));
  it("reads a quoted PEM", () => expect(privateKeyBase64(`"${PEM.replace(/\n/g, "\\n")}"`)).toBe(BODY));
  it("reads the whole service-account JSON", () => expect(privateKeyBase64(JSON.stringify({ type: "service_account", private_key: PEM }))).toBe(BODY));
  it("reads the base64 of a PEM", () => expect(privateKeyBase64(Buffer.from(PEM).toString("base64"))).toBe(BODY));
});
