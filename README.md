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

## CMS mail client (Zoho Mail inbox at `/cms/mail`)

A Gmail-style inbox inside the CMS for the three Zoho mailboxes (`no-reply@`, `support@`, `developers@`). Everything goes through the
Zoho Mail REST API (HTTP only, so it runs on Vercel and Cloudflare Workers). Zoho is the source of truth: actions made in the CMS are
applied in Zoho first, and changes made in Zoho (new mail, read, moved, deleted, sent from your phone) are pulled into the CMS by a
sync every 5 minutes. Resend is untouched: automated emails still go through Resend. Mail written in the inbox goes through Zoho, so it
appears in Zoho's Sent folder.

- Inbox: `/cms/mail` (admin only, linked in the CMS sidebar under "Mail"). Connection status and import progress: `/cms/mail/settings`.
- Collections (group "Mail", admin only): `mail-accounts`, `mail-folders`, `mail-messages`, `mail-sync-state`.
- Code: `src/lib/mail/` (provider interface, mock client, Zoho client, import/sync), `src/app/(frontend)/api/mail/*` (admin-checked routes), `src/components/mail/` (UI).
- Keyboard shortcuts: `c` compose, `r` reply, `a` reply all, `f` forward, `e` archive, `#` delete, `s` star, `j`/`k` next/previous, `/` search, `u` back to the list.

### Mock mode (no Zoho credentials needed)

With `MAIL_MOCK_MODE=true` (the default) or any Zoho credential missing, the inbox runs on realistic sample mail for the three mailboxes and
shows a "Mock mode — not connected to Zoho" banner. Every action works on the sample data only. Copy `.env.example` to `.env.local` to start.
Scheduled syncs do nothing in mock mode.

### 1. Create the Zoho Self Client

1. Sign in at <https://api-console.zoho.com> (use the console for your data centre, e.g. `api-console.zoho.eu`, `api-console.zoho.in`) with the
   Zoho user that owns the mailboxes.
2. **Add Client** → **Self Client** → Create. Copy the **Client ID** and **Client Secret** into `ZOHO_CLIENT_ID` / `ZOHO_CLIENT_SECRET`.
3. Open the **Generate Code** tab. Scope (one line, comma separated):

   ```
   ZohoMail.accounts.READ,ZohoMail.folders.READ,ZohoMail.folders.UPDATE,ZohoMail.messages.ALL
   ```

   `ZohoMail.messages.ALL` covers read, send, update (read/unread, star, move, archive) and delete. If a mailbox is not found, also add
   `ZohoMail.organization.accounts.READ`. Time duration: 10 minutes. Add a description and press **Create**, then copy the code.
4. Exchange the code for a refresh token within those 10 minutes (use your data centre's accounts URL):

   ```bash
   curl -X POST "https://accounts.zoho.com/oauth/v2/token" \
     -d "grant_type=authorization_code" -d "client_id=YOUR_CLIENT_ID" -d "client_secret=YOUR_CLIENT_SECRET" -d "code=THE_CODE"
   ```

   Copy `refresh_token` from the answer into `ZOHO_REFRESH_TOKEN`. (It does not expire; the app mints short-lived access tokens itself.)
5. Set `ZOHO_ACCOUNTS_URL` and `ZOHO_MAIL_API_URL` for your data centre (examples are in `.env.example`; Canada is `https://accounts.zohocloud.ca` and
   `https://mail.zohocloud.ca/api`).

**One set of keys per mailbox.** A Zoho login only sees its own mailbox. If `no-reply@`, `support@` and `developers@` are separate Zoho users, repeat steps 1 to 4
while signed in to each of them, and set the keys with a suffix: `ZOHO_CLIENT_ID_SUPPORT`, `ZOHO_CLIENT_SECRET_SUPPORT`, `ZOHO_REFRESH_TOKEN_SUPPORT`, and the same
for `_DEVELOPERS` and `_NOREPLY`. A mailbox without its own keys uses the shared `ZOHO_*` ones (right when the addresses are aliases of one Zoho account). The
status page lists which mailboxes were found.

### 2. Switch to live

1. Fill in the `ZOHO_*` keys and the three `MAIL_ACCOUNT_*` addresses, set `MAIL_SYNC_SECRET` to a long random string, and set `MAIL_MOCK_MODE=false`
   (in `.env.local`, and in Vercel / Cloudflare environment variables).
2. Open `/cms/mail/settings` → **Test connection**. It should list the three mailboxes with their Zoho `accountId`s.
3. Switching modes clears the cached sample mail automatically the first time a mailbox is synced from Zoho.

### 3. Run the first full import

Open `/cms/mail/settings` and press **Start / resume full import** (or just open `/cms/mail`; it starts the import and shows a progress bar).
Every folder of every mailbox is imported newest first, in batches of 200, saving progress per folder, so it can be stopped and resumed and never
times out. Only message metadata is imported first (the inbox is usable straight away); a message's full body is fetched when you open it and then cached.
Progress ("support@: 1,240 / 3,500 messages") is shown on the status page. The scheduled sync also continues an unfinished import.

### 4. Keep it in sync (cron)

`/api/mail/sync` must be called every 2 to 5 minutes. It accepts the header `x-mail-sync-secret: <MAIL_SYNC_SECRET>` or `Authorization: Bearer <CRON_SECRET>`.

- **Vercel:** already listed in `vercel.json` (`*/5 * * * *`); Vercel Cron sends `Authorization: Bearer $CRON_SECRET`, so set `CRON_SECRET`. (Vercel's Hobby plan only runs daily crons; use Pro or an external pinger.)
- **Cloudflare Workers:** already in `cloudflare/worker.js` and `wrangler.jsonc` (`*/5 * * * *`); the worker sends `Authorization: Bearer $CRON_SECRET`. Make sure the secret exists:
  `npx wrangler secret put CRON_SECRET` (and `MAIL_SYNC_SECRET`, the `ZOHO_*` keys, `MAIL_MOCK_MODE`).
- **Any other scheduler:** `curl -X POST https://www.lankanewhomes.com/api/mail/sync -H "x-mail-sync-secret: $MAIL_SYNC_SECRET"`.
- **Instant sync (optional):** in Zoho Mail → Settings → Integrations → Developer Space → Outgoing Webhooks, add a webhook for new incoming mail that POSTs to
  `https://www.lankanewhomes.com/api/mail/webhook?secret=<MAIL_SYNC_SECRET>`.

The sync reads the newest 100 messages of each folder plus a rotating older window, so new mail, read/starred changes, moves and deletions made in Zoho show up.
Zoho wins any conflict. Rate limits (HTTP 429) are retried with backoff.

### Notes

- Replies, reply-all and forwards use Zoho's reply endpoints, so threading and the Sent folder match Zoho.
- Remote images in emails are blocked until you press "Show images"; bodies are sanitised and shown in a script-less sandboxed frame.
- If one of the update actions (star, move, archive, spam) is rejected by Zoho, the action names live in one table (`MODES` in `src/lib/mail/zoho-client.ts`).
- The refresh token only ever lives in environment variables, never in the database.
