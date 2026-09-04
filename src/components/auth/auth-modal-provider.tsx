"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode as RNode } from "react";
import Link from "next/link";
import { X } from "lucide-react";
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
const TITLES: Record<ModalMode, string> = { login: "Log in", signup: "Sign up" };

export function AuthModalProvider({ children }: { children: RNode }) {
  const [state, setState] = useState<{ open: boolean; mode: ModalMode; redirectTo: string }>({
    open: false,
    mode: "login",
    redirectTo: "/account",
  });

  const openAuthModal = useCallback((options?: OpenOptions) => {
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

            <h2 className="auth-modal-title">{TITLES[state.mode]}</h2>

            <AuthForm
              key={state.mode}
              mode={state.mode}
              redirectTo={state.redirectTo}
              variant="modal"
              onAuthenticated={() => {
                closeAuthModal();
                window.location.href = state.redirectTo;
              }}
            />

            <p className="auth-modal-note">
              {state.mode === "login" ? (
                <>
                  Don&apos;t have an account?{" "}
                  <button type="button" onClick={() => setState((prev) => ({ ...prev, mode: "signup" }))}>
                    Sign up
                  </button>
                  .
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button type="button" onClick={() => setState((prev) => ({ ...prev, mode: "login" }))}>
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
          </div>
        </div>
      )}
    </AuthModalContext.Provider>
  );
}
