import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { withSocial } from "@/lib/seo";

export const metadata: Metadata = withSocial({
  title: "Forgot Password",
  alternates: { canonical: "/forgot-password" },
  robots: { index: false, follow: true },
}, { path: "/forgot-password" });

export default function ForgotPasswordPage() {
  return (
    <div className="static-page-shell">
      <h1>Reset your password</h1>
      <p className="static-page-lede">
        Enter the email on your account and we&apos;ll send you a link to set a new password.
      </p>

      <ForgotPasswordForm />

      <p className="static-page-note">
        Remembered it? <a href="/login">Log in</a>. Signed up with Google, Facebook, or LinkedIn? Use that
        button on the login page instead — there&apos;s no password to reset.
      </p>
    </div>
  );
}
