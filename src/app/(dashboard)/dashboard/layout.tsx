import type { ReactNode } from "react";
import { DashProvider } from "./_components/DashProvider";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashProvider>{children}</DashProvider>;
}
