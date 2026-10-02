// Single source of truth for the /account/* side menu (shared by the dashboard page and the sub-pages).
export const ACCOUNT_NAV_LINKS: { label: string; href: string }[] = [
  { label: "Dashboard", href: "/account" },
  { label: "Saved Properties", href: "/account/saved" },
  { label: "Saved Developments", href: "/account/developments" },
  { label: "Compare", href: "/account/compare" },
  { label: "Saved Searches & Alerts", href: "/account/alerts" },
  { label: "My Enquiries", href: "/account/enquiries" },
  { label: "Profile", href: "/account/profile" },
  { label: "Settings", href: "/account/settings" },
];
