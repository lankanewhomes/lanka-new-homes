-- WhatsApp messages exchanged with developers through the Meta Cloud API (Payload collection `whatsapp-messages`,
-- src/collections/WhatsAppMessages.ts). Payload-only: written by the webhook and the dashboard, never public.
-- Created by hand (not by Payload's dev-mode push, which is off) to match what Payload expects. Idempotent.

do $$ begin
  create type payload.enum_whatsapp_messages_direction as enum ('inbound', 'outbound');
exception when duplicate_object then null; end $$;
do $$ begin
  create type payload.enum_whatsapp_messages_status as enum ('received', 'draft', 'sent', 'delivered', 'read', 'failed');
exception when duplicate_object then null; end $$;

create table if not exists payload.whatsapp_messages (
  id serial primary key,
  direction payload.enum_whatsapp_messages_direction not null,
  phone varchar not null,
  text varchar,
  message_type varchar,
  template_name varchar,
  status payload.enum_whatsapp_messages_status not null default 'received',
  error varchar,
  wa_message_id varchar,
  developer_id integer references payload.developers(id) on delete set null,
  lead_id integer references payload.leads(id) on delete set null,
  sent_at timestamptz not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists whatsapp_messages_direction_idx on payload.whatsapp_messages (direction);
create index if not exists whatsapp_messages_phone_idx on payload.whatsapp_messages (phone);
create index if not exists whatsapp_messages_status_idx on payload.whatsapp_messages (status);
create unique index if not exists whatsapp_messages_wa_message_id_idx on payload.whatsapp_messages (wa_message_id);
create index if not exists whatsapp_messages_developer_idx on payload.whatsapp_messages (developer_id);
create index if not exists whatsapp_messages_lead_idx on payload.whatsapp_messages (lead_id);
create index if not exists whatsapp_messages_sent_at_idx on payload.whatsapp_messages (sent_at);
create index if not exists whatsapp_messages_updated_at_idx on payload.whatsapp_messages (updated_at);
create index if not exists whatsapp_messages_created_at_idx on payload.whatsapp_messages (created_at);

-- Payload tracks which documents are open for editing per collection.
alter table payload.payload_locked_documents_rels add column if not exists whatsapp_messages_id integer;
create index if not exists payload_locked_documents_rels_whatsapp_messages_id_idx on payload.payload_locked_documents_rels (whatsapp_messages_id);
do $$ begin
  alter table payload.payload_locked_documents_rels
    add constraint payload_locked_documents_rels_whatsapp_messages_fk foreign key (whatsapp_messages_id) references payload.whatsapp_messages(id) on delete cascade;
exception when duplicate_object then null; end $$;
