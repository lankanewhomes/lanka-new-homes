import type { Metadata } from "next";
import { TrafficPage } from "../../../_components/SiteReports";

export const metadata: Metadata = { title: "Traffic sources" };
export default function Page() { return <TrafficPage />; }
