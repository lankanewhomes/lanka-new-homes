import type { Metadata } from "next";
import { withSocial } from "@/lib/seo";

export type BlogSection = {
  heading: string;
  body: string;
  /** Short list under the paragraph (owner, 2026-10-23: "add some bulleted points so it's easy to read"). */
  bullets?: string[];
  /** Illustration shown between the paragraph and the list. */
  image?: { src: string; alt: string };
  /** One highlighted takeaway at the end of the section. */
  callout?: string;
  /** Puts the whole section in one of the site's soft contained boxes (owner, 2026-10-23: "apply a container bg"). */
  tone?: "sage" | "cream" | "gray" | "lilac";
};

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
  cta?: { heading: string; body: string; links: { label: string; href: string }[]; /** Up to three short steps shown as cards beside the text. */ steps?: string[] };
  heroImage: string;
  /** Describes the hero photo for search and screen readers; empty = decorative. */
  heroImageAlt?: string;
  /** ISO date of the last meaningful edit (structured data dateModified). */
  updatedDate?: string;
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
      "Seven fixes that turn visitors to a property project website into enquiries: real images, visible prices, one-tap contact, dated progress photos, a phone-first design, speed and more.",
    title: "7 Ways to Make Your Project Site Sell More",
    excerpt:
      "A LankaNewHomes listing gets your project found. Your own website decides whether the buyer enquires. These seven fixes make the biggest difference.",
    category: "Web design",
    author: "LankaNewHomes",
    publishDate: "2026-09-29",
    updatedDate: "2026-10-24",
    readMinutes: 4,
    heroImage: unsplash("1487958449943-2429e8be8625", 2200),
    intro:
      "A listing gets your project found. What happens next, after a Facebook ad click, a signboard QR code or a referral, usually happens on your own website. Seven fixes decide whether that visitor enquires. Counts below are from the 107 projects on LankaNewHomes in October 2026.",
    sections: [
      {
        heading: "Should the site use your own images?",
        tone: "gray",
        body: "Yes. Buyers can tell a site built around your development from a template with your logo on it. Lead with your own renders, floor plans and site photos, not stock images of a villa that is not yours.",
        image: { src: "https://media.lankanewhomes.com/blog/7-ways-to-make-your-project-website-sell-more-units/site-own-t.png", alt: "Lead with your own renders, floor plans and site photos" },
        callout: "If construction has not started, professional renders are worth the cost. They are the first thing a buyer judges the project by.",
      },
      {
        heading: "Should you show prices and floor plans?",
        tone: "sage",
        body: "Yes. \"From Rs. X\" keeps a serious buyer on the page. \"Contact us for pricing\" sends them to a developer who showed a number. A floor plan locked behind a form is one more step most visitors will not take.",
        image: { src: "https://media.lankanewhomes.com/blog/7-ways-to-make-your-project-website-sell-more-units/site-numbers-t.png", alt: "72 of 107 LankaNewHomes projects publish a starting price, 92 show floor plans and 10 publish a price for individual floor plans" },
        callout: "See how [project pages](/projects) show a starting price and floor plans next to each other.",
      },
      {
        heading: "How easy should it be to contact you?",
        tone: "cream",
        body: "One tap. A form at the bottom of a long page loses the buyer who only wanted to ask one question.",
        image: { src: "https://media.lankanewhomes.com/blog/7-ways-to-make-your-project-website-sell-more-units/site-contact-t.png", alt: "WhatsApp, call and a short enquiry form" },
        bullets: [
          "A WhatsApp chat button in the header, repeated near every unit type.",
          "A tap-to-call number that works on a phone.",
        ],
      },
      {
        heading: "Should you show construction progress?",
        tone: "gray",
        body: "Yes, with dated photos. An off-plan buyer hands over a deposit before there is a building to walk through. A project that shows them stands out.",
        image: { src: "https://media.lankanewhomes.com/blog/7-ways-to-make-your-project-website-sell-more-units/site-progress-t.png", alt: "Dated photos of foundations, structure and finishing" },
        callout: "Nothing new to show? Skip the update. A stale progress section reads worse than none.",
      },
      {
        heading: "Is your site built for a phone?",
        tone: "sage",
        body: "Design the phone layout first, then scale up. Visitors arrive from a Facebook ad, a WhatsApp forward or a QR code, and often on a phone.",
        image: { src: "https://media.lankanewhomes.com/blog/7-ways-to-make-your-project-website-sell-more-units/site-phone-t.png", alt: "Readable text, full-width floor plans and thumb-friendly forms" },
        callout: "Open your own site on a phone. If you have to pinch to read a price, a buyer will leave.",
      },
      {
        heading: "How fast should the site load?",
        tone: "cream",
        body: "Fast enough that nobody waits. A gallery of 8 MB photos loads slowly on mobile data, and a slow site loses the visitor before the price or the contact button appears.",
        image: { src: "https://media.lankanewhomes.com/blog/7-ways-to-make-your-project-website-sell-more-units/site-speed-t.png", alt: "Compress photos, keep pages lean and test on a phone with mobile data" },
        callout: "Test with mobile data, not office wifi.",
      },
      {
        heading: "Should buyers have more than one way to enquire?",
        tone: "gray",
        body: "Yes. Some buyers want to talk now, some want to read first, and some want to be called back. A site with one path turns the others away.",
        image: { src: "https://media.lankanewhomes.com/blog/7-ways-to-make-your-project-website-sell-more-units/site-paths-t.png", alt: "Talk now by phone or WhatsApp, read first in a brochure, or be called back through a form" },
        callout: "Put your brochure one tap away, so a buyer can read it before they call.",
      },
    ],
  },
  "how-to-choose-the-right-lankanewhomes-package": {
    slug: "how-to-choose-the-right-lankanewhomes-package",
    path: "/blog/how-to-choose-the-right-lankanewhomes-package",
    metaTitle: "Choosing the Right LankaNewHomes Package",
    metaDescription:
      "How to choose a LankaNewHomes developer package: how many spots you need, swapping projects, whether annual billing pays off, and what Campaign is for.",
    title: "How to Choose the Right LankaNewHomes Package for Your Project",
    excerpt:
      "Listing is always free. A paid package only changes how many of your projects get extra reach. Here is how to tell which one fits.",
    category: "For developers",
    author: "LankaNewHomes",
    publishDate: "2026-09-30",
    updatedDate: "2026-10-24",
    readMinutes: 2,
    draft: true,
    heroImage: unsplash("1560448204-e02f11c3d0e2", 2200),
    heroImageAlt: "Exterior of a modern home with a lit entrance at dusk",
    intro:
      "Listing on LankaNewHomes is free, permanently. A paid package only buys reach: your project shown in more places, to more buyers, more often. Choose by how many projects you are actively selling right now.",
    sections: [
      {
        heading: "How many paid spots do you need?",
        tone: "gray",
        body: "Match the package to the projects you are selling now. A single-project developer mid-sale is covered by Featured or Featured Plus, so Developer Pro's extra spots would go unused. Running several developments at once? The cost per project drops sharply as you move up a tier.",
        image: { src: "https://media.lankanewhomes.com/blog/how-to-choose-the-right-lankanewhomes-package/package-spots-t.png", alt: "Featured has one paid spot, Featured Plus three, Developer Pro five plus the analytics dashboard" },
      },
      {
        heading: "Can you change which projects use the spots?",
        tone: "sage",
        body: "Yes. A package buys a number of spots, not a fixed list of projects.",
        image: { src: "https://media.lankanewhomes.com/blog/how-to-choose-the-right-lankanewhomes-package/package-swap-t.png", alt: "When a development sells out, swap in a new launch; the swap is immediate and the end date does not reset" },
        callout: "That is what makes a multi-project package worth it even if your lineup changes over the year.",
      },
      {
        heading: "Is annual billing worth it?",
        tone: "cream",
        body: "Usually, if you want the reach for a full sales cycle. Most developments take 12 months or more to sell out.",
        image: { src: "https://media.lankanewhomes.com/blog/how-to-choose-the-right-lankanewhomes-package/package-billing-t.png", alt: "Monthly and quarterly cost the same per month; annual is priced at 10 months for 12 months of coverage" },
      },
      {
        heading: "What is the Campaign package for?",
        tone: "gray",
        body: "A launch window, a price-drop promotion or a handover push. It is not meant for year-round use.",
        image: { src: "https://media.lankanewhomes.com/blog/how-to-choose-the-right-lankanewhomes-package/package-campaign-t.png", alt: "Ongoing reach from the other packages compared with a fixed-period Campaign push" },
      },
      {
        heading: "What do you get free, whichever package you choose?",
        tone: "sage",
        body: "Paying does not unlock features your free listing was missing.",
        image: { src: "https://media.lankanewhomes.com/blog/how-to-choose-the-right-lankanewhomes-package/package-free-t.png", alt: "Free on every listing: project page, photos and floor plans, brochure, WhatsApp and phone enquiries, Verified badge with any package" },
        callout: "Paying moves you up in search and city-page ranking, into the homepage's featured rotation and, on Developer Pro, pins you in the developer directory.",
      },
    ],
    cta: {
      heading: "List your project for free.",
      body: "Listing is always free. Paid packages only add reach.",
      links: [
        { label: "List your project", href: "/for-developers" },
      ],
    },
  },
  "what-buyers-actually-look-for-in-a-new-home-in-sri-lanka": {
    slug: "what-buyers-actually-look-for-in-a-new-home-in-sri-lanka",
    path: "/blog/what-buyers-actually-look-for-in-a-new-home-in-sri-lanka",
    metaTitle: "What to Check Before Buying a New Home in Sri Lanka",
    metaDescription:
      "Five things to check before you choose a new home in Sri Lanka: the real commute, the floor plan, how far construction is, the full payment plan and whether the developer replies.",
    title: "What Buyers Should Check Before Choosing a New Home in Sri Lanka",
    excerpt:
      "Not the render on the cover page. Five checks that tell you more about a new home than the headline price.",
    category: "Market insights",
    author: "LankaNewHomes",
    publishDate: "2026-10-01",
    updatedDate: "2026-10-24",
    readMinutes: 3,
    featured: true,
    heroImage: unsplash("1600585154526-990dced4db0d", 2200),
    intro:
      "Before you choose a new home in Sri Lanka, check five things: the real commute, the floor plan, how far construction has got, the full payment plan, and whether the developer replies. The counts below come from the 107 projects on LankaNewHomes in October 2026.",
    sections: [
      {
        heading: "How far is it from the places you go every day?",
        tone: "gray",
        body: "Look past the address. \"Colombo 5\" tells you less than it used to. What matters is the drive to your office, your child's school and the nearest hospital, and how the road feels at rush hour.",
        image: { src: "https://media.lankanewhomes.com/blog/what-buyers-actually-look-for-in-a-new-home-in-sri-lanka/buy-commute-t.png", alt: "Check the commute to your office, the distance to schools and hospitals, and the nearest expressway entrance" },
        callout: "Browse [projects](/projects) by area, and read our [neighbourhood guides](/neighborhoods) to see what each area is like.",
      },
      {
        heading: "Will your furniture fit the floor plan?",
        tone: "sage",
        body: "Compare the plan with what you own now. Room sizes and a clear floor plan help more than a render of the finished living room.",
        image: { src: "https://media.lankanewhomes.com/blog/what-buyers-actually-look-for-in-a-new-home-in-sri-lanka/buy-plan-t.png", alt: "Place your furniture in the plan and check room sizes" },
      },
      {
        heading: "How far along is construction?",
        tone: "cream",
        body: "\"Under construction\" can mean foundations poured last month or handover in six weeks. It changes the price you should expect and the risk you take on.",
        image: { src: "https://media.lankanewhomes.com/blog/what-buyers-actually-look-for-in-a-new-home-in-sri-lanka/buy-progress-t.png", alt: "Ask whether the building is at foundations or finishing, ask for dated photos and ask for the handover date in writing" },
        callout: "No dated photos on the listing? Ask the developer for some before you pay a deposit.",
      },
      {
        heading: "What is the full payment plan?",
        tone: "gray",
        body: "A price means little without the deposit, the stage payments and the amount due at handover. When two similar homes cost about the same, the one with the clearer plan is the safer choice.",
        image: { src: "https://media.lankanewhomes.com/blog/what-buyers-actually-look-for-in-a-new-home-in-sri-lanka/buy-payment-t.png", alt: "Ask for the deposit, the stage payments and the amount due at handover" },
        callout: "Put every figure in writing before you pay a deposit.",
      },
      {
        heading: "Does the developer reply?",
        tone: "sage",
        body: "A same-day reply to your first message is a good sign. Buyers who ask the same question of two developers learn a lot from the difference.",
        image: { src: "https://media.lankanewhomes.com/blog/what-buyers-actually-look-for-in-a-new-home-in-sri-lanka/buy-reply-t.png", alt: "A same-day reply is a good sign; compare the answers from two developers; look for the Responds within 24 hours badge" },
        callout: "Look for the \"Responds within 24 hours\" badge on a [project page](/projects).",
      },
    ],
    cta: {
      heading: "Find your next home.",
      body: "Browse new homes and land across Sri Lanka.",
      links: [
        { label: "Browse new homes", href: "/projects" },
        { label: "Browse land", href: "/land" },
      ],
    },
  },
  "sri-lanka-new-home-market-october-2026": {
    slug: "sri-lanka-new-home-market-october-2026",
    path: "/blog/sri-lanka-new-home-market-october-2026",
    metaTitle: "Sri Lanka Homes for Sale: New-Home Market, Oct 2026",
    metaDescription:
      "How the Sri Lankan new-home market looks in October 2026: rising condominium prices, fewer sales, higher borrowing costs, and what 107 projects and 349 land plots show.",
    title: "Sri Lanka Homes for Sale: How the New-Home Market Looks in October 2026",
    excerpt:
      "Prices are still climbing while fewer homes change hands, and borrowing costs more. What the Central Bank data says, and what developers' prices and floor plans on LankaNewHomes show.",
    category: "Market insights",
    author: "LankaNewHomes",
    publishDate: "2026-10-02",
    updatedDate: "2026-10-24",
    readMinutes: 5,
    draft: true,
    heroImage: "https://media.lankanewhomes.com/projects/edmonton-bliss-residencies/gallery/edmonton-bliss-residencies_aerial-skyline-view.jpg",
    heroImageAlt: "Aerial view of the Colombo skyline with new apartment towers",
    intro:
      "New condominium prices in Colombo are rising quickly, fewer buyers are completing purchases, and borrowing got more expensive in May. This article combines the latest Central Bank and industry data with the published prices, floor plans and land listings from the 107 projects and 349 land plots on LankaNewHomes in October 2026.",
    sections: [
      {
        heading: "Are new-home prices still rising?",
        tone: "gray",
        body: "Yes, but fewer homes are changing hands. The Central Bank of Sri Lanka's condominium survey for the first quarter of 2026 covers the Colombo District. Most units in completed projects were already sold, and most buyers were Sri Lankan residents paying with their own funds.",
        image: { src: "https://media.lankanewhomes.com/blog/sri-lanka-new-home-market-october-2026/mkt-prices-t.png", alt: "New condominium price index up 18.5 per cent, sales volume index down 15.2 per cent, Colombo District 65 per cent of sales" },
        callout: "Land moved the same way: Colombo District land prices were reported up 31.9 per cent year on year by March 2026.",
      },
      {
        heading: "Who is buying, and at what price?",
        tone: "sage",
        body: "Buyers are moving up the price ladder. Market reports of the Central Bank data show that price growth is partly the result of which homes were sold: fewer mid-priced purchases and more at the top.",
        image: { src: "https://media.lankanewhomes.com/blog/sri-lanka-new-home-market-october-2026/mkt-mix-t.png", alt: "Apartments above Rs. 75 million rose from 11 to 29 per cent of sales; the Rs. 25 to 50 million band fell from 49 to 29 per cent" },
        callout: "Asking prices are what sellers hope to get, not what buyers pay.",
      },
      {
        heading: "What does borrowing cost now?",
        tone: "cream",
        body: "More than a year ago. The Central Bank raised its policy rate by 100 basis points in May and held it on 30 September 2026. It expects inflation to stay in the high single digits until early 2027, and the economy grew 4.7 per cent in the first half of the year.",
        image: { src: "https://media.lankanewhomes.com/blog/sri-lanka-new-home-market-october-2026/mkt-rates-t.png", alt: "Policy rate 8.75 per cent, inflation 8.0 per cent in August, housing-loan rates of roughly 12.5 to 15.5 per cent at two large banks" },
        callout: "With loans costing more, compare the deposit, the stage payments and the balance at handover, not only the price.",
      },
      {
        heading: "What are developers asking on LankaNewHomes?",
        tone: "gray",
        body: "These are each developer's own \"from\" price for its lowest-priced unit, not a typical price and not a sale price. 35 projects publish no price, and only 29 of the 107 publish a deposit or payment plan.",
        image: { src: "https://media.lankanewhomes.com/blog/sri-lanka-new-home-market-october-2026/mkt-asking-t.png", alt: "72 of 107 projects publish a starting price, from Rs. 19.5 million to Rs. 317.5 million, in four price bands" },
        callout: "Before you visit, ask for the full price list and payment plan. A starting price describes only one unit.",
      },
      {
        heading: "What is actually being built?",
        tone: "sage",
        body: "Mostly homes with two or three bedrooms. The floor plans developers publish show what they expect buyers to want, and many buyers are paying for homes that will take years to finish.",
        image: { src: "https://media.lankanewhomes.com/blog/sri-lanka-new-home-market-october-2026/mkt-built-t.png", alt: "628 floor plans, mostly two and three bedrooms; 54 projects now selling; handover years from 2026 to 2031" },
        callout: "Check how far construction has got, using dated photos where the developer provides them.",
      },
      {
        heading: "Where does tourism meet property?",
        tone: "cream",
        body: "On the coast and in the hills. Several newer projects are hotel residencies in tourist areas, and the Sri Lanka Tourism Development Authority counted more than 1.64 million international arrivals by late September 2026, with India, the United Kingdom and China the largest sources.",
        image: { src: "https://media.lankanewhomes.com/blog/sri-lanka-new-home-market-october-2026/mkt-coast-t.png", alt: "Hotel residency starting prices: Sigiriya Rs. 26.6 million, Hikkaduwa Rs. 28 million, Negombo Rs. 39.4 million, Nuwara Eliya Rs. 72 million" },
        callout: "Developers often advertise rental or capital-gain projections. Treat them as marketing until you have the rental terms and the management agreement in writing.",
      },
      {
        heading: "How much land is for sale, and at what price?",
        tone: "gray",
        body: "A lot of plots, with wide gaps in price. Where plot sizes are published they run from 1 to 94 perches. Only 3 listings publish a total price, so compare per-perch prices in the same area.",
        image: { src: "https://media.lankanewhomes.com/blog/sri-lanka-new-home-market-october-2026/mkt-land-t.png", alt: "349 land plots, 135 in the Colombo District, 259 priced per perch from Rs. 65,000 to Rs. 6,950,000" },
        bullets: [
          "Lowest published price per perch: Rs. 65,000 in Colombo, Rs. 70,000 in Galle, Rs. 75,000 in Kalutara, Rs. 77,500 in Gampaha and Rs. 85,000 in Kandy.",
          "Location, road frontage and utilities explain much of the spread. Browse [land for sale](/land) by area.",
        ],
      },
      {
        heading: "What does this mean if you are buying?",
        tone: "sage",
        body: "Four things. Ask for the price list and payment plan before you visit. Compare deposit, stage payments and the balance at handover. Check construction progress. And if you are a foreign buyer, get legal advice first.",
        bullets: [
          "Foreign buyers: condominium units in a registered condominium can be bought on any level, provided the full price is paid in advance by inward foreign remittance. Freehold land is closed to foreigners, who can lease it for up to 99 years.",
          "Confirm the current rules with an attorney-at-law before you pay a deposit.",
        ],
        callout: "This article is general information, not financial or legal advice.",
      },
      {
        heading: "How reliable are these numbers?",
        tone: "cream",
        body: "Reliable for what they cover, and no more.",
        bullets: [
          "Central Bank figures come from its first-quarter 2026 condominium survey, which covers the Colombo District and other major cities. Interest-rate and inflation figures are from its 30 September 2026 policy statement.",
          "Prices on LankaNewHomes are the starting prices developers publish. They are not transaction prices, and some developers publish none.",
          "The tourism figure is from the tourism authority's published arrivals.",
        ],
      },
    ],
    cta: {
      heading: "See the homes behind the numbers.",
      body: "Browse new homes and land across Sri Lanka, with floor plans and developer prices.",
      links: [
        { label: "Browse new homes", href: "/projects" },
        { label: "Browse land", href: "/land" },
      ],
    },
  },
  "before-buying-land-in-sri-lanka": {
    slug: "before-buying-land-in-sri-lanka",
    path: "/blog/before-buying-land-in-sri-lanka",
    metaTitle: "Buying Land in Sri Lanka: A Simple Guide",
    metaDescription:
      "Buying land in Sri Lanka? Check the title, the survey plan and what you may build before you pay. A short guide to perches, deeds and costly mistakes.",
    title: "Before Buying Land in Sri Lanka",
    excerpt:
      "A simple guide to choosing the right land, understanding the land structure, and avoiding costly mistakes.",
    category: "Buying guide",
    author: "LankaNewHomes",
    publishDate: "2026-10-23",
    updatedDate: "2026-10-24",
    readMinutes: 3,
    heroImage: "https://media.lankanewhomes.com/lands/isla-hokandara/gallery/isla-hokandara_photo-01.png",
    heroImageAlt: "Aerial view of a gated residential plot development with tarred internal roads in Hokandara, Sri Lanka",
    intro:
      "Before you pay for land in Sri Lanka, have an attorney-at-law check the title, read the deed and survey plan, and confirm what you may build. This short guide shows how. It is general guidance, not legal advice.",
    sections: [
      {
        heading: "What should you decide before buying land in Sri Lanka?",
        tone: "gray",
        body: "Decide what the land is for first. It shapes every other choice. Still choosing between a plot and a finished home? Read [what buyers look for in a new home](/blog/what-buyers-actually-look-for-in-a-new-home-in-sri-lanka).",
        image: { src: "https://media.lankanewhomes.com/blog/before-buying-land-in-sri-lanka/land-purpose-t.png", alt: "Three common reasons to buy land: a home to live in, an investment, or farming and a retreat" },
        callout: "Write down your purpose, your full budget including costs after purchase, and the largest size you would use.",
      },
      {
        heading: "How is land measured and priced in Sri Lanka?",
        tone: "sage",
        body: "On LankaNewHomes, 259 of the 349 [land listings](/land) publish a price per perch, from Rs. 65,000 to Rs. 6,950,000. To see what an acre looks like, open the [1 acre land page](/land/1-acre-land-for-sale-in-sri-lanka).",
        image: { src: "https://media.lankanewhomes.com/blog/before-buying-land-in-sri-lanka/land-measures-t.png", alt: "1 acre equals 4 roods equals 160 perches" },
        callout: "Compare plots in the same area with similar road access. The [lowest-priced plots](/land/cheap-land-for-sale-in-sri-lanka) and the [land around Colombo](/land/best-land-for-sale-in-colombo) show how far apart prices can be.",
      },
      {
        heading: "What documents should you check when buying land?",
        tone: "cream",
        body: "Check two documents: the deed and the survey plan. Ask to see both.",
        image: { src: "https://media.lankanewhomes.com/blog/before-buying-land-in-sri-lanka/land-documents-v2-t.png", alt: "Read the deed and the survey plan, then match them to the land" },
      },
      {
        heading: "How do you check the title of land in Sri Lanka?",
        tone: "gray",
        body: "Ask an attorney-at-law to trace the title at the Land Registry before you pay. It is the most important step, and worth paying for.",
        image: { src: "https://media.lankanewhomes.com/blog/before-buying-land-in-sri-lanka/land-title-t.png", alt: "What an attorney-at-law checks in a land title: registered owner, ownership history and anything attached to the land" },
        callout: "Many listings do not state the type of title, so ask in writing. Keep any reservation payment small until the title is cleared.",
      },
      {
        heading: "What can you build on the land you buy?",
        tone: "sage",
        body: "Only what the approvals allow. A plot is worth what you can legally do on it, so ask the local authority which approvals your building needs.",
        image: { src: "https://media.lankanewhomes.com/blog/before-buying-land-in-sri-lanka/land-build-t.png", alt: "What decides what you can build: land classification, approved plan, building lines and approvals" },
        callout: "If the seller cannot show an approval, ask the local authority directly before you commit.",
      },
      {
        heading: "What should you check when you visit the land?",
        tone: "cream",
        body: "Visit more than once, at different times of day, and after rain if you can.",
        image: { src: "https://media.lankanewhomes.com/blog/before-buying-land-in-sri-lanka/land-site-visit-t.png", alt: "What to check on site: road, utilities, drainage and boundaries" },
        bullets: [
          "A plot behind other plots needs a legal right of way. Ask to see it in the deed.",
          "Ask about road widening or other public projects nearby. Our [neighbourhood guides](/neighborhoods) describe many areas, and the [rural land listings](/land/rural-land-for-sale-in-sri-lanka) cover plots outside Colombo, Gampaha and Kalutara.",
        ],
      },
      {
        heading: "What are the costly mistakes when buying land?",
        tone: "gray",
        body: "Five mistakes cause most of the damage.",
        image: { src: "https://media.lankanewhomes.com/blog/before-buying-land-in-sri-lanka/land-mistakes-t.png", alt: "Five costly mistakes when buying land" },
        callout: "Ask your lawyer for the full cost: stamp duty, legal and notary fees, and registration. If someone sells for the owner under a power of attorney, check their authority. Not a Sri Lankan citizen? Special rules apply, so get legal advice first.",
      },
    ],
    cta: {
      heading: "Find land with the details you need.",
      body: "Browse land for sale across Sri Lanka.",
      links: [
        { label: "Browse all land", href: "/land" },
        { label: "Land in Colombo", href: "/land/best-land-for-sale-in-colombo" },
      ],
    },
  },
};

export function buildBlogMetadata(post: BlogPost): Metadata {
  return withSocial(
    {
      title: post.metaTitle,
      description: post.metaDescription,
      alternates: { canonical: post.path },
      ...(post.draft ? { robots: { index: false, follow: false } } : {}),
    },
    { type: "article", image: post.heroImage, imageAlt: post.metaTitle },
  );
}

export function formatBlogDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}
