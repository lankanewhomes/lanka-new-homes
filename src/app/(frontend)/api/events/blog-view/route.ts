import { NextResponse } from "next/server";
import { logBlogViewEvent } from "@/lib/analytics-event";
import { blogPosts } from "@/lib/blog";

// Fire-and-forget from a blog article page (BlogViewTracker): logs an Analytics "blog_view" event for a known post.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const blogSlug = body?.blogSlug;
  if (!blogSlug || typeof blogSlug !== "string" || !blogPosts[blogSlug]) {
    return NextResponse.json({ error: "Unknown blog post" }, { status: 400 });
  }
  try {
    await logBlogViewEvent(req, { blogSlug, sessionId: body.sessionId, trafficSource: body.trafficSource, utm: body.utm });
  } catch (error) {
    console.error("Failed to log blog_view analytics event", error);
  }
  return NextResponse.json({ ok: true });
}
