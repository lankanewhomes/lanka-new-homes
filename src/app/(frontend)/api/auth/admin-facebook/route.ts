import { NextResponse } from "next/server";

// Mirrors admin-google/route.ts's allowlist and CSRF-state-cookie pattern,
// plus /developers/register — Facebook is the only admin-side provider that
// can also create a new developer account (see callback/route.ts), so it
// needs the register page in its allowlist too. admin-login and
// developers/login stay login-only.
const ALLOWED_RETURN_PATHS = ["/admin-login", "/developers/login", "/developers/register"];

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
