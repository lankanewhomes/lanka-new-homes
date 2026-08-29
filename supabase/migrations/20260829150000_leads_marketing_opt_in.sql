-- "Yes, keep me posted on new launches..." checkbox on the inquiry form
-- variant of RequestInfoDialog (src/components/marketplace/components.tsx).

alter table leads add column if not exists marketing_opt_in boolean not null default false;
