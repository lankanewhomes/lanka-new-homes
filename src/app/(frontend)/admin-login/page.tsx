import { redirect } from "next/navigation";

// One sign-in for admins and developers: /developers/login. Kept so old bookmarks and links still work.
export default function AdminLoginRedirect() {
  redirect("/developers/login");
}
