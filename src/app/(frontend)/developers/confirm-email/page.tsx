import type { Metadata } from "next";
import { PayloadConfirmEmail } from "@/components/auth/payload-confirm-email";
import { AuthSplitPage } from "@/components/auth/auth-split-page";
import { withSocial } from "@/lib/seo";

export const metadata: Metadata = withSocial({
  title: "Confirm your email",
  robots: { index: false, follow: false },
}, { path: "/developers/confirm-email" });

export default async function ConfirmEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <AuthSplitPage label="Confirm your email" headline="Almost there." sub="One click confirms your email and your account is ready.">
      <h2 className="login-card-title">Confirm your email</h2>
      <PayloadConfirmEmail token={token ?? ""} />
    </AuthSplitPage>
  );
}
