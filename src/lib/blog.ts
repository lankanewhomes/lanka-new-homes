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
  /** The one article pinned to the top of /blog as the featured article (owner, 2026-10-02). Set on a single post. */
  featured?: boolean;
  /** Draft = reachable only by its direct URL: hidden from /blog, the sitemap and search engines, with a draft notice on
   * the page. Remove the flag to publish (owner, 2026-10-02: "don't publish it … preview link"). */
  draft?: boolean;
  /** Closing call-to-action box; the default (web-design service) is used when omitted. */
  cta?: { heading: string; body: string; links: { label: string; href: string }[] };
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
    featured: true,
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
  "sri-lanka-new-home-market-october-2026": {
    slug: "sri-lanka-new-home-market-october-2026",
    path: "/blog/sri-lanka-new-home-market-october-2026",
    metaTitle: "Sri Lanka Homes for Sale: New-Home Market, Oct 2026",
    metaDescription:
      "How the Sri Lankan new-home market looks in October 2026: rising condominium prices, fewer sales, higher borrowing costs, and what 52 projects and 301 land plots show.",
    title: "Sri Lanka Homes for Sale: How the New-Home Market Looks in October 2026",
    excerpt:
      "Prices are still climbing while fewer homes are changing hands, and borrowing has become more expensive. Here is what the Central Bank data says, and what the prices and floor plans on LankaNewHomes show.",
    category: "Market insights",
    author: "LankaNewHomes",
    publishDate: "2026-10-02",
    readMinutes: 8,
    draft: true,
    heroImage: "https://media.lankanewhomes.com/projects/edmonton-bliss-residencies/gallery/edmonton-bliss-residencies_aerial-skyline-view.jpg",
    intro:
      "The Sri Lankan new-home market in autumn 2026 is a market of contrasts: prices for new condominiums in Colombo are rising quickly, yet fewer buyers are completing purchases, and the cost of borrowing went up in May. To see what that means in practice, we combined the latest Central Bank and industry data with the published prices, floor plans and land listings from 52 projects and 301 land plots on LankaNewHomes.",
    sections: [
      {
        heading: "Prices are still rising, but fewer homes are changing hands",
        body: "The Central Bank of Sri Lanka's condominium survey for the first quarter of 2026 shows the price index for new condominiums in the Colombo District up 18.5 per cent on a year earlier, while its sales volume index fell 15.2 per cent. The Colombo District accounted for 65 per cent of condominium sales. The same survey found that most units in completed projects had already been sold, and that most purchases were made by Sri Lankan residents, mainly for immediate occupancy and paid for with their own funds. Land followed the same direction: Colombo District land prices were reported up 31.9 per cent year on year by March 2026.",
      },
      {
        heading: "Buyers are moving up the price ladder",
        body: "Behind the headline figures is a shift in what is being bought. Market reports of the Central Bank data say apartments priced above Rs. 75 million rose from 11 per cent to 29 per cent of sales over the year, while the Rs. 25 million to Rs. 50 million band fell from 49 per cent to 29 per cent. In other words, price growth is partly the result of the mix of homes sold, with fewer mid-priced purchases and more at the top. Asking prices in property advertisements point the same way: one classifieds portal put the average advertised price of a three-bedroom apartment at Rs. 99.1 million in the second quarter of 2026. Asking prices are what sellers hope to get, not what buyers pay.",
      },
      {
        heading: "Borrowing costs are the new backdrop",
        body: "On 30 September 2026 the Central Bank held its policy rate at 8.75 per cent, after raising it by 100 basis points in May. Headline inflation was 8.0 per cent in August, driven by an energy price shock, and the Bank expects it to stay in the high single digits until early 2027 before easing towards its 5 per cent target. The economy grew 4.7 per cent in the first half of 2026, and credit growth to the private sector has been moderating. For home buyers the practical effect is the cost of a housing loan: bank rate sheets in September showed housing-loan rates of roughly 12.5 to 15.5 per cent at two of the largest banks, so the size of the loan and the schedule of payments matter more than they did a year ago.",
      },
      {
        heading: "What developers are asking: the prices on LankaNewHomes",
        body: "Of the 52 projects listed, 36 publish a starting price, and those starting prices run from Rs. 22 million to Rs. 153 million. Ten start below Rs. 40 million, fifteen between Rs. 40 million and Rs. 70 million, six between Rs. 70 million and Rs. 100 million, and five above Rs. 100 million, so 25 of the 36 start under Rs. 70 million. Priced apartments run from Rs. 23.1 million to Rs. 125 million, and priced houses, villas and townhouses from Rs. 22 million to Rs. 118.5 million. These are developers' own \"from\" prices for their lowest-priced unit, not typical prices or sale prices. Sixteen projects publish no price at all, and only 15 of the 52 publish a deposit or payment plan, which is one of the first things a buyer should ask for.",
      },
      {
        heading: "What is actually being built: the floor plans",
        body: "The 324 floor plans on the site tell a clear story about demand as developers see it. Three-bedroom plans are the largest group at 168, followed by 80 two-bedroom plans, 30 one-bedroom plans, 16 studios and 29 four-bedroom plans. Two-bedroom plans range from 470 to 1,840 sq ft, three-bedroom plans from 652 to 3,329 sq ft (houses included), and studios start at 231 sq ft. By status, 32 projects are now selling, 15 are under construction, 2 are coming soon and 3 are completed, with 4 ready to move in. The 14 projects that publish a future handover year give dates from 2026 to 2031, so in many projects buyers are paying for homes that will take years to finish.",
      },
      {
        heading: "Coast and hills: where tourism meets property",
        body: "Several newer projects are hotel residencies in tourist areas, and tourism is recovering: the Sri Lanka Tourism Development Authority counted more than 1.64 million international arrivals by late September 2026, with India, the United Kingdom and China the largest sources. The coastal and hill-country projects on LankaNewHomes start at Rs. 26.6 million in Sigiriya, Rs. 28 million in Hikkaduwa and Rs. 39.4 million in Negombo, up to Rs. 72 million in Nuwara Eliya, while south-coast villas start between Rs. 50.4 million and Rs. 104.1 million. Developers often advertise rental or capital-gain projections for these projects. Treat those as marketing until you have the rental terms and management agreement in writing.",
      },
      {
        heading: "Land: plenty of plots, wide gaps in price",
        body: "The site lists 301 residential land plots, all offered by developers, and the Colombo District holds 119 of them (about 40 per cent), followed by Gampaha with 57, Kalutara with 35, Galle with 19, Kurunegala with 18 and Kandy with 16. Where plot sizes are published they run from 6 to 94 perches. Only two listings publish a total price, but 211 publish a price per perch, and the lowest published per-perch prices start at roughly Rs. 65,000 in the Colombo District, Rs. 70,000 in Galle, Rs. 75,000 in Kalutara, Rs. 77,500 in Gampaha and Rs. 85,000 in Kandy, while the highest-priced Colombo plots are listed in the millions of rupees per perch. Location, road frontage and utilities explain much of that spread, which is why comparing the same area matters.",
      },
      {
        heading: "What this means if you are buying",
        body: "First, ask for the full price list and payment plan before you visit, because the headline starting price describes only one unit. Second, with loans costing more, a staged payment plan during construction can matter as much as the price itself, so compare deposit, stage payments and the balance at handover. Third, check how far construction has actually progressed, using dated photos where the developer provides them. Fourth, if you are a foreign buyer, condominium units in a registered condominium can be bought on any level, provided the full price is paid in advance by inward foreign remittance, while freehold land is closed to foreigners, who can lease it for up to 99 years. Confirm the current rules with a lawyer before you pay a deposit.",
      },
      {
        heading: "How to read these numbers",
        body: "The Central Bank figures come from its condominium survey for the first quarter of 2026 and cover the Colombo District and other major cities, so they do not describe every area or property type. Prices on LankaNewHomes are the starting prices developers publish for the listings on the site. They are not transaction prices and do not describe the whole market, and some developers do not publish prices at all. Interest-rate and inflation figures are from the Central Bank's 30 September 2026 policy statement, and the tourism figure is from the tourism authority's published arrivals. This article is general information, not financial or legal advice.",
      },
    ],
    cta: {
      heading: "See the homes behind the numbers.",
      body: "Browse new homes and land across Sri Lanka, with floor plans and developer prices, or add your project to LankaNewHomes for free.",
      links: [
        { label: "Browse new homes", href: "/projects" },
        { label: "Browse land", href: "/land" },
      ],
    },
  },
};

export function buildBlogMetadata(post: BlogPost): Metadata {
  return {
    title: post.metaTitle,
    description: post.metaDescription,
    alternates: { canonical: post.path },
    ...(post.draft ? { robots: { index: false, follow: false } } : {}),
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
