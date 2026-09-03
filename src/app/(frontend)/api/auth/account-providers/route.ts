import { NextResponse } from "next/server";

// Called only after a failed password login, to turn Supabase's generic
// "Invalid login credentials" into a specific "use Google sign-in instead"
// hint when the email belongs to an OAuth-only account. Never used to
// confirm account existence up front — a failed login already implies that.
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
