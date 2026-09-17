import { NextResponse } from "next/server";
import { mintPayloadSessionCookie } from "@/collections/auth/mint-session";

type FacebookTokenResponse = { access_token?: string; error?: { message?: string } };
type FacebookUserInfo = { email?: string; name?: string; error?: { message?: string } };

const ALLOWED_RETURN_PATHS = ["/admin-login", "/developers/login"];

function loginErrorRedirect(origin: string, returnPath: string, message: string) {
  return NextResponse.redirect(`${origin}${returnPath}?error=${encodeURIComponent(message)}`);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = req.headers.get("cookie")?.match(/admin_facebook_oauth_state=([^;]+)/)?.[1];
  const cookieReturnPath = req.headers.get("cookie")?.match(/admin_facebook_oauth_return=([^;]+)/)?.[1];
  const returnPath = cookieReturnPath && ALLOWED_RETURN_PATHS.includes(decodeURIComponent(cookieReturnPath)) ? decodeURIComponent(cookieReturnPath) : "/admin-login";

  if (!code || !state || !cookieState || state !== cookieState) {
    return loginErrorRedirect(origin, returnPath, "That sign-in link expired or is invalid. Please try again.");
  }

  const appId = process.env.FACEBOOK_ADMIN_OAUTH_APP_ID;
  const appSecret = process.env.FACEBOOK_ADMIN_OAUTH_APP_SECRET;
  if (!appId || !appSecret) {
    return loginErrorRedirect(origin, returnPath, "Facebook login isn't configured yet.");
  }

  try {
    const redirectUri = `${origin}/api/auth/admin-facebook/callback`;
    const tokenUrl = new URL("https://graph.facebook.com/v21.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id", appId);
    tokenUrl.searchParams.set("client_secret", appSecret);
    tokenUrl.searchParams.set("redirect_uri", redirectUri);
    tokenUrl.searchParams.set("code", code);

    const tokenRes = await fetch(tokenUrl.toString());
    const tokenBody = (await tokenRes.json()) as FacebookTokenResponse;
    if (!tokenRes.ok || !tokenBody.access_token) {
      return loginErrorRedirect(origin, returnPath, tokenBody.error?.message ?? "Couldn't sign in with Facebook. Please try again.");
    }

    const userInfoUrl = new URL("https://graph.facebook.com/me");
    userInfoUrl.searchParams.set("fields", "email,name");
    userInfoUrl.searchParams.set("access_token", tokenBody.access_token);
    const userInfoRes = await fetch(userInfoUrl.toString());
    const userInfo = (await userInfoRes.json()) as FacebookUserInfo;
    const email = userInfo.email?.trim().toLowerCase();
    // Facebook has no "email_verified" flag like Google — a returned email
    // is already tied to a Facebook-verified account, or absent entirely
    // (some accounts have no email on file, e.g. mobile-registered ones).
    if (!userInfoRes.ok || !email) {
      return loginErrorRedirect(origin, returnPath, "Your Facebook account doesn't have an email LankaNewHomes can use. Please log in with email and password instead.");
    }

    const { getPayload } = await import("payload");
    const payloadConfig = (await import("../../../../../../../payload.config")).default;
    const payload = await getPayload({ config: payloadConfig });

    // Login only — same policy as admin-google: a random Facebook account
    // signing in shouldn't be able to grant itself a developer or admin
    // role. New accounts still go through the real signup form.
    const { docs } = await payload.find({
      collection: "users",
      where: { email: { equals: email } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    const user = docs[0];
    if (!user) {
      return loginErrorRedirect(origin, returnPath, `No account found for ${email}. Sign up first, then Facebook sign-in will work.`);
    }
    if ((user as { _verified?: boolean })._verified === false) {
      return loginErrorRedirect(origin, returnPath, "Please confirm your email before logging in.");
    }

    const cookie = await mintPayloadSessionCookie(payload, user as { id: string | number; email: string; sessions?: unknown });

    const adminRoute = payload.config.routes.admin || "/admin";
    const response = NextResponse.redirect(`${origin}${adminRoute}`);
    response.headers.append("Set-Cookie", cookie);
    response.cookies.set("admin_facebook_oauth_state", "", { maxAge: 0, path: "/" });
    response.cookies.set("admin_facebook_oauth_return", "", { maxAge: 0, path: "/" });
    return response;
  } catch {
    return loginErrorRedirect(origin, returnPath, "Something went wrong signing in with Facebook. Please try again.");
  }
}
