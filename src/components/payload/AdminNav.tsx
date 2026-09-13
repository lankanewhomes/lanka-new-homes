import type { PayloadRequest, ServerProps } from "payload";
import { Logout } from "@payloadcms/ui";
import type { ComponentType } from "react";
import {
  BarChart3,
  Briefcase,
  Building2,
  CreditCard,
  GalleryHorizontal,
  HardHat,
  Handshake,
  Heart,
  Image as ImageIcon,
  LayoutDashboard,
  MapPin,
  MapPinned,
  Megaphone,
  MessageCircle,
  Newspaper,
  Receipt,
  Ruler,
  Search,
  Settings,
  Share2,
  Sofa,
  Star,
  Tag,
  UserCog,
  Users,
} from "lucide-react";
import { NavLink } from "./NavLink";

type NavProps = { req?: PayloadRequest } & ServerProps;
type IconType = ComponentType<{ size?: number; className?: string }>;

type NavItem = {
  /** The collection or global slug this entry is gated on — checked against
   * visibleEntities so a developer account only ever sees what their
   * existing access/hidden rules already allow. Ignored for kind "view". */
  slug: string;
  kind: "collection" | "global" | "view";
  /** kind "view" only — a routed admin view (see payload.config.ts), gated
   * on role directly since it isn't backed by a collection/global. */
  roles?: ("admin" | "developer")[];
  label: string;
  href: string;
  icon: IconType;
};

// Every real collection/global in the app, regrouped into the requested
// LankaNewHomes IA. Nothing here changes access/hidden rules — a slug not
// visible to the current user (per Payload's own visibleEntities, computed
// from each collection's existing access control) is simply filtered out
// below, exactly like the default Nav already does.
const SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: "Listings",
    items: [
      { slug: "projects", kind: "collection", label: "Projects", href: "/cms/collections/projects", icon: Building2 },
      { slug: "lands", kind: "collection", label: "Land", href: "/cms/collections/lands", icon: MapPin },
    ],
  },
  {
    label: "Developers",
    items: [
      { slug: "developers", kind: "collection", label: "Developers", href: "/cms/collections/developers", icon: Briefcase },
      // Real filtered view of the same Developers collection/data — not a
      // fake page. verification_status is a real field on Developers.ts.
      { slug: "developers", kind: "collection", label: "Verification", href: "/cms/collections/developers?where[verification_status][equals]=pending", icon: UserCog },
      { slug: "construction-companies", kind: "collection", label: "Construction Companies", href: "/cms/collections/construction-companies", icon: HardHat },
      { slug: "marketing-companies", kind: "collection", label: "Marketing Companies", href: "/cms/collections/marketing-companies", icon: Megaphone },
      { slug: "sales-companies", kind: "collection", label: "Sales Companies", href: "/cms/collections/sales-companies", icon: Handshake },
      { slug: "architects", kind: "collection", label: "Architects", href: "/cms/collections/architects", icon: Ruler },
      { slug: "interior-designers", kind: "collection", label: "Interior Designers", href: "/cms/collections/interior-designers", icon: Sofa },
    ],
  },
  {
    label: "Leads",
    items: [
      { slug: "leads", kind: "collection", label: "All Leads", href: "/cms/collections/leads", icon: MessageCircle },
      // Real filtered view — 'new' is a real LEAD_STATUS_OPTIONS value.
      { slug: "leads", kind: "collection", label: "New Leads", href: "/cms/collections/leads?where[status][equals]=new", icon: MessageCircle },
      { slug: "saved-listings", kind: "collection", label: "Saved Listings", href: "/cms/collections/saved-listings", icon: Heart },
      { slug: "reviews", kind: "collection", label: "Reviews", href: "/cms/collections/reviews", icon: Star },
    ],
  },
  {
    label: "Content",
    items: [
      { slug: "articles", kind: "collection", label: "Articles", href: "/cms/collections/articles", icon: Newspaper },
      { slug: "hero-slides", kind: "collection", label: "Hero Slides", href: "/cms/collections/hero-slides", icon: GalleryHorizontal },
      { slug: "neighborhoods", kind: "collection", label: "Neighborhoods", href: "/cms/collections/neighborhoods", icon: MapPinned },
      { slug: "media", kind: "collection", label: "Media", href: "/cms/collections/media", icon: ImageIcon },
    ],
  },
  {
    label: "Marketing",
    items: [
      { slug: "social-posts", kind: "collection", label: "Social Posts", href: "/cms/collections/social-posts", icon: Share2 },
      { slug: "social-assets", kind: "collection", label: "Social Assets", href: "/cms/collections/social-assets", icon: GalleryHorizontal },
      { slug: "seo-keywords", kind: "collection", label: "SEO Keywords", href: "/cms/collections/seo-keywords", icon: Search },
      { slug: "placement-pricing", kind: "collection", label: "Placement Pricing", href: "/cms/collections/placement-pricing", icon: Tag },
    ],
  },
  {
    label: "Billing",
    items: [
      { slug: "billing-overview", kind: "view", roles: ["admin"], label: "Overview", href: "/cms/billing", icon: BarChart3 },
      { slug: "my-billing", kind: "view", roles: ["developer"], label: "My Billing", href: "/cms/my-billing", icon: CreditCard },
      { slug: "subscriptions", kind: "collection", label: "Subscriptions", href: "/cms/collections/subscriptions", icon: CreditCard },
      { slug: "payments", kind: "collection", label: "Payments", href: "/cms/collections/payments", icon: Receipt },
    ],
  },
  {
    label: "Analytics",
    items: [{ slug: "analytics", kind: "collection", label: "Analytics", href: "/cms/collections/analytics", icon: BarChart3 }],
  },
  {
    label: "Users",
    items: [
      { slug: "users", kind: "collection", label: "Users", href: "/cms/collections/users", icon: Users },
      { slug: "team-members", kind: "collection", label: "Team Members", href: "/cms/collections/team-members", icon: UserCog },
    ],
  },
  {
    label: "Settings",
    items: [
      { slug: "site-settings", kind: "global", label: "Site Settings", href: "/cms/globals/site-settings", icon: Settings },
      { slug: "lead-alert-settings", kind: "global", label: "Lead Alert Settings", href: "/cms/globals/lead-alert-settings", icon: Settings },
    ],
  },
];

