// Draft email to the Marina Square developer asking for unit availability and listing details (owner, 2026-11-09). NOT SENT.
// Renders the branded outreach shell (src/lib/outreach-templates.ts renderPlainReplyEmail) with two tables injected, and writes an HTML + plain-text preview.
//   OUT_DIR=<folder> npx tsx scripts/render-marina-square-availability-email.ts
// Signed "The LankaNewHomes Team", never a personal name (owner, 2026-11-09). From / reply-to: developers@lankanewhomes.com (owner rule). To: Marina Square sales email, still needed (the site only publishes +94 76 305 0000).
import fs from 'node:fs'
import { renderPlainReplyEmail } from '../src/lib/outreach-templates'
const OUT = process.env.OUT_DIR
if (!OUT) throw new Error('Set OUT_DIR')
const th = 'padding:8px 10px; text-align:left; font-size:13px; background:#faf7f2; border:1px solid #e4e2db; color:#2b2b29;'
const td = 'padding:7px 10px; font-size:13px; border:1px solid #e4e2db; color:#2b2b29;'
const table = (head: string[], rows: string[][], w?: string[]) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse; width:100%; margin:0 0 18px;"><tr>${head.map((h, i) => `<th style="${th}${w?.[i] ? ` width:${w[i]};` : ''}">${h}</th>`).join('')}</tr>${rows.map((r) => `<tr>${r.map((c) => `<td style="${td}">${c}</td>`).join('')}</tr>`).join('')}</table>`
const questions = [
  'How many units are available in each of your 20 designs, and which are sold out? Our floor plans page lists them: https://www.lankanewhomes.com/projects/marina-square-uptown-colombo/floor-plans',
  'Your site mentions 21 designs but your unit pages list 20. What is the 21st?',
  'Current price list and brochure (we only have prices for 4 D/E and 4 F/G).',
  'Handover date for each tower, and which towers are still selling.',
  'Terms of the interest-free payment plans (deposit, instalments, duration).',
  'A WhatsApp number and a sales email address for buyer enquiries.',
]
const body = [
  'Dear Marina Square Sales Team,',
  'We have listed Marina Square – Uptown Colombo on LankaNewHomes and want the details to be accurate for buyers: https://www.lankanewhomes.com/projects/marina-square-uptown-colombo',
  'Could you please confirm the following?',
  '@@Q@@',
  'If anything on our listing is wrong, please tell us and we will correct it right away. Thank you for your help.',
].join('\n\n')
const { html, text } = renderPlainReplyEmail({ body, signoff: 'Kind regards,', signName: 'The LankaNewHomes Team' })
const out = html
  .replace(/<p style="[^"]*">@@Q@@<\/p>/, table(['#', 'Question'], questions.map((q, i) => [String(i + 1), q]), ['36px']))
  
const subject = 'Marina Square – Uptown Colombo: unit availability and listing details'
fs.mkdirSync(OUT, { recursive: true })
fs.writeFileSync(`${OUT}/marina-square-email-preview.html`, out)
fs.writeFileSync(`${OUT}/marina-square-email-plain-text.txt`, `From: LankaNewHomes <developers@lankanewhomes.com>\nTo: (Marina Square sales email, needed)\nSubject: ${subject}\n\n${text.replace('@@Q@@', questions.map((q, i) => `${i + 1}. ${q}`).join('\n'))}\n`)
console.log('written to', OUT)
