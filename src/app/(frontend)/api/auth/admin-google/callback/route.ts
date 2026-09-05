import { NextResponse } from "next/server";
import { mintPayloadSessionCookie } from "@/collections/auth/mint-session";

type GoogleTokenResponse = { access_token?: string; error?: string; error_description?: string };
type GoogleUserInfo = { email?: string; email_verified?: boolean; name?: string };

const ALLOWED_RETURN_PATHS = ["/admin-login", "/developers/login"];

function loginErrorRedirect(origin: string, returnPath: string, message: string) {
  return NextResponse.redirect(`${origin}${returnPath}?error=${encodeURIComponent(message)}`);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = req.headers.get("cookie")?.match(/admin_google_oauth_state=([^;]+)/)?.[1];
  const cookieReturnPath = req.headers.get("cookie")?.match(/admin_google_oauth_return=([^;]+)/)?.[1];
  const returnPath = cookieReturnPath && ALLOWED_RETURN_PATHS.includes(decodeURIComponent(cookieReturnPath)) ? decodeURIComponent(cookieReturnPath) : "/admin-login";

  if (!code || !state || !cookieState || state !== cookieState) {
    return loginErrorRedirect(origin, returnPath, "That sign-in link expired or is invalid. Please try again.");
  }

  const clientId = process.env.GOOGLE_ADMIN_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADMIN_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return loginErrorRedirect(origin, returnPath, "Google login isn't configured yet.");
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${origin}/api/auth/admin-google/callback`,
        grant_type: "authorization_code",
      }),
    });
    const tokenBody = (await tokenRes.json()) as GoogleTokenResponse;
    if (!tokenRes.ok || !tokenBody.access_token) {
      return loginErrorRedirect(origin, returnPath, tokenBody.error_description ?? "Couldn't sign in with Google. Please try again.");
    }

    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenBody.access_token}` },
    });
    const userInfo = (await userInfoRes.json()) as GoogleUserInfo;
    const email = userInfo.email?.trim().toLowerCase();
    if (!userInfoRes.ok || !email || !userInfo.email_verified) {
      return loginErrorRedirect(origin, returnPath, "Couldn't verify your Google account. Please try again.");
    }

    const { getPayload } = await import("payload");
    const payloadConfig = (await import("../../../../../../../payload.config")).default;
    const payload = await getPayload({ config: payloadConfig });

    // Login only — this doesn't create new accounts. A random Google
    // account signing in shouldn't be able to grant itself a developer or
    // admin role; new accounts still go through the real signup form
    // (email/password + company name), matching how it already works.
    const { docs } = await payload.find({
      collection: "users",
      where: { email: { equals: email } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    const user = docs[0];
    if (!user) {
      return loginErrorRedirect(origin, returnPath, `No account found for ${email}. Sign up first, then Google sign-in will work.`);
    }
    if ((user as { _verified?: boolean })._verified === false) {
      return loginErrorRedirect(origin, returnPath, "Please confirm your email before logging in.");
    }

    const cookie = await mintPayloadSessionCookie(payload, user as { id: string | number; email: string; sessions?: unknown });

    const adminRoute = payload.config.routes.admin || "/admin";
    const response = NextResponse.redirect(`${origin}${adminRoute}`);
    response.headers.append("Set-Cookie", cookie);
    response.cookies.set("admin_google_oauth_state", "", { maxAge: 0, path: "/" });
    response.cookies.set("admin_google_oauth_return", "", { maxAge: 0, path: "/" });
    return response;
  } catch {
    return loginErrorRedirect(origin, returnPath, "Something went wrong signing in with Google. Please try again.");
  }
}
