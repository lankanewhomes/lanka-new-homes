import { redirect } from "next/navigation";

// Friendly alias for Payload's own dashboard — a signed-in admin just sees
// everything there; there's no separate admin-only dashboard to build.
export default function AdminDashboardRedirect() {
  redirect("/cms");
}
