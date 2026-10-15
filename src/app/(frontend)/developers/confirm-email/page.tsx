import type { Metadata } from "next";
import { PayloadConfirmEmail } from "@/components/auth/payload-confirm-email";
import { withSocial } from "@/lib/seo";

export const metadata: Metadata = withSocial({
  title: "Confirm your email",
  robots: { index: false, follow: false },
}, { path: "/developers/confirm-email" });

export default async function ConfirmEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <div className="payload-auth-bg">
      <div className="static-page-shell auth-page payload-auth-page">
        <h1>Confirm your email</h1>
        <p className="static-page-lede auth-page-lede">One click and your account is ready.</p>
        <PayloadConfirmEmail token={token ?? ""} />
      </div>
    </div>
  );
}
