"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { Profile } from "@/lib/auth";

function NotificationToggles({ profile }: { profile: Profile }) {
  const [notifyEmail, setNotifyEmail] = useState(profile.notifyEmail);
  const [notifyNewProperties, setNotifyNewProperties] = useState(profile.notifyNewProperties);
  const [notifyPriceChanges, setNotifyPriceChanges] = useState(profile.notifyPriceChanges);
  const [marketingOptIn, setMarketingOptIn] = useState(profile.marketingOptIn);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  const save = async (patch: Record<string, boolean>) => {
    setStatus("saving");
    const supabase = createSupabaseBrowserClient();
    await supabase.from("profiles").update(patch).eq("id", profile.id);
    setStatus("saved");
  };

  return (
    <div className="account-panel">
      <h2>Notifications</h2>
      <label className="account-toggle">
        Email notifications
        <input
          type="checkbox"
          checked={notifyEmail}
          onChange={(event) => { setNotifyEmail(event.target.checked); save({ notify_email: event.target.checked }); }}
        />
      </label>
      <label className="account-toggle">
        New-property alerts
        <input
          type="checkbox"
          checked={notifyNewProperties}
          onChange={(event) => { setNotifyNewProperties(event.target.checked); save({ notify_new_properties: event.target.checked }); }}
        />
      </label>
      <label className="account-toggle">
        Price-change alerts
        <input
          type="checkbox"
          checked={notifyPriceChanges}
          onChange={(event) => { setNotifyPriceChanges(event.target.checked); save({ notify_price_changes: event.target.checked }); }}
        />
      </label>
      <label className="account-toggle">
        Share my activity for marketing (privacy setting)
        <input
          type="checkbox"
          checked={marketingOptIn}
          onChange={(event) => { setMarketingOptIn(event.target.checked); save({ marketing_opt_in: event.target.checked }); }}
        />
      </label>
      {status === "saved" ? <p className="account-muted">Preferences saved.</p> : null}
    </div>
  );
}

function PasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8) {
      setStatus("error");
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setStatus("error");
      setErrorMessage("Passwords don't match.");
      return;
    }
    setStatus("saving");
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }
    setPassword("");
    setConfirm("");
    setStatus("saved");
  };

  return (
    <form onSubmit={submit} className="account-panel">
      <h2>Password</h2>
      <label className="account-field">
        New password
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="account-input" />
      </label>
      <label className="account-field">
        Confirm new password
        <input type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} className="account-input" />
      </label>
      <div className="account-chip-row">
        <button type="submit" disabled={status === "saving"} className="account-btn account-btn--dark">
          {status === "saving" ? "Updating…" : "Update password"}
        </button>
        {status === "saved" ? <span className="account-muted">Password updated.</span> : null}
        {status === "error" ? <span className="account-error">{errorMessage}</span> : null}
      </div>
    </form>
  );
}

function DeleteAccount() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const confirmDelete = async () => {
    setDeleting(true);
    setError("");
    try {
      const response = await fetch("/api/account/delete", { method: "POST" });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? "Unable to delete your account.");
        setDeleting(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Unable to delete your account.");
      setDeleting(false);
    }
  };

  return (
    <div className="account-panel account-panel--danger">
      <h2>Delete account</h2>
      <p>This permanently deletes your account, saved listings, saved developments and saved searches. This cannot be undone.</p>
      {!confirming ? (
        <div className="account-chip-row">
          <button type="button" onClick={() => setConfirming(true)} className="account-btn account-btn--danger">Delete my account</button>
        </div>
      ) : (
        <div className="account-chip-row">
          <button type="button" disabled={deleting} onClick={confirmDelete} className="account-btn account-btn--danger-solid">
            {deleting ? "Deleting…" : "Yes, permanently delete my account"}
          </button>
          <button type="button" disabled={deleting} onClick={() => setConfirming(false)} className="account-btn">Cancel</button>
        </div>
      )}
      {error ? <p className="account-error">{error}</p> : null}
    </div>
  );
}

export function SettingsForm({ profile }: { profile: Profile }) {
  return (
    <div className="account-stack">
      <NotificationToggles profile={profile} />
      <PasswordForm />
      <DeleteAccount />
    </div>
  );
}
