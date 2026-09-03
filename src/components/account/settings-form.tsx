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
    <div className="space-y-3 border border-stone-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-stone-900">Notifications</h2>
      <label className="flex items-center justify-between gap-3 text-sm text-stone-700">
        Email notifications
        <input
          type="checkbox"
          checked={notifyEmail}
          onChange={(event) => { setNotifyEmail(event.target.checked); save({ notify_email: event.target.checked }); }}
        />
      </label>
      <label className="flex items-center justify-between gap-3 text-sm text-stone-700">
        New-property alerts
        <input
          type="checkbox"
          checked={notifyNewProperties}
          onChange={(event) => { setNotifyNewProperties(event.target.checked); save({ notify_new_properties: event.target.checked }); }}
        />
      </label>
      <label className="flex items-center justify-between gap-3 text-sm text-stone-700">
        Price-change alerts
        <input
          type="checkbox"
          checked={notifyPriceChanges}
          onChange={(event) => { setNotifyPriceChanges(event.target.checked); save({ notify_price_changes: event.target.checked }); }}
        />
      </label>
      <label className="flex items-center justify-between gap-3 border-t border-stone-100 pt-3 text-sm text-stone-700">
        Share my activity for marketing (privacy setting)
        <input
          type="checkbox"
          checked={marketingOptIn}
          onChange={(event) => { setMarketingOptIn(event.target.checked); save({ marketing_opt_in: event.target.checked }); }}
        />
      </label>
      {status === "saved" ? <p className="text-xs text-emerald-700">Preferences saved.</p> : null}
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
    <form onSubmit={submit} className="space-y-3 border border-stone-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-stone-900">Password</h2>
      <label className="block space-y-1 text-xs font-medium text-stone-600">
        New password
        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full border border-stone-300 px-3 py-2 text-sm" />
      </label>
      <label className="block space-y-1 text-xs font-medium text-stone-600">
        Confirm new password
        <input type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} className="w-full border border-stone-300 px-3 py-2 text-sm" />
      </label>
      <button type="submit" disabled={status === "saving"} className="border border-stone-900 bg-stone-900 px-5 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60">
        {status === "saving" ? "Updating…" : "Update password"}
      </button>
      {status === "saved" ? <p className="text-xs text-emerald-700">Password updated.</p> : null}
      {status === "error" ? <p className="text-xs text-red-700">{errorMessage}</p> : null}
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
    <div className="space-y-3 border border-red-200 bg-red-50 p-4">
      <h2 className="text-sm font-semibold text-red-900">Delete account</h2>
      <p className="text-xs text-red-800">
        This permanently deletes your account, saved listings, saved developments, and saved searches. This can&apos;t be undone.
      </p>
      {!confirming ? (
        <button type="button" onClick={() => setConfirming(true)} className="border border-red-700 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100">
          Delete my account
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" disabled={deleting} onClick={confirmDelete} className="border border-red-700 bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-60">
            {deleting ? "Deleting…" : "Yes, permanently delete my account"}
          </button>
          <button type="button" disabled={deleting} onClick={() => setConfirming(false)} className="border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50">
            Cancel
          </button>
        </div>
      )}
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}

export function SettingsForm({ profile }: { profile: Profile }) {
  return (
    <div className="max-w-2xl space-y-4">
      <NotificationToggles profile={profile} />
      <PasswordForm />
      <DeleteAccount />
    </div>
  );
}
