-- Verification workflow — developer approval + per-listing verified badge.
-- Same status-enum pattern already used on hero_ads (pending/approved/
-- rejected/archived).

alter table developers add column if not exists verification_status text not null default 'pending'
  check (verification_status in ('pending', 'approved', 'rejected', 'changes_requested'));

alter table projects add column if not exists is_verified boolean not null default false;

create index if not exists idx_developers_verification_status on developers (verification_status);

-- NOTE: these are indexed columns, not part of the `data` jsonb blob.
-- rowToProject/rowToDeveloper (src/lib/project-store.ts, developer-store.ts)
-- only read from `data`, so the app won't see these values until the TS
-- types gain matching fields AND projectToRow/developerToRow are updated to
-- write them — deliberately not done in this pass (schema/types only).
