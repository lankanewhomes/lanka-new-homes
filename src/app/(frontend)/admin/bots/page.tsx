import { redirect } from "next/navigation";

// /admin/bots is the address the owner asked for; the page itself lives with the other Analytics pages in the dashboard (admin only).
export default function AdminBotsRedirect() {
  redirect("/dashboard/analytics/bots");
}
