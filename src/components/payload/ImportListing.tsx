"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";

// /cms/import — "Import from your website". Paste the project's web page
// URL and/or upload its brochure PDF; the server (payload-api/import-listing)
// reads what's on it, copies the photos into our media bucket and creates an
// UNPUBLISHED draft for review. Registered in payload.config.ts admin views
// alongside PlacementPicker.

type DeveloperOption = { id: string | number; name: string };

type ImportResult = {
  ok: true;
  project: { id: string | number; slug: string; name: string; editUrl: string; previewUrl: string };
  found: {
    photos: number; floorPlanImages: number; brochure: boolean; description: boolean; highlights: number; amenities: string[]; nearby: number;
    address: string | null; city: string | null; type: string | null; phones: string[]; emails: string[]; units: number | null; floors: number | null; completionYear: number | null; startingPriceLkr: number | null;
  };
  signals: { sizesSqFt: number[]; pricesLkr: number[]; bedrooms: number[]; floorPlanHints: string[]; paymentPlanLines: string[] };
  warnings: string[];
};

const MAX_PDF_MB = 4; // request body limit on Vercel functions is ~4.5 MB

const card: React.CSSProperties = { border: "1px solid var(--theme-elevation-150, #e5e5e4)", borderRadius: 8, padding: 20, background: "var(--theme-elevation-0, #fff)", maxWidth: 760 };
const label: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 };
const input: React.CSSProperties = { width: "100%", padding: "10px 12px", fontSize: 14, border: "1px solid var(--theme-elevation-250, #ccc)", borderRadius: 6, background: "transparent", color: "inherit" };
const button: React.CSSProperties = { padding: "10px 18px", fontSize: 14, fontWeight: 600, borderRadius: 6, border: "1px solid #f47b36", background: "#f47b36", color: "#fff", cursor: "pointer" };

