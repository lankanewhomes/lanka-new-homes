import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

// Handles the redirect back from Supabase after email confirmation or an
// OAuth provider (Google / Facebook / LinkedIn) finishes. `next` and `intent`
// are passed through from wherever the login/signup flow started.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const intent = searchParams.get("intent");

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      if (intent === "developer") {
        await supabase
          .from("profiles")
          .update({ role: "developer" })
          .eq("id", data.user.id)
          .eq("role", "buyer");
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
