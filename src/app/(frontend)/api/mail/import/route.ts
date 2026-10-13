import { getMailProvider } from "@/lib/mail";
import { requireMailAdmin } from "@/lib/mail/server";
import { runSync } from "@/lib/mail/sync";

export const dynamic = "force-dynamic";

// POST: start or resume the full import. Each call imports as much as fits in ~20 s and returns { done }; the client (or cron)
// calls again until done. Progress is saved per folder, so it always continues where it stopped.
export async function POST(request: Request) {
  const auth = await requireMailAdmin(request);
  if ("error" in auth) return auth.error;
  const accountEmail = new URL(request.url).searchParams.get("account") ?? undefined;
  try {
    const report = await runSync(auth.payload, await getMailProvider(), { mode: "import", budgetMs: 20_000, accountEmail });
    return Response.json(report);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Import failed." }, { status: 502 });
  }
}
