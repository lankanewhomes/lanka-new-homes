// Draft email to the Marina Square developer asking for unit availability and listing details (owner, 2026-11-09). NOT SENT.
// Renders the branded outreach shell (src/lib/outreach-templates.ts renderPlainReplyEmail) with two tables injected, and writes an HTML + plain-text preview.
//   OUT_DIR=<folder> npx tsx scripts/render-marina-square-availability-email.ts
// From / reply-to: developers@lankanewhomes.com (owner rule). To: Marina Square sales email, still needed (the site only publishes +94 76 305 0000).
import fs from 'node:fs'
import { renderPlainReplyEmail } from '../src/lib/outreach-templates'
const OUT = process.env.OUT_DIR
if (!OUT) throw new Error('Set OUT_DIR')
const th = 'padding:8px 10px; text-align:left; font-size:13px; background:#faf7f2; border:1px solid #e4e2db; color:#2b2b29;'
const td = 'padding:7px 10px; font-size:13px; border:1px solid #e4e2db; color:#2b2b29;'
const table = (head: string[], rows: string[][], w?: string[]) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse; width:100%; margin:0 0 18px;"><tr>${head.map((h, i) => `<th style="${th}${w?.[i] ? ` width:${w[i]};` : ''}">${h}</th>`).join('')}</tr>${rows.map((r) => `<tr>${r.map((c) => `<td style="${td}">${c}</td>`).join('')}</tr>`).join('')}</table>`
const questions = [
  'How many units are currently available in each design below, and which designs are sold out?',
  'Your site mentions 21 designs, but your unit pages list 20. What is the 21st design?',
  'Current prices for each available design (we only have prices for 4 D/E and 4 F/G).',
  'Handover date for each tower, and which towers are still selling.',
  'Payment plan terms for the interest-free payment plans (deposit, instalments, duration).',
  'Your WhatsApp number for buyer enquiries (we only have +94 76 305 0000).',
  'A sales email address (we do not have one on file).',
  'An up-to-date brochure and price list.',
]
// Design, bedrooms, sq ft, floors / towers: the developer's own condo-type pages (see docs/listings/marina-square-colombo-15.md).
const designs: [string, string, string, string][] = [
  ['4 D/E', '4', '2,104', '35–36, D, J, P'], ['4 F/G', '4', '2,047', '35–36, D, J, P'], ['3 P-TR/Q-TR duplex', '3', '1,822', '6–7, D, J, P'], ['3 A', '3', '1,292', '5–31, B, C'],
  ['3 B', '3', '1,107', '5–31, B, C'], ['3 C', '3', '1,313', '5–31, B, C'], ['3 F/G/H/J', '3', '1,074', '11–34, D, J, P'], ['3 R', '3', '1,197', '5–31, B, C'],
  ['2.5 P-TR/Q-TR duplex', '2.5', '1,824', '6–7, D, J, P'], ['2 P-TR/Q-TR duplex', '2', '1,708', '6–7, D, J, P'], ['2 L/M', '2', '1,074', '29–31, J'], ['2 F/G', '2', '961', '11–34, D, J, P'],
  ['2 H/J', '2', '904', '11–34, D, J, P'], ['2 S', '2', '846', '5–31, B, C'], ['2 T', '2', '885', '5–31, B, C'], ['2 A/B/C/D', '2', '736', '7–10, D, J, P'],
  ['1.5 A/B/C/D', '1.5', '741', '7–10, D, J, P'], ['1 E', '1', '727', '10 and 21, B, C'], ['1 A/B', '1', '625', '8–10, D, J, P'], ['1 C/D', '1', '568', '7–10, D, J, P'],
]
const body = [
  'Dear Marina Square Sales Team,',
  'I am writing from LankaNewHomes (www.lankanewhomes.com). We have listed Marina Square – Uptown Colombo on our site and want the listing to be accurate for buyers: https://www.lankanewhomes.com/projects/marina-square-uptown-colombo',
  'Could you please confirm the following?',
  '@@Q@@',
  'These are the designs on our listing. Please reply with the number of units available in each:',
  '@@D@@',
  'If any detail on our listing is wrong, please tell us and we will correct it right away. Thank you for your help.',
].join('\n\n')
const { html, text } = renderPlainReplyEmail({ body, signoff: 'Kind regards,', signName: 'Rupan' })
const out = html
  .replace(/<p style="[^"]*">@@Q@@<\/p>/, table(['#', 'Question'], questions.map((q, i) => [String(i + 1), q]), ['36px']))
  .replace(/<p style="[^"]*">@@D@@<\/p>/, table(['Design', 'Bedrooms', 'Size (sq ft)', 'Floors / towers', 'Units available'], designs.map((d) => [...d, '&nbsp;'])))
const subject = 'Marina Square – Uptown Colombo: unit availability and listing details'
fs.mkdirSync(OUT, { recursive: true })
fs.writeFileSync(`${OUT}/marina-square-email-preview.html`, out)
fs.writeFileSync(`${OUT}/marina-square-email-plain-text.txt`, `From: LankaNewHomes <developers@lankanewhomes.com>\nTo: (Marina Square sales email, needed)\nSubject: ${subject}\n\n${text.replace('@@Q@@', questions.map((q, i) => `${i + 1}. ${q}`).join('\n')).replace('@@D@@', designs.map((d) => `${d[0]} | ${d[1]} bed | ${d[2]} sq ft | ${d[3]} | units available: ____`).join('\n'))}\n`)
console.log('written to', OUT)
