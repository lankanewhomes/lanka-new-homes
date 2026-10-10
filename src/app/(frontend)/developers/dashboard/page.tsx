import { redirect } from "next/navigation";

// Friendly alias for Payload's own dashboard — a signed-in developer sees
// it automatically scoped to their own projects/leads/analytics (see
// hidden/baseListFilter access rules in src/collections/*), same interface
// an admin uses, not a separate lookalike dashboard.
export default async function DeveloperDashboardRedirect({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  // Keep any query string (utm_source etc.) on the way to the CMS.
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) query.append(key, item);
  const qs = query.toString();
  redirect(qs ? `/cms?${qs}` : "/cms");
}
