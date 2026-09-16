"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode as RNode } from "react";
import Link from "next/link";
import { Bell, Building2, ShieldCheck, X } from "lucide-react";
import { AuthForm } from "@/components/auth/auth-form";

type ModalMode = "login" | "signup";

type OpenOptions = {
  mode?: ModalMode;
  redirectTo?: string;
};

type AuthModalContextValue = {
  openAuthModal: (options?: OpenOptions) => void;
  closeAuthModal: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used within AuthModalProvider");
  return ctx;
}

// Buyer-only modal — developers and admin log in through Payload directly
// now (/developers/login, /admin-login), not through this Supabase-backed
// modal, so it no longer needs a "developer" intent branch.
// Question-style headline for signup (matches the reference redesign —
// leads with "why sign up" instead of a bare label); login keeps a plain
// statement since "what's the best email" doesn't make sense for someone
// who already has an account.
// Signup's step-2 (name/password, once the email is captured) gets its own
// plain headline — "what's the best email" no longer makes sense once
// that email is already on screen with a Change link.
const TITLES: Record<ModalMode, string> = {
  login: "Log in to LankaNewHomes",
  signup: "Get instant alerts on new listings",
};
const SIGNUP_DETAILS_TITLE = "Almost done — set a password";

export function AuthModalProvider({ children }: { children: RNode }) {
  const [state, setState] = useState<{ open: boolean; mode: ModalMode; redirectTo: string }>({
    open: false,
    mode: "login",
    redirectTo: "/account",
  });
  const [signupStep, setSignupStep] = useState<"email" | "details">("email");

  const openAuthModal = useCallback((options?: OpenOptions) => {
    setSignupStep("email");
    setState((prev) => ({
      ...prev,
      open: true,
      mode: options?.mode ?? "login",
      redirectTo: options?.redirectTo ?? "/account",
    }));
  }, []);

  const closeAuthModal = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  const value = useMemo(() => ({ openAuthModal, closeAuthModal }), [openAuthModal, closeAuthModal]);

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      {state.open && (
        <div className="auth-modal-backdrop" onClick={closeAuthModal}>
          <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="auth-modal-close" aria-label="Close" onClick={closeAuthModal}>
              <X className="h-5 w-5" aria-hidden="true" />
            </button>

            <h2 className="auth-modal-title">
              {state.mode === "signup" && signupStep === "details" ? SIGNUP_DETAILS_TITLE : TITLES[state.mode]}
            </h2>

            <AuthForm
              key={state.mode}
              mode={state.mode}
              redirectTo={state.redirectTo}
              variant="modal"
              onStepChange={setSignupStep}
              onAuthenticated={() => {
                closeAuthModal();
                window.location.href = state.redirectTo;
              }}
            />

            <p className="auth-modal-note">
              {state.mode === "login" ? (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setSignupStep("email");
                      setState((prev) => ({ ...prev, mode: "signup" }));
                    }}
                  >
                    Sign up
                  </button>
                  .
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setSignupStep("email");
                      setState((prev) => ({ ...prev, mode: "login" }));
                    }}
                  >
                    Log in
                  </button>
                  .
                </>
              )}{" "}
              Registering a development company? <Link href="/developers/login">Developer login</Link>.
            </p>

            <p className="auth-modal-legal">
              <strong>By clicking continue</strong> you agree to LankaNewHomes&apos;s <a href="/terms">Terms of Service</a> and{" "}
              <a href="/privacy">Privacy Policy</a>.
            </p>

            {state.mode === "signup" && signupStep === "email" ? (
              <div className="auth-modal-tagline">
                <div className="auth-modal-tagline-icons">
                  <Bell className="h-4 w-4" aria-hidden="true" />
                  <Building2 className="h-4 w-4" aria-hidden="true" />
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                </div>
                <p>Get instant alerts on new listings, price changes, and construction updates across Sri Lanka.</p>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </AuthModalContext.Provider>
  );
}
