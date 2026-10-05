# Verified Developer (free badge)

User-facing name: **Verified Developer**. Internally it is still called "verified builder" (this filename, `domain_verified`,
`verified_domain`, `.badge-verified`) so nothing that references those breaks. Copy lives in `src/lib/developer-badges.ts`.
Added 2026-10-04, renamed 2026-10-05.

A developer earns it by confirming an email address on its own company website domain. It is free, and it never depends on,
grants, or is granted by a paid package.

## Badge display rules

| Verified | Paid tier (Featured, Featured Plus, Developer Pro, Campaign) | Shown |
|---|---|---|
| no | no | nothing |
| yes | no | ✓ Verified Developer |
| no | yes | ★ Featured |
| yes | yes | ✓ Verified Developer · ★ Featured |

- Tooltips: Verified Developer = "Company identity confirmed via a company-domain email."; Featured = "Promoted listing".
- The paid pill never uses the word "Verified". Shown on: developer profile header, listing contact card, listing hero pills (project pages and floor-plan pages). Land listings show Verified Developer only (no packages on land yet).
- The hero already has its own Featured / Premium pill for `isFeatured` / Developer Pro / Campaign projects, so the extra "★ Featured" pill is only added when that pill isn't there.

## How it is earned

- Where: the "Verified Developer" panel on the developer's /cms profile (`DeveloperVerifyPanel`). Admins can also tick `domain_verified` by hand.
- Rule: the email domain must equal, or be a subdomain of, the developer's `website` domain (sales.company.lk works for company.lk). Free mailbox providers are rejected (`src/lib/developer-domain-verification.ts`).
- Flow: POST `/api/developers/verify-domain/request` emails a single-use link (sha-256 hashed token, 24 h expiry, 60 s resend cooldown) → `/developers/verify?token=…` shows a button → POST `/api/developers/verify-domain/confirm` sets `domain_verified`, `verified_email`, `verified_domain`, `verified_at`.
- Email: sent from `EMAIL_FROM` (no-reply@), reply-to developers@lankanewhomes.com. Outside production it goes to the test inbox only.
- `domainVerified` / `verifiedDomain` are synced to Supabase.

## Revocation

If the developer changes the company website to a different domain (and the confirmed email's domain no longer fits the new
one), the Developers `beforeChange` hook clears `domain_verified` and the verified_* fields. The /cms panel then shows the
verify form again, so they re-verify with an email on the new domain.

## Automatic verification (2026-10-05)

A developer account can only log in after confirming its email. On every developer login, `autoVerifyDeveloperOnLogin`
(`src/collections/hooks/auto-verify-developer.ts`) checks the linked company: if the account email is on the company's website
domain (or an admin-approved extra domain), `domain_verified` is switched on, so no separate confirmation link is needed.
Signing up with the email we already hold for an unclaimed company links the account to that page (Users `afterChange`).
The invite email (`src/lib/developer-invite-email.ts`) tells developers whose email qualifies to register with it, confirm
the email, and log in once; others get the manual steps.
