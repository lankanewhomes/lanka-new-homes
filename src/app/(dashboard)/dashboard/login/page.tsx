import { redirect } from "next/navigation";

// One sign-in for admins and developers: /developers/login. Kept so old links still work.
export default function DashboardLoginRedirect() {
  redirect("/developers/login");
}
