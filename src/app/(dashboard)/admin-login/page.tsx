import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginCard } from "../dashboard/_components/LoginCard";
import { getSession } from "../dashboard/_data/session";

export const metadata: Metadata = { title: "Admin login", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

// Same sign-in card as /dashboard/login, with admin wording; either role signs in here and lands in the dashboard.
export default async function AdminLoginPage() {
  if (await getSession()) redirect("/dashboard/overview");
  return <LoginCard title="Admin sign in." lede="Sign in to manage LankaNewHomes." />;
}
