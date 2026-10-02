import type { Metadata } from "next";

export type BlogSection = { heading: string; body: string };

export type BlogPost = {
  slug: string;
  path: string;
  metaTitle: string;
  metaDescription: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  publishDate: string; // ISO date, e.g. "2026-09-29"
  readMinutes: number;
  heroImage: string;
  intro: string;
  sections: BlogSection[];
};

// Config-driven, same pattern as src/lib/guides.ts — add an entry here and a
// route reads it, rather than a bespoke page per post. Only one post exists
// today; this is still worth the small amount of structure since a blog is
// meant to accumulate posts over time, unlike a one-off guide.
const unsplash = (id: string, width: number) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=${width}`;

export const blogPosts: Record<string, BlogPost> = {
  "7-ways-to-make-your-project-website-sell-more-units": {
    slug: "7-ways-to-make-your-project-website-sell-more-units",
    path: "/blog/7-ways-to-make-your-project-website-sell-more-units",
    metaTitle: "7 Ways to Make Your Project Site Sell More",
    metaDescription:
      "Practical, specific ways to make a property development website actually convert visitors into enquiries — photography, pricing, contact, mobile, speed, and more.",
    title: "7 Ways to Make Your Project Site Sell More",
    excerpt:
      "A LankaNewHomes listing gets a project discovered. What happens after that — on the project's own website — is what actually decides whether an enquiry happens.",
    category: "Web design",
    author: "LankaNewHomes",
    publishDate: "2026-09-29",
    readMinutes: 7,
    heroImage: unsplash("1487958449943-2429e8be8625", 2200),
    intro:
      "A listing gets your project discovered by buyers already searching. What happens next — on a Facebook ad click, a signboard QR code, a referral from a past buyer — usually lands on the project's own website. That site does most of the actual convincing, and small, fixable things on it are quietly costing developers real enquiries. Here are seven that make the biggest difference.",
    sections: [
      {
        heading: "1. Use real photography and renders, not a template with your logo on it",
        body: "Buyers can tell the difference between a site built around a specific development and a generic template with a logo swapped in. Lead with your own renders, your own floor plans, your own site photography — not stock imagery of a villa that isn't yours. If construction hasn't started, professional renders are worth the cost; they're the first thing a buyer judges the project by.",
      },
      {
        heading: "2. Put pricing and floor plans where buyers can actually see them",
        body: "\"Contact us for pricing\" filters out buyers who would rather compare a few options first and only call the ones that fit their budget. Showing starting prices per unit type, even as \"from Rs. X\", keeps a serious buyer on the page instead of bouncing to a competitor who did show a number. The same goes for floor plans — a locked PDF behind a form is one extra step most visitors won't take.",
      },
      {
        heading: "3. Make WhatsApp and a phone call one tap away, everywhere",
        body: "A contact form buried at the bottom of a long page loses buyers who wanted to ask a quick question, not fill in a form and wait. A WhatsApp click-to-chat button and a tap-to-call number, visible from the header and repeated near every unit type and floor plan, catches that intent while it's still there.",
      },
      {
        heading: "4. Show construction progress honestly, not just at handover",
        body: "Off-plan buyers are trusting a developer with a deposit before there's a building to walk through. Dated photos of the actual site — foundations, structure, finishing — updated as the project moves, do more to build confidence than any amount of copy about \"quality and trust\". Skip the update if there's nothing new to show; a stale progress section reads worse than none at all.",
      },
      {
        heading: "5. Design for a phone first — that's where most buyers actually are",
        body: "Most traffic to a project site arrives from a phone: a Facebook ad, a WhatsApp forward, a QR code on a signboard. A site designed on a desktop screen first and then squeezed to fit a phone usually shows it — tiny text, floor plans that need pinch-to-zoom, forms that are awkward to fill in with a thumb. Design the phone layout first, then scale up.",
      },
      {
        heading: "6. Keep it fast — every extra second costs enquiries",
        body: "A gallery of uncompressed 8MB photos feels premium to build but loads slowly on an average mobile connection, and a slow site loses visitors before they see the pricing or the contact button. Optimised images and lean, modern tooling matter more to the enquiry count than almost any visual flourish.",
      },
      {
        heading: "7. Give every visitor more than one way to convert",
        body: "Not every buyer is ready for the same next step. Some want to talk to a person immediately (phone, WhatsApp), some want to read more first (a downloadable brochure), and some want to leave their details and be followed up later (an enquiry form). A site that only offers one of these is turning away buyers who would have converted through a different one.",
      },
    ],
  },
  "how-to-choose-the-right-lankanewhomes-package": {
    slug: "how-to-choose-the-right-lankanewhomes-package",
    path: "/blog/how-to-choose-the-right-lankanewhomes-package",
    metaTitle: "Choosing the Right LankaNewHomes Package",
    metaDescription:
      "A plain-language walkthrough of LankaNewHomes' developer packages — Featured, Featured Plus, Developer Pro and Campaign — and which one actually fits your project.",
    title: "How to Choose the Right LankaNewHomes Package for Your Project",
    excerpt:
      "Listing is always free. Every paid package just changes how many of your projects get extra reach, and how much of it. Here's how to tell which one fits.",
    category: "For developers",
    author: "LankaNewHomes",
    publishDate: "2026-09-30",
    readMinutes: 5,
    heroImage: unsplash("1560448204-e02f11c3d0e2", 2200),
    intro:
      "Every project you list on LankaNewHomes is free, permanently — that part never changes. What a paid package buys is reach: your project shown in more places, to more buyers, more often. The question isn't whether to pay, it's which package matches how many projects you're actively selling right now.",
    sections: [
      {
        heading: "Start from how many projects you're actively selling",
        body: "Featured gives you one paid spot. Featured Plus gives you three. Developer Pro gives you five, plus the full analytics dashboard. If you're a single-project developer mid-sale, Featured or Featured Plus already covers you — Developer Pro's extra spots go unused. If you're running several developments at once, the per-project cost drops sharply as you move up a tier.",
      },
      {
        heading: "You're not locked into which projects fill the spots",
        body: "A package buys a number of featured spots, not a fixed list of projects. If one development sells out and a new one launches, swap it in — your package's end date doesn't reset, and the swap takes effect immediately. This is the detail that makes a multi-project package worth it even if your lineup changes over the year.",
      },
      {
        heading: "Annual billing is the one that actually saves money",
        body: "Monthly and quarterly billing cost the same per month — quarterly is simply three monthly payments at once, for convenience. Annual billing is priced at 10 months' worth for 12 months of coverage, a real discount over paying monthly. If you already know you'll want the reach for a full sales cycle (most developments take 12+ months to sell out), annual is the better deal.",
      },
      {
        heading: "Campaign is a different kind of package",
        body: "Featured, Featured Plus and Developer Pro are ongoing reach. Campaign is a fixed-period push — a homepage takeover slide, guaranteed top placement, and content support (blog, newsletter, social) — built for a launch window, a price-drop promotion, or a handover push, not for year-round use.",
      },
      {
        heading: "What's free no matter what you choose",
        body: "A full project page, unlimited photos and floor plans, brochure download, WhatsApp and phone enquiries, and the Verified badge once any package is active — none of that is gated behind a specific tier. Paying moves you up in search and city-page ranking, into the homepage's featured rotation, and (on Developer Pro) pins you in the developer directory — it doesn't unlock features your free listing was missing.",
      },
    ],
  },
  "what-buyers-actually-look-for-in-a-new-home-in-sri-lanka": {
    slug: "what-buyers-actually-look-for-in-a-new-home-in-sri-lanka",
    path: "/blog/what-buyers-actually-look-for-in-a-new-home-in-sri-lanka",
    metaTitle: "What Buyers Look For in a New Sri Lanka Home",
    metaDescription:
      "What new-home buyers in Sri Lanka actually check first — location and commute, floor plans and light, payment terms, and how far along construction really is.",
    title: "What Buyers Actually Look For in a New Home in Sri Lanka",
    excerpt:
      "Not the render on the cover page. Buyers researching a new home move through the same handful of questions, in roughly the same order — here's what they are.",
    category: "Market insights",
    author: "LankaNewHomes",
    publishDate: "2026-10-01",
    readMinutes: 6,
    heroImage: unsplash("1600585154526-990dced4db0d", 2200),
    intro:
      "Watching how buyers actually browse new-home listings — what they click, what they skip, what makes them reach out versus move to the next project — shows the same handful of questions coming up in roughly the same order, regardless of budget or property type.",
    sections: [
      {
        heading: "Location and the real commute, not just the address",
        body: "\"Colombo 5\" tells a buyer less than it used to. What they're actually checking is the commute to a specific office, school, or hospital, and whether the area floods, how it sounds at night, and what's being built next door. A project page that names the nearest schools, hospitals, and expressway access — with real distances — answers this before the buyer has to ask.",
      },
      {
        heading: "Unit size and layout, compared against what they have now",
        body: "Buyers moving from a house to an apartment, or upgrading from a studio to a family unit, are mentally placing their current furniture into the new floor plan. Room-by-room dimensions and a clear floor plan (not just a render of the finished living room) matter more here than the marketing photography does.",
      },
      {
        heading: "How far along construction actually is",
        body: "\"Under construction\" could mean foundations poured last month or handover in six weeks — buyers want to know which, because it changes both the price they'd expect to pay and the risk they're taking on. Dated construction photos, updated as the project moves, are one of the fastest ways a project earns trust over one that only shows renders.",
      },
      {
        heading: "The real payment plan, not just the headline price",
        body: "A price per square foot means little without knowing the deposit, the stage-payment schedule, and what's due at handover. Buyers comparing two similar units will often choose the one with a clearer payment plan over the one with a marginally lower headline price.",
      },
      {
        heading: "Whether a real person responds quickly",
        body: "An enquiry that gets a same-day reply is far more likely to turn into a viewing than one that sits for three days — buyers researching several projects at once simply move on to whichever developer responded first. This is also why LankaNewHomes' \"Responds within 24 hours\" badge is one buyers specifically look for on a listing.",
      },
    ],
  },
};

export function buildBlogMetadata(post: BlogPost): Metadata {
  return {
    title: post.metaTitle,
    description: post.metaDescription,
    alternates: { canonical: post.path },
    openGraph: {
      title: post.metaTitle,
      description: post.metaDescription,
      url: post.path,
      type: "article",
      images: [{ url: post.heroImage }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.metaTitle,
      description: post.metaDescription,
      images: [post.heroImage],
    },
  };
}

export function formatBlogDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}
