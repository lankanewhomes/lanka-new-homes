import type { Metadata } from "next";
import { ConnectionStatus } from "../../../_components/ConnectionStatus";

export const metadata: Metadata = { title: "Mail connection" };
export default function Page() { return <ConnectionStatus />; }
