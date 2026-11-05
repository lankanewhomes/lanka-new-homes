-- keyword_volumes held Sri Lanka only; it now holds one row per keyword AND country (ISO 3166 alpha-2). Existing rows become 'LK'. Idempotent. Nothing is deleted.
alter table public.keyword_volumes add column if not exists country text not null default 'LK';
do $$
begin
  if exists (select 1 from pg_constraint where conrelid = 'public.keyword_volumes'::regclass and conname = 'keyword_volumes_pkey'
             and pg_get_constraintdef(oid) = 'PRIMARY KEY (keyword)') then
    alter table public.keyword_volumes drop constraint keyword_volumes_pkey;
    alter table public.keyword_volumes add primary key (keyword, country);
  end if;
end $$;
