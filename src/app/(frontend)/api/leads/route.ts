import { after, NextResponse } from "next/server";
import { insertLead } from "@/lib/tracking-db";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { buildEventEnrichment } from "@/lib/analytics-event";
import { renderBrochureEmailHTML } from "@/lib/brochure-email";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const required = [
      "name",
      "phone",
      "preferredContactMethod",
      "message",
      "projectSlug",
      "developerSlug",
    ] as const;

    for (const field of required) {
      if (!body?.[field] || typeof body[field] !== "string") {
        return NextResponse.json({ error: `Missing ${field}` }, { status: 400 });
      }
    }

    if (body.email !== undefined && typeof body.email !== "string") {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const saved = await insertLead({
      name: body.name,
      email: typeof body.email === "string" ? body.email : "",
      phone: body.phone,
      preferredContactMethod: body.preferredContactMethod,
      message: body.message,
      projectSlug: body.projectSlug,
      developerSlug: body.developerSlug,
      marketingOptIn: typeof body.marketingOptIn === "boolean" ? body.marketingOptIn : undefined,
      userId: user?.id,
    });

    // Best-effort mirror into Payload's Leads collection so builders can see
    // and manage this inquiry (status, analytics) in /cms.
    // Deferred with after() so the visitor isn't stuck waiting several
    // seconds on Payload's local API (project lookup + create + its
    // cascading count-increment hooks) before seeing "request sent" — the
    // user-facing submission above already succeeded on its own.
    // skipSupabaseSync stops the collection's own afterChange hook from
    // inserting a second, duplicate Supabase row for this lead.
    after(async () => {
      try {
        const { getPayload } = await import("payload");
        const payloadConfig = (await import("../../../../../payload.config")).default;
        const payload = await getPayload({ config: payloadConfig });
        const projectRes = await payload.find({
          collection: "projects",
          where: { slug: { equals: body.projectSlug } },
          limit: 1,
          depth: 0,
          overrideAccess: true,
        });
        const projectDoc = projectRes.docs[0];
        if (projectDoc) {
          // Also enriches the Analytics "lead_submitted" event that Leads'
          // own afterChange hook (logLeadSubmitted) auto-creates — see
          // hooks/increment-counts.ts's analyticsEnrichment context read.
          const analyticsEnrichment = buildEventEnrichment(req, { sessionId: body.sessionId, trafficSource: body.trafficSource });
          await payload.create({
            collection: "leads",
            data: {
              project: projectDoc.id,
              name: body.name,
              email: typeof body.email === "string" ? body.email : "",
              phone: body.phone,
              message: body.message,
            } as never,
            context: { skipSupabaseSync: true, analyticsEnrichment },
            overrideAccess: true,
          });

          // Brochure requests also get emailed a copy — the dialog's
          // "Download Brochure" button still works as a fallback (the
          // auto-download this triggers client-side on submit can get
          // blocked by the browser's popup blocker), and the project's
          // own brochureUrl is looked up server-side here rather than
          // trusted from the request body, so this can't be used to email
          // an arbitrary link through this form.
          const brochureUrl = typeof projectDoc.brochureUrl === "string" ? projectDoc.brochureUrl : null;
          if (body.isBrochureRequest && brochureUrl && typeof body.email === "string" && body.email) {
            const serverURL = payload.config.serverURL || new URL(req.url).origin
            const absoluteBrochureUrl = brochureUrl.startsWith("http") ? brochureUrl : `${serverURL}${brochureUrl}`
            await payload.sendEmail({
              to: body.email,
              from: process.env.EMAIL_FROM,
              subject: `Your ${projectDoc.name} brochure`,
              html: renderBrochureEmailHTML({ projectName: String(projectDoc.name), brochureUrl: absoluteBrochureUrl }),
            })
          }
        }
      } catch (mirrorError) {
        console.error("Failed to mirror lead into Payload", mirrorError);
      }
    });

    return NextResponse.json({ ok: true, id: saved.id, createdAt: saved.createdAt });
  } catch {
    return NextResponse.json({ error: "Failed to save lead" }, { status: 500 });
  }
}
