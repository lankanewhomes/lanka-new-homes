import { NextResponse } from "next/server";

// Two callers: the page-variant login form, after a failed password
// attempt, to turn Supabase's generic "Invalid login credentials" into a
// specific "use Google sign-in instead" hint; and the buyer popup's unified
// email-first step (auth-form.tsx), which calls this immediately after the
// email is typed to decide whether the next screen is a login, a signup,
// or an "use your other sign-in method" notice — see ModalStep there.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email : null;
  if (!email) {
    return NextResponse.json({ providers: [] });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ providers: [] });
  }

  // GoTrue's admin users endpoint accepts an `email` query param, but on
  // this project it doesn't actually filter — it silently returns the
  // regular (unfiltered) listing. Page through it and match the email
  // ourselves rather than trusting the filter.
  const targetEmail = email.toLowerCase();
  const perPage = 200;
  const maxPages = 25; // 5,000 users — well past this site's real user count
  let providers: string[] = [];

  for (let page = 1; page <= maxPages; page++) {
    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users?per_page=${perPage}&page=${page}`, {
      headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
    });
    if (!response.ok) break;

    const data = await response.json();
    const users: { email?: string; app_metadata?: { providers?: string[] } }[] = data?.users ?? [];
    const match = users.find((user) => user.email?.toLowerCase() === targetEmail);
    if (match) {
      providers = match.app_metadata?.providers ?? [];
      break;
    }
    if (users.length < perPage) break; // last page
  }

  return NextResponse.json({ providers });
}
