This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Mail client (Google Workspace inbox at `/dashboard/inbox`)

A Gmail-style inbox inside the backend for the Google Workspace mailbox and its aliases (`no-reply@`, `support@`, `developers@`).
Everything goes through the Gmail API (HTTP only, so it runs on Cloudflare Workers). The mailbox is the source of truth: actions made
in the backend are applied in the mailbox first, and changes made there (new mail, read, moved, deleted, sent from your phone) are
pulled in by a sync every 5 minutes. Automated site emails still go through Resend.

- Collections (group "Mail", admin only): `mail-accounts`, `mail-folders`, `mail-messages`, `mail-sync-state`. Some field and column
  names still start with `zoho` (the first provider); they hold the mailbox, folder and message ids. Renaming them needs a data migration.
- Code: `src/lib/mail/` (provider interface, mock client, Gmail client, import/sync), `src/app/(frontend)/api/mail/*` (admin-checked routes), `src/components/mail/` (UI).
- Keyboard shortcuts: `c` compose, `r` reply, `a` reply all, `f` forward, `e` archive, `#` delete, `s` star, `j`/`k` next/previous, `/` search.

### Mock mode (no keys needed)

With `MAIL_MOCK_MODE=true` (the default) or a Google key missing, the inbox runs on realistic sample mail and shows a "Mock mode" banner.
Every action works on the sample data only. Scheduled syncs do nothing in mock mode.

### 1. Switch to live

1. In Google Cloud create a service account, and in the Workspace Admin console (Security > API controls > Domain-wide delegation) allow
   it the scope `https://mail.google.com/`.
2. Set `GOOGLE_MAIL_SA_EMAIL`, `GOOGLE_MAIL_SA_KEY`, `GOOGLE_MAIL_PRIMARY` (the real mailbox), `MAIL_SYNC_SECRET` and `MAIL_MOCK_MODE=false`
   (in `.env.local` and in the Cloudflare secrets).
3. Open `/cms/mail/settings` and press **Test connection**.

### 2. Run the first full import

Open `/cms/mail/settings` and press **Start / resume full import** (or just open `/cms/mail`; it starts the import and shows a progress bar).
Every folder of every mailbox is imported newest first, in batches of 200, saving progress per folder, so it can be stopped and resumed and never
times out. Only message metadata is imported first (the inbox is usable straight away); a message's full body is fetched when you open it and then cached.
Progress ("support@: 1,240 / 3,500 messages") is shown on the status page. The scheduled sync also continues an unfinished import.

### 3. Keep it in sync (cron)

`/api/mail/sync` must be called every 2 to 5 minutes. It accepts the header `x-mail-sync-secret: <MAIL_SYNC_SECRET>` or `Authorization: Bearer <CRON_SECRET>`.

- **Vercel:** already listed in `vercel.json` (`*/5 * * * *`); Vercel Cron sends `Authorization: Bearer $CRON_SECRET`, so set `CRON_SECRET`. (Vercel's Hobby plan only runs daily crons; use Pro or an external pinger.)
- **Cloudflare Workers:** already in `cloudflare/worker.js` and `wrangler.jsonc` (`*/5 * * * *`); the worker sends `Authorization: Bearer $CRON_SECRET`. Make sure the secret exists:
  `npx wrangler secret put CRON_SECRET` (and `MAIL_SYNC_SECRET`, the `GOOGLE_MAIL_*` keys, `MAIL_MOCK_MODE`).
- **Any other scheduler:** `curl -X POST https://www.lankanewhomes.com/api/mail/sync -H "x-mail-sync-secret: $MAIL_SYNC_SECRET"`.

The sync reads the newest 100 messages of each folder plus a rotating older window, so new mail, read/starred changes, moves and deletions made in the mailbox show up.
The mailbox wins any conflict. Rate limits (HTTP 429) are retried with backoff.

### Notes

- Replies, reply-all and forwards keep the Gmail thread, so threading and the Sent folder match the mailbox.
- Remote images in emails are blocked until you press "Show images"; bodies are sanitised and shown in a script-less sandboxed frame.
- The refresh token only ever lives in environment variables, never in the database.
