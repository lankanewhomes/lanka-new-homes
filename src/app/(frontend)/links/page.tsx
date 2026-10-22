import { redirect } from "next/navigation";

// Owner, 2026-10-22: the project posts moved to /links/projects and the land posts live at /links/land. The Instagram bio
// can only be edited in the phone app and still points at /links, so this keeps that link working.
export default function LinksIndexPage() {
  redirect("/links/projects");
}
