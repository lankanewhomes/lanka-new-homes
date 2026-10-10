import { redirect } from "next/navigation";

// The old Supabase-backed overview (projects/developers tables with edit
// links into the now-deleted /admin/developers/*) is retired — developers
// and projects are edited in Payload now. Same friendly-alias pattern as
// /admin/dashboard.
export default async function AdminOverviewRedirect({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  // Keep any query string (utm_source etc.) on the way to the CMS.
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) query.append(key, item);
  const qs = query.toString();
  redirect(qs ? `/cms?${qs}` : "/cms");
}
