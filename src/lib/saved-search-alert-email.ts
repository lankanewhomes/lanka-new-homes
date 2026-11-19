import { emailShell, emailHero, emailButton, emailListingCard, emailSectionLabel, emailTeamSignoff } from "./email-layout"
// Branded HTML for the weekly saved-search alert email — same visual style
// as follower-digest-email.ts/lead-alert-email.ts. Content (which listings
// matched, which are the Featured placements) is decided in
// src/lib/saved-search-alerts.ts; this file only renders it.

export type SavedSearchAlertListing = { slug: string; name: string; city: string; startingPriceLkr: number }
export type SavedSearchAlertFeaturedListing = { slug: string; name: string; city: string; isPremium: boolean }

export type SavedSearchAlertGroup = {
  searchName: string
  matches: SavedSearchAlertListing[]
  featured: SavedSearchAlertFeaturedListing[]
}

export type SavedSearchAlertEmailInput = {
  buyerName: string | null
  groups: SavedSearchAlertGroup[]
  serverURL: string
  accountUrl: string
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

function formatLkrShort(amount: number): string {
  if (!(amount > 0)) return "Contact for pricing"
  return `Rs. ${amount.toLocaleString("en-LK")}`
}

export function renderSavedSearchAlertEmailHTML(input: SavedSearchAlertEmailInput): string {
  const greetingName = input.buyerName ? escapeHtml(input.buyerName) : "there"
  // Featured placements are labelled "Sponsored" (not "Featured"): next to a buyer's own real matches that reads more honestly (owner build note 2026-09-24, item 9).
  const searchBlocks = input.groups
    .map((group) =>
      [
        emailSectionLabel(escapeHtml(group.searchName)),
        ...group.matches.map((listing) => emailListingCard({ name: escapeHtml(listing.name), href: `${input.serverURL}/projects/${listing.slug}`, meta: `${escapeHtml(listing.city)} &middot; ${escapeHtml(formatLkrShort(listing.startingPriceLkr))}` })),
        ...group.featured.map((listing) => emailListingCard({ name: escapeHtml(listing.name), href: `${input.serverURL}/projects/${listing.slug}`, meta: escapeHtml(listing.city), sponsored: true })),
      ].join("\n"),
    )
    .join("\n")
  const body = [
    emailHero(`Hi ${greetingName}, new listings match your search`, 'Based on the saved searches in your account'),
    searchBlocks,
    emailButton('Manage your saved searches', input.accountUrl),
    emailTeamSignoff(),
  ].join('\n')
  return emailShell({ preheader: 'New listings match your saved search on LankaNewHomes.', title: 'New listings matching your saved search', body, footerNote: `You're getting this because email notifications are on for a saved search. Turn them off any time from ${escapeHtml(input.accountUrl)}.` })
}
