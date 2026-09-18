"use client";

import { useState } from "react";
import { AUTH_STEP_TITLES, AuthForm, type ModalStep } from "@/components/auth/auth-form";

// The standalone /login and /signup pages now run the exact same
// email-first flow as the buyer popup (auth-modal-provider.tsx) — same
// step machine, same titles, same "no upfront tab to pick wrong" behavior.
// This shell just supplies the page's own heading, updated as the step
// changes, the same way the popup's <h2> does.
export function PageAuthShell({ redirectTo }: { redirectTo: string }) {
  const [step, setStep] = useState<ModalStep>("email");

  return (
    <>
      <h1>{AUTH_STEP_TITLES[step]}</h1>
      <AuthForm redirectTo={redirectTo} onStepChange={setStep} />
    </>
  );
}