export function ImportListing() {
  const [role, setRole] = useState<string | null>(null);
  const [developers, setDevelopers] = useState<DeveloperOption[]>([]);
  const [developerId, setDeveloperId] = useState<string>("");
  const [url, setUrl] = useState("");
  const [pdf, setPdf] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);

  useEffect(() => {
    (async () => {
      const me = await fetch("/payload-api/users/me", { credentials: "include" }).then((r) => r.json()).catch(() => null);
      const userRole = me?.user?.role ?? null;
      setRole(userRole);
      if (userRole === "admin") {
        const res = await fetch("/payload-api/developers?limit=200&depth=0&sort=name", { credentials: "include" }).then((r) => r.json()).catch(() => null);
        setDevelopers((res?.docs ?? []).map((d: DeveloperOption) => ({ id: d.id, name: d.name })));
      }
    })();
  }, []);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setResult(null);
    if (!url.trim() && !pdf) { setError("Paste the project's web page URL, upload its brochure PDF, or both."); return; }
    if (pdf && pdf.size > MAX_PDF_MB * 1024 * 1024) { setError(`The PDF is ${(pdf.size / 1048576).toFixed(1)} MB — uploads are limited to ${MAX_PDF_MB} MB. Put it on your website and paste the page URL instead; linked brochures up to 15 MB are read automatically.`); return; }
    if (role === "admin" && !developerId) { setError("Pick the developer this project belongs to."); return; }
    setBusy(true);
    try {
      let pdfBase64: string | undefined;
      if (pdf) {
        pdfBase64 = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsDataURL(pdf); });
      }
      const res = await fetch("/payload-api/import-listing", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() || undefined, pdfBase64, pdfName: pdf?.name, developerId: developerId || undefined }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) { setError(data?.error ?? `Import failed (${res.status}).`); return; }
      setResult(data as ImportResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: "24px 32px", maxWidth: 960 }}>
      <h1 style={{ fontSize: 26, margin: "0 0 6px" }}>Import a project</h1>
      <p style={{ margin: "0 0 20px", color: "var(--theme-elevation-600, #555)", maxWidth: 720 }}>
        Paste the project page from your website and/or upload the brochure. We read what&apos;s on it — photos, description, amenities, contact details,
        distances — copy the photos into LankaNewHomes and create a <strong>draft</strong> for you to check. Nothing is published until you do it.
      </p>

      <form onSubmit={onSubmit} style={card}>
        {role === "admin" ? (
          <div style={{ marginBottom: 16 }}>
            <label style={label} htmlFor="import-developer">Developer</label>
            <select id="import-developer" value={developerId} onChange={(e) => setDeveloperId(e.target.value)} style={input}>
              <option value="">Choose the developer…</option>
              {developers.map((d) => <option key={String(d.id)} value={String(d.id)}>{d.name}</option>)}
            </select>
          </div>
        ) : null}

        <div style={{ marginBottom: 16 }}>
          <label style={label} htmlFor="import-url">Project page URL</label>
          <input id="import-url" type="url" placeholder="https://www.yourcompany.lk/projects/your-project" value={url} onChange={(e) => setUrl(e.target.value)} style={input} />
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--theme-elevation-500, #777)" }}>The page that describes one project — not your homepage. A brochure PDF linked from that page is read automatically.</p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={label} htmlFor="import-pdf">Brochure PDF (optional, up to {MAX_PDF_MB} MB)</label>
          <input id="import-pdf" type="file" accept="application/pdf" onChange={(e) => setPdf(e.target.files?.[0] ?? null)} />
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--theme-elevation-500, #777)" }}>Only brochures with real text can be read; a brochure made of images will be stored for download but nothing can be extracted from it.</p>
        </div>

        {error ? <p style={{ color: "#b42318", margin: "0 0 12px", fontSize: 14 }}>{error}</p> : null}

        <button type="submit" style={{ ...button, opacity: busy ? 0.7 : 1 }} disabled={busy}>
          {busy ? "Reading the page and copying photos… this can take up to a minute" : "Create draft listing"}
        </button>
      </form>

      {result ? (
        <div style={{ ...card, marginTop: 20 }}>
          <h2 style={{ fontSize: 18, margin: "0 0 4px" }}>Draft created: {result.project.name}</h2>
          <p style={{ margin: "0 0 14px", fontSize: 14 }}>
            It&apos;s unpublished. <Link href={result.project.editUrl} style={{ fontWeight: 600 }}>Open it in the editor →</Link> to check every field, add floor plans and prices, then tick <em>Published</em>.
          </p>

          <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 600 }}>What was found</p>
          <ul style={{ margin: "0 0 14px", paddingLeft: 18, fontSize: 14, lineHeight: 1.6 }}>
            <li>{result.found.photos} photo{result.found.photos === 1 ? "" : "s"} copied{result.found.floorPlanImages ? `, ${result.found.floorPlanImages} floor-plan image${result.found.floorPlanImages === 1 ? "" : "s"}` : ""}{result.found.brochure ? ", brochure attached" : ""}</li>
            <li>{result.found.description ? "Description" : "No description"}{result.found.highlights ? ` · ${result.found.highlights} highlight${result.found.highlights === 1 ? "" : "s"}` : ""}</li>
            <li>Amenities: {result.found.amenities.length ? result.found.amenities.join(", ") : "none recognised"}</li>
            <li>Location: {[result.found.address, result.found.city].filter(Boolean).join(" · ") || "not found"}{result.found.type ? ` · ${result.found.type}` : ""}</li>
            <li>Contact: {[...result.found.phones, ...result.found.emails].join(", ") || "none found"}</li>
            <li>{result.found.units ? `${result.found.units} units` : "Units: not found"}{result.found.floors ? ` · ${result.found.floors} floors` : ""}{result.found.completionYear ? ` · move-in ${result.found.completionYear}` : ""}{result.found.startingPriceLkr ? ` · from Rs. ${result.found.startingPriceLkr.toLocaleString("en-US")}` : ""}</li>
            <li>{result.found.nearby} nearby place{result.found.nearby === 1 ? "" : "s"} with distances</li>
          </ul>

          {(result.signals.floorPlanHints.length || result.signals.sizesSqFt.length || result.signals.pricesLkr.length || result.signals.paymentPlanLines.length) ? (
            <>
              <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 600 }}>Numbers seen in the text — confirm them in the editor (not added automatically)</p>
              <ul style={{ margin: "0 0 14px", paddingLeft: 18, fontSize: 14, lineHeight: 1.6 }}>
                {result.signals.floorPlanHints.map((h) => <li key={h}>{h}</li>)}
                {result.signals.sizesSqFt.length ? <li>Sizes: {result.signals.sizesSqFt.map((n) => `${n.toLocaleString("en-US")} sq ft`).join(", ")}</li> : null}
                {result.signals.bedrooms.length ? <li>Bedrooms mentioned: {result.signals.bedrooms.join(", ")}</li> : null}
                {result.signals.pricesLkr.length ? <li>Prices: {result.signals.pricesLkr.map((n) => `Rs. ${n.toLocaleString("en-US")}`).join(", ")}</li> : null}
                {result.signals.paymentPlanLines.map((l) => <li key={l}>Payment plan: {l}</li>)}
              </ul>
            </>
          ) : null}

          {result.warnings.length ? (
            <>
              <p style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 600 }}>Check these</p>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.6, color: "#8a4b00" }}>
                {result.warnings.map((w) => <li key={w}>{w}</li>)}
              </ul>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
