// Marketing badges that are shown on the front end. Every other marketing badge stays an internal CMS field (hidden since 2026-09-18).
//   Profit-Share Model         owner 2026-10-04: ICON V net profit-sharing model
//   Rent Out or Hotel-Managed  owner 2026-10-24: the developer says owners may let the unit themselves OR use its hotel management (Ocean Breeze Hikkaduwa, Kingdom Sigiriya)
//   Hotel Management Option    owner 2026-10-24: the developer offers hotel management; it does not say owners can let the unit themselves
export const SHOWN_MARKETING_BADGES = ["Profit-Share Model", "Rent Out or Hotel-Managed", "Hotel Management Option"] as const;

export const shownMarketingBadges = (badges: readonly string[] | undefined): string[] =>
  (badges ?? []).filter((label) => (SHOWN_MARKETING_BADGES as readonly string[]).includes(label));
