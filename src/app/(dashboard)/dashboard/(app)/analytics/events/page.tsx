import type { Metadata } from "next";
import { CollectionList } from "../../../_components/CollectionList";

export const metadata: Metadata = { title: "Analytics events" };

// The raw event log behind the Analytics page (one row per view, save, click or enquiry).
export default function Page() { return <CollectionList slug="analytics" />; }
