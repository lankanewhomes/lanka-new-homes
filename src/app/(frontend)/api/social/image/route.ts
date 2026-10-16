import { NextResponse } from "next/server";

// Same-origin copy of one of our own listing photos, so the dashboard's post builder can crop it on a canvas and download the result
// (our media host sends no CORS headers, which would otherwise block exporting the canvas). Only the media host is allowed.
const ALLOWED_HOST = "media.lankanewhomes.com";
const MAX_BYTES = 12 * 1024 * 1024;

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("u") ?? "";
  let target: URL;
  try { target = new URL(raw); } catch { return NextResponse.json({ error: "Bad url" }, { status: 400 }); }
  if (target.protocol !== "https:" || target.hostname !== ALLOWED_HOST) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const upstream = await fetch(target.toString(), { cf: { cacheTtl: 86400 } } as RequestInit);
  if (!upstream.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const type = upstream.headers.get("content-type") ?? "";
  if (!/^image\//.test(type)) return NextResponse.json({ error: "Not an image" }, { status: 415 });
  const buf = await upstream.arrayBuffer();
  if (buf.byteLength > MAX_BYTES) return NextResponse.json({ error: "Too large" }, { status: 413 });
  return new NextResponse(buf, { headers: { "content-type": type, "cache-control": "public, max-age=86400" } });
}
