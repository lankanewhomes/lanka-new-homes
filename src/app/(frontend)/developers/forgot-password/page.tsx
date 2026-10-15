import type { Metadata } from "next";
import Link from "next/link";
import { PayloadForgotPasswordForm } from "@/components/auth/payload-forgot-password-form";
import { AuthSplitPage } from "@/components/auth/auth-split-page";
import { withSocial } from "@/lib/seo";

export const metadata: Metadata = withSocial({
  title: "Reset Password",
  alternates: { canonical: "/developers/forgot-password" },
  robots: { index: false, follow: true },
}, { path: "/developers/forgot-password" });

// One shared page for developers and admins: same Payload Users collection either way.
export default function DeveloperForgotPasswordPage() {
  return (
    <AuthSplitPage
      label="Reset your password"
      headline="Reset your password."
      sub="Enter the email on your developer or admin account and we'll send you a link to set a new password."
      ctas={<Link href="/developers/login" className="fdv-cta-final-button">Back to log in</Link>}
    >
      <h2 className="login-card-title">Send a reset link</h2>
      <PayloadForgotPasswordForm />
    </AuthSplitPage>
  );
}
