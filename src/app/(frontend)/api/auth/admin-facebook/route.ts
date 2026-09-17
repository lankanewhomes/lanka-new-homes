import { NextResponse } from "next/server";

// Mirrors admin-google/route.ts — same allowlist, same CSRF-state-cookie
// pattern, same two login pages. Kept as a near-identical twin on purpose so
// the two providers stay easy to compare/maintain together.
const ALLOWED_RETURN_PATHS = ["/admin-login", "/developers/login"];

export async function GET(req: Request) {
  const appId = process.env.FACEBOOK_ADMIN_OAUTH_APP_ID;
  if (!appId) {
    return NextResponse.json({ error: "Facebook login isn't configured yet." }, { status: 500 });
  }

  const url = new URL(req.url);
  const origin = url.origin;
  const redirectUri = `${origin}/api/auth/admin-facebook/callback`;
  const state = crypto.randomUUID();
  const from = url.searchParams.get("from");
  const returnPath = from && ALLOWED_RETURN_PATHS.includes(from) ? from : "/admin-login";

  const authorizeUrl = new URL("https://www.facebook.com/v21.0/dialog/oauth");
  authorizeUrl.searchParams.set("client_id", appId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", "email public_profile");
  authorizeUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authorizeUrl.toString());
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 600,
    path: "/",
  };
  response.cookies.set("admin_facebook_oauth_state", state, cookieOptions);
  response.cookies.set("admin_facebook_oauth_return", returnPath, cookieOptions);
  return response;
}
