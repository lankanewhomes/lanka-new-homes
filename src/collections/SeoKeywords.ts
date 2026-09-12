import type { CollectionConfig } from 'payload'
import { adminOnly, hiddenUnlessAdmin } from './access'

// Keyword research data (from SEO_KEYWORDS.md and competitor exports like
// Ubersuggest/Ahrefs pulls of propertyguide.lk) — kept here, not just in the
// markdown file, so volume/position/difficulty numbers aren't lost and can
// be queried/sorted in the CMS. Payload-only, no Supabase mirror (same as
// leads/analytics/social-posts) — internal research data, never read by the
// public site.
export const SEO_KEYWORD_CATEGORIES = [
  { label: 'Primary', value: 'primary' },
  { label: 'Land', value: 'land' },
  { label: 'House & Apartment', value: 'house-apartment' },
  { label: 'New Development', value: 'new-development' },
  { label: 'Other / Unqualified', value: 'other' },
] as const

export const SeoKeywords: CollectionConfig = {
  slug: 'seo-keywords',
  admin: {
    group: 'Marketing',
    useAsTitle: 'keyword',
    defaultColumns: ['keyword', 'category', 'volume', 'searchDifficulty', 'position', 'targetPage'],
    hidden: hiddenUnlessAdmin,
    description: 'Keyword research — volumes/positions from tools like Ubersuggest, mapped to the page on our site that should target them.',
  },
  access: { read: adminOnly, create: adminOnly, update: adminOnly, delete: adminOnly },
  fields: [
    { name: 'keyword', type: 'text', required: true, index: true },
    { name: 'category', type: 'select', options: [...SEO_KEYWORD_CATEGORIES], defaultValue: 'primary' },
    { name: 'searchIntent', type: 'text', admin: { description: 'e.g. "transactional, commercial" — as reported by the research tool.' } },
    { name: 'volume', type: 'number', admin: { description: 'Estimated monthly search volume.' } },
    { name: 'searchDifficulty', type: 'number', admin: { description: 'SEO difficulty score (0-100) as reported by the tool.' } },
    { name: 'position', type: 'number', admin: { description: 'Ranking position of the source URL below for this keyword.' } },
    { name: 'estimatedVisits', type: 'number' },
    { name: 'cpc', type: 'number', admin: { description: 'Cost per click (USD).' } },
    { name: 'trafficValueUsd', type: 'number' },
    { name: 'sourceUrl', type: 'text', admin: { description: 'The competitor/reference URL this data was pulled for.' } },
    { name: 'sourceTool', type: 'text', admin: { description: 'e.g. Ubersuggest, Ahrefs, manual web research.' } },
    { name: 'targetPage', type: 'text', admin: { description: 'Path on our site this keyword should target, e.g. /projects/colombo — mirrors docs/seo-strategy.md\'s keyword-to-page mapping.' } },
    { name: 'notes', type: 'textarea' },
    { name: 'dateAdded', type: 'date', defaultValue: () => new Date().toISOString(), admin: { date: { pickerAppearance: 'dayOnly' } } },
  ],
}
