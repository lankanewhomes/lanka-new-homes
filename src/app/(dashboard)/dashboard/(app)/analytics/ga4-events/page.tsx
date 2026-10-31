import type { Metadata } from "next";
import { Ga4EventsPage } from "../../../_components/SiteReports";

export const metadata: Metadata = { title: "Events (GA4)" };
export default function Page() { return <Ga4EventsPage />; }
