import { redirect } from "next/navigation";

// Friendly alias for Payload's own dashboard — a signed-in admin just sees
// everything there; there's no separate admin-only dashboard to build.
export default async function AdminDashboardRedirect({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  // Keep any query string (utm_source etc.) on the way to the CMS.
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) query.append(key, item);
  const qs = query.toString();
  redirect(qs ? `/cms?${qs}` : "/cms");
}
