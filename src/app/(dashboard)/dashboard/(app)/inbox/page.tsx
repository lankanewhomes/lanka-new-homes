import type { Metadata } from "next";
import { InboxApp } from "../../_components/InboxApp";

export const metadata: Metadata = { title: "Inbox" };
export default function InboxPage() { return <InboxApp />; }
