import { redirect } from "next/navigation";

// Friendly alias for Payload's own dashboard — a signed-in developer sees
// it automatically scoped to their own projects/leads/analytics (see
// hidden/baseListFilter access rules in src/collections/*), same interface
// an admin uses, not a separate lookalike dashboard.
export default function DeveloperDashboardRedirect() {
  redirect("/cms");
}
