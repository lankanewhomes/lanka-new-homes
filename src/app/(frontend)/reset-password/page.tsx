import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { withSocial } from "@/lib/seo";

export const metadata: Metadata = withSocial({
  title: "Reset Password",
  alternates: { canonical: "/reset-password" },
  robots: { index: false, follow: true },
}, { path: "/reset-password" });

export default function ResetPasswordPage() {
  return (
    <div className="static-page-shell">
      <h1>Set a new password</h1>
      <p className="static-page-lede">Choose a new password for your account.</p>

      <ResetPasswordForm />
    </div>
  );
}
