// Turns the GA4_SERVICE_ACCOUNT_PRIVATE_KEY setting into the raw key bytes. The same key is pasted in different shapes depending on where it
// is stored (a .env file, the Cloudflare dashboard, a copy of the whole service-account JSON file), and the live Keywords page failed with
// "atob() called with invalid base64" because the stored text was not in the one shape the old code expected. This accepts:
//   - a normal PEM with real line breaks,
//   - a PEM whose line breaks are written as \n (one or more backslashes),
//   - any of those wrapped in quotes,
//   - the whole service-account JSON file (its "private_key" is used),
//   - the base64 of a PEM.
export function privateKeyBase64(raw: string): string {
  let text = raw.trim();
  if (text.startsWith("{")) {
    try {
      const parsed = JSON.parse(text) as { private_key?: string };
      if (parsed.private_key) text = parsed.private_key;
    } catch {
      /* not JSON after all: keep going with the text as it is */
    }
  }
  text = text.replace(/^["']+|["']+$/g, "").replace(/\\+[nr]/g, " ");
  const body = text.replace(/-----[A-Z ]+-----/g, "").replace(/[^A-Za-z0-9+/=]/g, "");
  // The base64 of a whole PEM decodes to text that starts with the PEM header; unwrap it once.
  if (!/-----BEGIN/.test(text) && body.startsWith("LS0tLS1CRUdJTi")) {
    try {
      return privateKeyBase64(atob(body));
    } catch {
      /* fall through */
    }
  }
  return body;
}

export function privateKeyDer(raw: string): Uint8Array<ArrayBuffer> {
  const body = privateKeyBase64(raw);
  try {
    const binary = atob(body);
    const der = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) der[i] = binary.charCodeAt(i);
    return der;
  } catch {
    throw new Error("GA4_SERVICE_ACCOUNT_PRIVATE_KEY is not a valid Google private key. Paste the private_key from the service-account JSON file (it starts with -----BEGIN PRIVATE KEY-----).");
  }
}
