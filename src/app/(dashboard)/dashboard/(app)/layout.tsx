import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "../_components/AppShell";
import { DashProvider } from "../_components/DashProvider";
import { getSession } from "../_data/session";

// Every page inside the dashboard needs a signed-in admin or developer. The check runs on the server for each request, so a
// signed-out visitor is sent to the login page before any page code or data is sent.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/developers/login");
  return (
    <DashProvider session={session}>
      <AppShell>{children}</AppShell>
    </DashProvider>
  );
}
