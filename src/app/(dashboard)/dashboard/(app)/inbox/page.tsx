import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MailApp } from "@/components/mail/MailApp";
import { getSession } from "../../_data/session";

export const metadata: Metadata = { title: "Inbox" };
export const dynamic = "force-dynamic";

// The real Zoho mail client (same one as /cms/mail): admin only. The /api/mail/* routes check the role again on the server.
export default async function InboxPage() {
  if ((await getSession())?.role !== "admin") notFound();
  return <MailApp />;
}
