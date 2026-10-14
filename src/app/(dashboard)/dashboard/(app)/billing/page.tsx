import type { Metadata } from "next";
import { BillingOverview } from "../../_components/BillingOverview";

export const metadata: Metadata = { title: "Billing overview" };
export default function Page() { return <BillingOverview />; }
