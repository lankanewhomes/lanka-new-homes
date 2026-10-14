import { Building, Building2, BarChart3, CreditCard, GalleryHorizontal, Handshake, HardHat, Heart, Image as ImageIcon, LayoutDashboard, ListChecks, Mail, MapPin, MapPinned, Megaphone, MessageCircle, Newspaper, Package, Receipt, Ruler, Search, Settings, Share2, Sofa, Star, Tag, UserCog, Users, Inbox, type LucideIcon } from "lucide-react";
import { schemaIndex } from "../_mock/schema-index";
import type { Role } from "../_mock/types";

export const ICONS: Record<string, LucideIcon> = {
  projects: Building2, lands: MapPin, "listing-todos": ListChecks, developers: Building, "construction-companies": HardHat, "marketing-companies": Megaphone,
  "sales-companies": Handshake, architects: Ruler, "interior-designers": Sofa, leads: MessageCircle, "saved-listings": Heart, reviews: Star, articles: Newspaper,
  "hero-slides": GalleryHorizontal, neighborhoods: MapPinned, media: ImageIcon, "social-posts": Share2, "social-assets": GalleryHorizontal, "seo-keywords": Search,
  "placement-pricing": Tag, mail: Mail, "mail-settings": Settings, "mail-accounts": Users, "billing-overview": BarChart3, "my-billing": CreditCard, subscriptions: CreditCard,
  payments: Receipt, analytics: BarChart3, users: Users, "team-members": UserCog, "site-settings": Settings, "lead-alert-settings": Settings, overview: LayoutDashboard,
  package: Package, inbox: Inbox,
};
export const iconFor = (slug: string): LucideIcon => ICONS[slug] ?? LayoutDashboard;

export type SideItem = { key: string; label: string; href: string; icon: LucideIcon; badge?: number };
export type SideSection = { label: string; items: SideItem[] };

const VIEW_HREF: Record<string, string> = { mail: "/dashboard/inbox", "mail-settings": "/dashboard/inbox/connection", "billing-overview": "/dashboard/billing", "my-billing": "/dashboard/billing" };

/** Collections that exist in Payload but are not in the /cms sidebar map. They get an "Other" group so nothing is missing. */
const OTHER = ["addon-requests", "plan-waitlist", "outreach", "mail-folders", "mail-messages", "mail-sync-state"];

export function buildSidebar(role: Role, newLeads: number): { top: SideItem[]; sections: SideSection[] } {
  const vis = new Map(schemaIndex.collections.map((c) => [c.slug, c]));
  const canSee = (slug: string) => Boolean(vis.get(slug)?.visible[role]);
  const top: SideItem[] = [
    { key: "overview", label: "Overview", href: "/dashboard/overview", icon: LayoutDashboard },
    { key: "package", label: role === "admin" ? "Packages" : "My package", href: "/dashboard/package", icon: Package },
    ...(role === "admin" ? [{ key: "inbox", label: "Inbox", href: "/dashboard/inbox", icon: Inbox }] : []),
  ];
  const sections: SideSection[] = [];
  for (const s of schemaIndex.sections) {
    const items: SideItem[] = [];
    for (const it of s.items) {
      if (it.kind === "collection") {
        if (!canSee(it.slug)) continue;
        const filter = it.filter ? `?${it.filter}` : "";
        items.push({ key: `${it.slug}${filter}`, label: it.label, href: `/dashboard/${it.slug}${filter}`, icon: iconFor(it.slug), badge: it.filter?.includes("status][equals]=new") ? newLeads : undefined });
      } else if (it.kind === "view") {
        if (it.roles && !it.roles.includes(role)) continue;
        if (it.slug === "mail" || it.slug === "mail-settings") continue; // the Inbox lives in the top group; connection status is a sub-page of it
        items.push({ key: it.slug, label: it.label, href: VIEW_HREF[it.slug] ?? "/dashboard/overview", icon: iconFor(it.slug) });
      } else if (role === "admin") {
        items.push({ key: `g-${it.slug}`, label: it.label, href: `/dashboard/globals/${it.slug}`, icon: iconFor(it.slug) });
      }
    }
    if (s.label === "Settings" && role === "developer") items.push({ key: "company", label: "Company profile", href: "/dashboard/developers/1", icon: Building });
    if (s.label === "Mail" && role === "admin") items.unshift({ key: "inbox2", label: "Inbox", href: "/dashboard/inbox", icon: Mail }, { key: "conn", label: "Connection status", href: "/dashboard/inbox/connection", icon: Settings });
    if (items.length) sections.push({ label: s.label, items });
  }
  const other = OTHER.filter(canSee).map<SideItem>((slug) => ({ key: slug, label: vis.get(slug)?.label ?? slug, href: `/dashboard/${slug}`, icon: iconFor(slug) }));
  if (other.length) sections.push({ label: "Other", items: other });
  return { top, sections };
}
