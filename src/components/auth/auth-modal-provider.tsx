"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode as RNode } from "react";
import Link from "next/link";
import { Bell, Building2, ShieldCheck, X } from "lucide-react";
import { AUTH_STEP_TITLES, AuthForm, type ModalStep } from "@/components/auth/auth-form";

type ModalMode = "login" | "signup";

type OpenOptions = {
  /** Cosmetic only since the unified email-first flow shipped — every open
   * starts at the same "email" step regardless of this value. Kept so
   * existing openAuthModal({ mode: "signup" }) call sites (header buttons,
   * map sidebar, etc.) still read clearly and don't need touching. */
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
//
// One email field decides login vs. signup — no upfront tab to pick wrong.
// Every open starts at "email" (regardless of whether a "Log in" or "Sign
// up" button triggered it) with the same enticing headline; submitting
// that field looks the address up and the form becomes a login or signup
// screen accordingly. Step names/titles come from auth-form.tsx — shared
// with the standalone /login and /signup pages (page-auth-shell.tsx).

export function AuthModalProvider({ children }: { children: RNode }) {
  const [state, setState] = useState<{ open: boolean; mode: ModalMode; redirectTo: string }>({
    open: false,
    mode: "login",
    redirectTo: "/account",
  });
  const [modalStep, setModalStep] = useState<ModalStep>("email");

  const openAuthModal = useCallback((options?: OpenOptions) => {
    setModalStep("email");
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

            <h2 className="auth-modal-title">{AUTH_STEP_TITLES[modalStep]}</h2>

            <AuthForm
              redirectTo={state.redirectTo}
              variant="modal"
              onStepChange={setModalStep}
              onAuthenticated={() => {
                closeAuthModal();
                window.location.href = state.redirectTo;
              }}
            />

            <p className="auth-modal-note">
              Registering a development company? <Link href="/developers/login">Developer login</Link>.
            </p>

            <p className="auth-modal-legal">
              <strong>By clicking continue</strong> you agree to LankaNewHomes&apos;s <a href="/terms">Terms of Service</a> and{" "}
              <a href="/privacy">Privacy Policy</a>.
            </p>

            {modalStep === "email" ? (
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