export const AdminNav = async (props: NavProps) => {
  const { payload, user, visibleEntities } = props;
  if (!payload?.config) return null;

  const visibleCollections = new Set<string>(visibleEntities?.collections ?? []);
  const visibleGlobals = new Set<string>(visibleEntities?.globals ?? []);
  const role = (user as { role?: "admin" | "developer" } | null)?.role;
  const isVisible = (item: NavItem) => {
    if (item.kind === "collection") return visibleCollections.has(item.slug);
    if (item.kind === "global") return visibleGlobals.has(item.slug);
    return role ? (item.roles?.includes(role) ?? true) : false;
  };

  const sections = SECTIONS.map((section) => ({ ...section, items: section.items.filter(isVisible) })).filter((section) => section.items.length > 0);

  // Safety net: any collection/global that IS visible to this user but
  // isn't in the map above (e.g. a new one added later) still gets a link,
  // per "do not remove access to any existing collection."
  const mappedSlugs = new Set(SECTIONS.flatMap((s) => s.items.map((i) => i.slug)));
  const unmapped = [
    ...payload.config.collections.filter((c) => visibleCollections.has(c.slug) && !mappedSlugs.has(c.slug)).map((c) => ({ slug: c.slug, kind: "collection" as const, label: c.slug, href: `/cms/collections/${c.slug}`, icon: LayoutDashboard })),
    ...payload.config.globals.filter((g) => visibleGlobals.has(g.slug) && !mappedSlugs.has(g.slug)).map((g) => ({ slug: g.slug, kind: "global" as const, label: g.slug, href: `/cms/globals/${g.slug}`, icon: Settings })),
  ];
  if (unmapped.length > 0) sections.push({ label: "Other", items: unmapped });

  return (
    <div className="ln-nav">
      <div className="ln-nav-brand">
        <span className="ln-nav-brand-name">LankaNewHomes</span>
        <span className="ln-nav-brand-role">{role === "admin" ? "Admin" : role === "developer" ? "Developer" : "CMS"}</span>
      </div>

      <nav className="ln-nav-scroll">
        <NavLink href="/cms" label="Dashboard" icon={LayoutDashboard} />

        {sections.map((section) => (
          <div className="ln-nav-section" key={section.label}>
            <p className="ln-nav-section-label">{section.label}</p>
            {section.items.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} icon={item.icon} />
            ))}
          </div>
        ))}
      </nav>

      <div className="ln-nav-footer">
        <Logout />
      </div>
    </div>
  );
};
