import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WhatsAppApp } from "@/components/whatsapp/WhatsAppApp";
import { getSession } from "../../_data/session";

export const metadata: Metadata = { title: "WhatsApp" };
export const dynamic = "force-dynamic";

// Admin only; /api/whatsapp/inbox checks the role again on the server.
export default async function WhatsAppPage() {
  if ((await getSession())?.role !== "admin") notFound();
  return <WhatsAppApp />;
}
