"use client";

import { CheckCircle2, RefreshCw } from "lucide-react";
import { useDash } from "./DashProvider";
import { StatusChip } from "./StatusChip";
import { MAILBOXES } from "../_mock/mail";

const IMPORTED: Record<string, number> = {
  "developers@lankanewhomes.com": 1284,
  "support@lankanewhomes.com": 642,
  "no-reply@lankanewhomes.com": 3910,
};

const CHECKS = ["Zoho login OK", "Mailboxes found: 3 of 3", "Cron running", "Send test passed"];

export function ConnectionStatus() {
  const { toast } = useDash();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Mail connection</h1>
        <p className="mt-1 text-sm text-muted">Status of the Zoho mailboxes synced into the dashboard inbox (preview data).</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {MAILBOXES.map((b) => (
          <div key={b.address} className="flex flex-col gap-3 rounded-xl border border-line bg-panel p-4 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2"><span className={`h-2.5 w-2.5 shrink-0 rounded-full ${b.dot}`} /><span className="truncate font-medium">{b.address}</span></div>
              <StatusChip value="active" label="Connected" />
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              <dt className="text-muted">Last sync</dt><dd>2 minutes ago</dd>
              <dt className="text-muted">Imported</dt><dd className="tabular-nums">{IMPORTED[b.address].toLocaleString("en-LK")} messages</dd>
              <dt className="text-muted">Sync mode</dt><dd>Two-way sync every 5 minutes</dd>
            </dl>
            <button type="button" aria-label={`Sync ${b.address} now`} onClick={() => toast("Preview only", "info")} className="mt-1 flex items-center justify-center gap-2 rounded-lg border border-line bg-subtle px-3 py-2 text-sm text-muted"><RefreshCw size={14} />Sync now</button>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-line bg-panel p-4 shadow-card">
        <h2 className="mb-3 font-medium">Checks</h2>
        <ul className="flex flex-col gap-2 text-sm">
          {CHECKS.map((c) => <li key={c} className="flex items-center gap-2"><CheckCircle2 size={16} className="text-ok" />{c}</li>)}
        </ul>
      </div>
    </div>
  );
}
