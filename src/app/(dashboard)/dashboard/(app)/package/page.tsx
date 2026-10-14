import type { Metadata } from "next";
import { PackagePage } from "../../_components/PackagePage";

export const metadata: Metadata = { title: "Package" };
export default function Page() { return <PackagePage />; }
