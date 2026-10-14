import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MailSettings } from "@/components/mail/MailSettings";
import { getSession } from "../../../_data/session";

export const metadata: Metadata = { title: "Mail connection" };
export const dynamic = "force-dynamic";

// Real connection status, keys, import and sync progress (same screen as /cms/mail/settings). Admin only.
export default async function Page() {
  if ((await getSession())?.role !== "admin") notFound();
  return <MailSettings />;
}
