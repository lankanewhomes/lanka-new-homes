# List rows going missing (2026-10-15)

On 2026-10-15 floor plans, galleries, amenities, key features and nearby lists were found empty in Payload on 9 projects
(Pentara 136, Canterbury Lexus 145, Villa Senehasa 44, and the galleries of Vauxhall, Prime Evoke, Ultima, Ocean Breeze, Ru
Residencies, Platinum 10, MIRA) while the Supabase copy still had them. They were restored from that copy (or the import
scripts). Cause not proven. Suspects: (1) `PAYLOAD_DB_PUSH=true` dev boots that day; (2) the developer-plan hook updating all of
a developer's projects at once inside one transaction (now one at a time, `sync-developer-plan.ts`).

After any bulk script, schema push or developer save run `NODE_ENV=production npx tsx scripts/audit-array-loss.ts`. The
activity log now writes "<list> EMPTIED (was N)" whenever a save takes a list from filled to empty.
