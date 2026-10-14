import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginCard } from "../_components/LoginCard";
import { getSession } from "../_data/session";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getSession()) redirect("/dashboard/overview");
  return <LoginCard />;
}
