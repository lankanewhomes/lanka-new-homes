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
    metaTitle: "7 Ways Sri Lankan Developers Can Make Their Project Websites Sell More Units",
    metaDescription:
      "Practical, specific ways to make a property development website actually convert visitors into enquiries — photography, pricing, contact, mobile, speed, and more.",
    title: "7 Ways Sri Lankan Developers Can Make Their Project Websites Sell More Units",
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
    },
    twitter: {
      card: "summary_large_image",
      title: post.metaTitle,
      description: post.metaDescription,
    },
  };
}

export function formatBlogDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}
