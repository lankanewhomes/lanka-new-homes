"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode as RNode } from "react";
import { X } from "lucide-react";
import { AuthForm } from "@/components/auth/auth-form";

type ModalMode = "login" | "signup";
type ModalIntent = "buyer" | "developer";

type OpenOptions = {
  mode?: ModalMode;
  intent?: ModalIntent;
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

const TITLES: Record<ModalIntent, Record<ModalMode, string>> = {
  buyer: { login: "Log in", signup: "Sign up" },
  developer: { login: "Developer login", signup: "Developer registration" },
};

export function AuthModalProvider({ children }: { children: RNode }) {
  const [state, setState] = useState<{ open: boolean; mode: ModalMode; intent: ModalIntent; redirectTo: string }>({
    open: false,
    mode: "login",
    intent: "buyer",
    redirectTo: "/account",
  });

  const openAuthModal = useCallback((options?: OpenOptions) => {
    setState((prev) => ({
      open: true,
      mode: options?.mode ?? "login",
      intent: options?.intent ?? "buyer",
      redirectTo: options?.redirectTo ?? (options?.intent === "developer" ? "/developers/dashboard" : "/account"),
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

            <h2 className="auth-modal-title">{TITLES[state.intent][state.mode]}</h2>

            <AuthForm
              key={`${state.mode}-${state.intent}`}
              mode={state.mode}
              intent={state.intent === "developer" ? "developer" : undefined}
              redirectTo={state.redirectTo}
              onDeveloperRoleCheck={state.intent === "developer" && state.mode === "login"}
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
              {state.intent === "buyer" ? (
                <>
                  Registering a development company?{" "}
                  <button
                    type="button"
                    onClick={() => setState((prev) => ({ ...prev, intent: "developer", mode: "signup" }))}
                  >
                    Developer registration
                  </button>
                  .
                </>
              ) : (
                <>
                  Not a developer?{" "}
                  <button type="button" onClick={() => setState((prev) => ({ ...prev, intent: "buyer", mode: "login" }))}>
                    Buyer login
                  </button>
                  .
                </>
              )}
            </p>

            <p className="auth-modal-legal">
              <strong>By clicking continue</strong> you agree to LankaLiving&apos;s <a href="/terms">Terms of Service</a> and{" "}
              <a href="/privacy">Privacy Policy</a>.
            </p>
          </div>
        </div>
      )}
    </AuthModalContext.Provider>
  );
}
