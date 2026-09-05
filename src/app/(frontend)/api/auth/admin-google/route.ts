import { NextResponse } from "next/server";

// Only these two pages render the Google button — validated against an
// allowlist (never trust the raw query param) so this can't be used as an
// open redirect.
const ALLOWED_RETURN_PATHS = ["/admin-login", "/developers/login"];

// Starts the admin/developer Google OAuth flow (Payload Users only — the
// buyer side goes through Supabase's own Google provider instead, no code
// here). A random nonce is set as a short-lived, httpOnly cookie and echoed
// back as `state` — the callback compares the two to rule out CSRF, without
// needing any server-side session storage for it. The originating login
// page is stashed in a second cookie so a failed sign-in bounces back to
// wherever the user actually started (admin vs developer login).
export async function GET(req: Request) {
  const clientId = process.env.GOOGLE_ADMIN_OAUTH_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Google login isn't configured yet." }, { status: 500 });
  }

  const url = new URL(req.url);
  const origin = url.origin;
  const redirectUri = `${origin}/api/auth/admin-google/callback`;
  const state = crypto.randomUUID();
  const from = url.searchParams.get("from");
  const returnPath = from && ALLOWED_RETURN_PATHS.includes(from) ? from : "/admin-login";

  const authorizeUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", "openid email profile");
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(authorizeUrl.toString());
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 600,
    path: "/",
  };
  response.cookies.set("admin_google_oauth_state", state, cookieOptions);
  response.cookies.set("admin_google_oauth_return", returnPath, cookieOptions);
  return response;
}
