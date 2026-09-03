import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Reset Password",
  alternates: { canonical: "/reset-password" },
  robots: { index: false, follow: true },
};

export default function ResetPasswordPage() {
  return (
    <div className="static-page-shell">
      <h1>Set a new password</h1>
      <p className="static-page-lede">Choose a new password for your account.</p>

      <ResetPasswordForm />
    </div>
  );
}
