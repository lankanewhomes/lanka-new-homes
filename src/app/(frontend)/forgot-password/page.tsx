import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { AuthSplitPage } from "@/components/auth/auth-split-page";
import { withSocial } from "@/lib/seo";

export const metadata: Metadata = withSocial({
  title: "Forgot Password",
  alternates: { canonical: "/forgot-password" },
  robots: { index: false, follow: true },
}, { path: "/forgot-password" });

export default function ForgotPasswordPage() {
  return (
    <AuthSplitPage
      label="Reset your password"
      headline="Reset your password."
      sub="Enter the email on your account and we'll send you a link to set a new password. Signed up with Google? Use that button on the login page instead, there's no password to reset."
      ctas={<Link href="/login" className="fdv-cta-final-button">Back to log in</Link>}
    >
      <h2 className="login-card-title">Send a reset link</h2>
      <ForgotPasswordForm />
    </AuthSplitPage>
  );
}
