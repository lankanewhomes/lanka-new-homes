import { NextResponse, type NextRequest } from "next/server";
import { getPayload } from "payload";
import config from "../../../../../../payload.config";

// Short tracked link for Instagram and TikTok captions, where a long ?utm_ URL can't be clicked or typed:
//   /go/ig/<slug>   /go/tt/<slug>   (also /go/fb/<slug>, but Facebook link previews should use the plain URL)
// Works for projects and land plots: redirects to /projects/<slug> or /land/<slug> with the matching UTM tags,
// so GA shows the visit as its own source instead of "Direct". Unknown slugs go to the home page.
export const dynamic = "force-dynamic";

const SOURCES: Record<string, string> = { ig: "instagram", tt: "tiktok", fb: "facebook" };

export async function GET(request: NextRequest, { params }: { params: Promise<{ source: string; slug: string }> }) {
  const { source, slug } = await params;
  const utmSource = SOURCES[source];
  const origin = request.nextUrl.origin;
  if (!utmSource || !/^[a-z0-9-]{1,120}$/.test(slug)) return NextResponse.redirect(new URL("/", origin), 302);

  const payload = await getPayload({ config });
  let kind: "projects" | "land" | null = null;
  const project = await payload.find({ collection: "projects", where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true });
  if (project.docs.length) kind = "projects";
  else {
    const land = await payload.find({ collection: "lands", where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true });
    if (land.docs.length) kind = "land";
  }
  if (!kind) return NextResponse.redirect(new URL("/", origin), 302);

  const target = new URL(`/${kind}/${slug}`, origin);
  target.searchParams.set("utm_source", utmSource);
  target.searchParams.set("utm_medium", "social");
  target.searchParams.set("utm_campaign", `${slug}-social-${new Date().toISOString().slice(0, 7)}`);
  return NextResponse.redirect(target, 302);
}
