// Meta Pixel CompleteRegistration for sign-ups that finish on the server. A Google (or other OAuth) sign-up comes back
// through /auth/callback, a route handler where the pixel can't run, so the callback leaves this one-time cookie on its
// redirect and the next page sends the event (DeferredMetaPixel), then clears it. Email + password sign-ups send the
// event from the form itself (auth-form.tsx, payload-login-form.tsx), so their confirmation link never sets the cookie.

export const NEW_SIGNUP_COOKIE = "lnh_new_signup";
export type SignupKind = "user" | "developer";

const NEW_ACCOUNT_WINDOW_MS = 10 * 60 * 1000;
const FIRST_SIGN_IN_WINDOW_MS = 2 * 60 * 1000;

type SignupUser = {
  created_at?: string | null;
  last_sign_in_at?: string | null;
  app_metadata?: { provider?: string | null } | null;
};

/** Server: was this Supabase account just created through an OAuth provider, and is this its first sign-in? */
export function isFreshOAuthSignup(user: SignupUser, now: number = Date.now()): boolean {
  const provider = user.app_metadata?.provider;
  if (!provider || provider === "email") return false;
  const createdAt = Date.parse(user.created_at ?? "");
  if (!Number.isFinite(createdAt) || now - createdAt > NEW_ACCOUNT_WINDOW_MS) return false;
  const lastSignInAt = Date.parse(user.last_sign_in_at ?? "");
  return !Number.isFinite(lastSignInAt) || lastSignInAt - createdAt < FIRST_SIGN_IN_WINDOW_MS;
}

/** Browser: reads and clears the cookie; the sign-up kind when it was set, otherwise null. */
export function takeNewSignupCookie(): SignupKind | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${NEW_SIGNUP_COOKIE}=(user|developer)(?:;|$)`));
  if (!match) return null;
  document.cookie = `${NEW_SIGNUP_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  return match[1] as SignupKind;
}
