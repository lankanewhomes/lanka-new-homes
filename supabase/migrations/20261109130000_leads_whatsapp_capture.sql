-- WhatsApp lead capture (owner, 2026-11-09): a buyer who taps WhatsApp first leaves a name, number and enquiry, then WhatsApp opens.
-- The lead is stored with source "whatsapp"; whatsapp_continued_at records that the buyer went on to WhatsApp.
alter type payload.enum_leads_source add value if not exists 'whatsapp';
alter table payload.leads add column if not exists whatsapp_continued_at timestamptz;
alter table public.leads add column if not exists whatsapp_continued_at timestamptz;
-- A buyer may leave only a name and number (short form, WhatsApp window): the Payload lead needs no email.
alter table payload.leads alter column email drop not null;
