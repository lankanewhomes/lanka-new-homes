import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Log In",
  alternates: { canonical: "/login" },
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return (
    <div className="static-page-shell">
      <h1>Log in</h1>
      <p className="static-page-lede">Sign in to see your saved listings and inquiries.</p>

      <AuthForm mode="login" redirectTo="/account" />

      <p className="static-page-note">
        Don&apos;t have an account? <a href="/signup">Sign up</a>. Registered as a developer?{" "}
        <a href="/developers/login">Developer login</a>.
      </p>
    </div>
  );
}
