import type { Metadata } from "next";
import { PayloadResetPasswordForm } from "@/components/auth/payload-reset-password-form";
import { withSocial } from "@/lib/seo";

export const metadata: Metadata = withSocial({
  title: "Set a new password",
  robots: { index: false, follow: false },
}, { path: "/developers/reset-password" });

export default async function DeveloperResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <div className="payload-auth-bg">
      <div className="static-page-shell auth-page payload-auth-page">
        <h1>Set a new password</h1>
        <p className="static-page-lede auth-page-lede">Choose a new password for your account.</p>
        <PayloadResetPasswordForm token={token ?? ""} />
      </div>
    </div>
  );
}
