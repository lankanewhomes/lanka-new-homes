/* eslint-disable @typescript-eslint/no-explicit-any -- one-off update script */
// Courtyard Thalawathugoda (project 25): owner 2026-11-13 "put 15M for down payment, it is an offer until 31 December 2026".
// The Down Payment field now shows the offer; the standard 25% plan is kept as a payment line so no information is lost.
//   NODE_ENV=production npx tsx scripts/update-courtyard-thalawathugoda-downpayment.ts
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const payload: any = await getPayload({ config: cfg })

const p: any = await payload.findByID({ collection: 'projects', id: 25, depth: 0, overrideAccess: true })
if (p.slug !== 'courtyard-by-prime-samagi-mawatha-thalawathugoda') throw new Error('unexpected project')
if (String(p.downPayment).includes('15')) { console.log('already updated'); process.exit(0) }
const standard = `Standard plan (outside the offer): ${p.downPayment} down payment`
const items = [...(p.paymentPlanItems ?? [])]
if (!items.includes(standard)) items.push(standard)
await payload.update({ collection: 'projects', id: 25, data: { downPayment: 'LKR 15 million (special offer until 31 December 2026)', paymentPlanItems: items }, overrideAccess: true })
const a: any = await payload.findByID({ collection: 'projects', id: 25, depth: 0, overrideAccess: true })
console.log('down', a.downPayment, '| items', a.paymentPlanItems)
process.exit(0)
