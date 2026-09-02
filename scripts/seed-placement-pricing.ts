// Seeds made-up placeholder prices for every paid placement type, so the
// rate card has real numbers to look at and adjust rather than starting
// empty. Run with: npx tsx scripts/seed-placement-pricing.ts (safe to
// re-run — upserts on payment_type+featured_page+tier_name).
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })

const { getPayload } = await import('payload')
const payloadConfig = (await import('../payload.config')).default

type Row = {
  payment_type: string
  featured_page?: string
  tier_name?: string
  price: number
  currency: 'LKR' | 'USD'
  duration_days?: number
  description?: string
}

const rows: Row[] = [
  { payment_type: 'featured_listing', featured_page: 'sitewide', price: 25000, currency: 'LKR', duration_days: 30, description: 'Homepage-wide featured placement.' },
  { payment_type: 'featured_listing', featured_page: 'colombo-luxury', price: 18000, currency: 'LKR', duration_days: 30 },
  { payment_type: 'featured_listing', featured_page: 'colombo', price: 15000, currency: 'LKR', duration_days: 30 },
  { payment_type: 'featured_listing', featured_page: 'beachfront', price: 12000, currency: 'LKR', duration_days: 30 },
  { payment_type: 'featured_listing', featured_page: 'branded-residences', price: 12000, currency: 'LKR', duration_days: 30 },
  { payment_type: 'featured_listing', featured_page: 'villas', price: 10000, currency: 'LKR', duration_days: 30 },
  { payment_type: 'featured_listing', featured_page: 'pre-construction', price: 10000, currency: 'LKR', duration_days: 30 },
  { payment_type: 'featured_listing', featured_page: 'serviced-apartments', price: 10000, currency: 'LKR', duration_days: 30 },
  { payment_type: 'featured_listing', featured_page: 'port-city-colombo', price: 12000, currency: 'LKR', duration_days: 30 },
  { payment_type: 'featured_search', price: 20000, currency: 'LKR', duration_days: 30, description: 'Boosted ranking within general search results.' },
  { payment_type: 'hero_slide', price: 50000, currency: 'LKR', duration_days: 14, description: 'Homepage rotating hero carousel slot.' },
  { payment_type: 'hero_image', price: 30000, currency: 'LKR', duration_days: 30 },
  { payment_type: 'banner_ad', price: 15000, currency: 'LKR', duration_days: 30 },
  { payment_type: 'top_of_category', price: 12000, currency: 'LKR', duration_days: 30 },
  { payment_type: 'subscription', tier_name: 'Professional', price: 9999, currency: 'LKR', duration_days: 30, description: 'Up to 5 active listings, basic analytics.' },
  { payment_type: 'subscription', tier_name: 'Premium', price: 24999, currency: 'LKR', duration_days: 30, description: 'Up to 20 active listings, full analytics, priority support.' },
  { payment_type: 'subscription', tier_name: 'Enterprise', price: 49999, currency: 'LKR', duration_days: 30, description: 'Unlimited listings, dedicated account manager.' },
  { payment_type: 'lead_package', tier_name: '10 Leads', price: 15000, currency: 'LKR' },
  { payment_type: 'lead_package', tier_name: '50 Leads', price: 60000, currency: 'LKR' },
  { payment_type: 'lead_package', tier_name: '100 Leads', price: 100000, currency: 'LKR' },
]

async function main() {
  const payload = await getPayload({ config: payloadConfig })
  let created = 0
  let updated = 0
  for (const row of rows) {
    const existing = await payload.find({
      collection: 'placement-pricing',
      where: {
        and: [
          { payment_type: { equals: row.payment_type } },
          { featured_page: { equals: row.featured_page ?? null } },
          { tier_name: { equals: row.tier_name ?? null } },
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (existing.docs[0]) {
      await payload.update({ collection: 'placement-pricing', id: existing.docs[0].id, data: row as any, overrideAccess: true })
      updated += 1
    } else {
      await payload.create({ collection: 'placement-pricing', data: row as any, overrideAccess: true })
      created += 1
    }
  }
  console.log(`Placement pricing seeded: ${created} created, ${updated} updated.`)
  process.exit(0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
