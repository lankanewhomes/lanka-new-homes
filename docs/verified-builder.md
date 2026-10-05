# Verified builder (free badge)

Added 2026-10-04. A developer earns the "Verified builder" badge by confirming an email address on its own website domain.
Separate from the paid-tier "Verified" pill (`isPaidPackageTier`), which is unchanged.

- Where: the "Verified builder" panel on the developer's /cms profile (`DeveloperVerifyPanel`). Admins can also tick `domain_verified` by hand.
- Rule: email domain must equal (or be a subdomain of) the developer's `website` domain. Free mailbox providers are rejected (`src/lib/developer-domain-verification.ts`).
- Flow: POST `/api/developers/verify-domain/request` emails a single-use link (sha-256 hashed token, 24 h expiry, 60 s resend cooldown) → `/developers/verify?token=…` shows a button → POST `/api/developers/verify-domain/confirm` sets `domain_verified`, `verified_email`, `verified_domain`, `verified_at`.
- Email: sent from `EMAIL_FROM` (no-reply@), reply-to developers@lankanewhomes.com. Outside production it goes to the test inbox only.
- Shown on the developer profile header and the listing contact card; `domainVerified`/`verifiedDomain` are synced to Supabase.
