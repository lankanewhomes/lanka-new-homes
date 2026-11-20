-- Values for an outbound WhatsApp template's {{1}}, {{2}}… (Payload field `templateParams` on whatsapp-messages). Idempotent.
alter table payload.whatsapp_messages add column if not exists template_params jsonb;
