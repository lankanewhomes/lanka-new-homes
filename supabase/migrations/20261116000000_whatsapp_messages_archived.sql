-- Archive flag for the WhatsApp inbox (Payload field `archived` on whatsapp-messages). Idempotent.
alter table payload.whatsapp_messages add column if not exists archived boolean default false;
