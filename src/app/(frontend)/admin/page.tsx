import { redirect } from "next/navigation";

// The old Supabase-backed overview (projects/developers tables with edit
// links into the now-deleted /admin/developers/*) is retired — developers
// and projects are edited in Payload now. Same friendly-alias pattern as
// /admin/dashboard.
export default function AdminOverviewRedirect() {
  redirect("/cms");
}
