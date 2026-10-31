import type { Metadata } from "next";
import { PagesPage } from "../../../_components/SiteReports";

export const metadata: Metadata = { title: "Pages and countries" };
export default function Page() { return <PagesPage />; }
