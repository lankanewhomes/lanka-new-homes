import type { Metadata } from "next";
import { PayloadResetPasswordForm } from "@/components/auth/payload-reset-password-form";
import { AuthSplitPage } from "@/components/auth/auth-split-page";
import { withSocial } from "@/lib/seo";

export const metadata: Metadata = withSocial({
  title: "Set a new password",
  robots: { index: false, follow: false },
}, { path: "/developers/reset-password" });

export default async function DeveloperResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <AuthSplitPage label="Set a new password" headline="New password." sub="Choose a new password and you'll go straight to your dashboard.">
      <h2 className="login-card-title">Set a new password</h2>
      <PayloadResetPasswordForm token={token ?? ""} />
    </AuthSplitPage>
  );
}
