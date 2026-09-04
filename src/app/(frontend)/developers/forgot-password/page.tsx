import type { Metadata } from "next";
import Link from "next/link";
import { PayloadForgotPasswordForm } from "@/components/auth/payload-forgot-password-form";

export const metadata: Metadata = {
  title: "Reset Password",
  alternates: { canonical: "/developers/forgot-password" },
  robots: { index: false, follow: true },
};

// One shared page for both developer and admin — same Payload Users
// collection either way, so there's nothing role-specific to say here.
// Linked from both /developers/login and /admin-login.
export default function DeveloperForgotPasswordPage() {
  return (
    <div className="static-page-shell auth-page payload-auth-page">
      <h1>Reset your password</h1>
      <p className="static-page-lede auth-page-lede">
        Enter the email on your account and we&apos;ll send you a link to set a new password.
      </p>

      <PayloadForgotPasswordForm />

      <p className="static-page-note auth-page-note">
        Remembered it? <Link href="/developers/login">Log in</Link>.
      </p>
    </div>
  );
}
