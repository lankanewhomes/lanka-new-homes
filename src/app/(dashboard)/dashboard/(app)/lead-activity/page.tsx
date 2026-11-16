import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LeadActivityPage } from "../../_components/LeadActivityPage";
import { getSession } from "../../_data/session";

export const metadata: Metadata = { title: "Lead activity" };
export const dynamic = "force-dynamic";

// Admin only; /payload-api/lead-activity checks the role again on the server.
export default async function Page() {
  if ((await getSession())?.role !== "admin") notFound();
  return <LeadActivityPage />;
}
