import { redirect } from "next/navigation";

// One sign-in for admins and developers: /dashboard/login. Kept so old bookmarks and links still work.
export default function AdminLoginRedirect() {
  redirect("/dashboard/login");
}
