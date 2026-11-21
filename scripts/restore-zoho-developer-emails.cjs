/* eslint-disable */
// Puts the emails with developers that were typed by hand in Zoho Mail (read from the mail backup taken 2026-11-17, before the move to
// Google Workspace) into the Outreach log, one row per email, so each developer's page lists them. Owner, 2026-11-18: "for each developer
// I want to see what email I have sent".
//   node scripts/restore-zoho-developer-emails.cjs "<backup folder>"            (dry run, lists what it would add)
//   node scripts/restore-zoho-developer-emails.cjs "<backup folder>" --apply    (writes; safe to run twice, it skips rows already there)
// Matching: the outside address against the developer's contact / lead-alert email, then their website domain, then the company name in
// the subject. Zoho notices, Cliq, test mails and anything that matches no developer are skipped.
const path = require('path')
const fs = require('fs')
const { Pool } = require('pg')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const dir = process.argv[2]
const apply = process.argv.includes('--apply')
if (!dir) throw new Error('Give the backup folder as the first argument.')

const host = (u) => { try { return new URL(/^https?:/.test(u) ? u : 'https://' + u).hostname.replace(/^www\./, '').toLowerCase() } catch { return '' } }
const dom = (e) => (e || '').split('@')[1]?.toLowerCase() || ''
const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const OWN = /lankanewhomes\.com$/i

;(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URI, ssl: { rejectUnauthorized: false } })
  const devs = (await pool.query('select id, name, contact_email, website, lead_alerts_email from payload.developers')).rows
  const msgs = JSON.parse(fs.readFileSync(path.join(dir, 'mail_messages.json'), 'utf8'))
  const folders = Object.fromEntries(JSON.parse(fs.readFileSync(path.join(dir, 'mail_folders.json'), 'utf8')).map((f) => [f.id, f]))
  let added = 0, skipped = 0, unmatched = 0
  for (const m of msgs.sort((a, b) => String(a.received_at).localeCompare(String(b.received_at)))) {
    const ext = [m.from_email, ...(m.to_addresses || []).map((x) => x.email)].filter((e) => e && !OWN.test(e) && !/zoho|gmail\.com$/i.test(e))
    const dev = (() => {
      for (const e of ext) {
        const hit = devs.find((d) => [d.contact_email, d.lead_alerts_email].some((x) => x && x.toLowerCase() === e.toLowerCase())) ||
          devs.find((d) => host(d.website) && dom(e) && (host(d.website) === dom(e) || host(d.website).endsWith('.' + dom(e))))
        if (hit) return { dev: hit, email: e }
      }
      const s = norm(m.subject)
      const hit = devs.find((d) => norm(d.name).length > 5 && s.includes(norm(d.name)))
      return hit ? { dev: hit, email: ext[0] || hit.contact_email } : null
    })()
    if (!dev || !ext.length) { unmatched++; continue }
    if (folders[m.folder_id]?.type === 'trash' && !/lankanewhomes/i.test(m.subject || '')) { /* trashed mail to a developer is still a real email */ }
    const incoming = !OWN.test(m.from_email || '')
    const name = (incoming ? m.from_name : (m.to_addresses || []).find((x) => x.email === dev.email)?.name) || dev.dev.name
    const recipient = `${name} (${dev.email})`
    const subject = m.subject || '(no subject)'
    const sentAt = new Date(m.received_at).toISOString()
    const exists = (await pool.query('select 1 from payload.outreach where developer_id = $1 and subject = $2 and sent_at = $3', [dev.dev.id, subject, sentAt])).rowCount
    if (exists) { skipped++; continue }
    console.log(`${apply ? 'ADD ' : 'would add '} ${sentAt.slice(0, 10)} ${incoming ? 'REPLY FROM' : 'SENT TO   '} ${dev.dev.name} <${dev.email}> | ${subject.slice(0, 60)}`)
    if (apply) {
      await pool.query(
        `insert into payload.outreach (developer_id, developer_name, recipient, subject, sent_at, channel, status, to_email, from_address, notes, sent_html, click_count, updated_at, created_at)
         values ($1,$2,$3,$4,$5,'zoho',$6,$7,'developers@lankanewhomes.com',$8,$9,0,now(),now())`,
        [dev.dev.id, dev.dev.name, recipient, subject, sentAt, incoming ? 'replied' : 'sent', dev.email,
         incoming ? 'Received from the developer (Zoho Mail, restored from the 2026-11-17 backup).' : 'Typed by hand in Zoho Mail (restored from the 2026-11-17 backup).', m.html_body || null],
      )
    }
    added++
  }
  console.log(`\n${apply ? 'Added' : 'Would add'} ${added}, already there ${skipped}, not a developer email ${unmatched}.`)
  await pool.end()
})().catch((e) => { console.error(e); process.exit(1) })
