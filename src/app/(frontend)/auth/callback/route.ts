import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { isFreshOAuthSignup, NEW_SIGNUP_COOKIE } from "@/lib/meta-pixel-signup";

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
      const response = NextResponse.redirect(`${origin}${next}`);
      // A brand-new Google (OAuth) account: the next page sends Meta's CompleteRegistration (src/lib/meta-pixel-signup.ts).
      if (isFreshOAuthSignup(data.user)) {
        response.cookies.set(NEW_SIGNUP_COOKIE, intent === "developer" ? "developer" : "user", {
          path: "/",
          maxAge: 600,
          sameSite: "lax",
          secure: origin.startsWith("https://"),
        });
      }
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
