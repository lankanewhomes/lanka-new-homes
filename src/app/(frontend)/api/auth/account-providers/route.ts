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

  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
    headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
  });
  if (!response.ok) {
    return NextResponse.json({ providers: [] });
  }

  const data = await response.json();
  const providers: string[] = data?.users?.[0]?.app_metadata?.providers ?? [];
  return NextResponse.json({ providers });
}
