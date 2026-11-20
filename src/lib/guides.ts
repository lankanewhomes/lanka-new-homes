import type { Metadata } from "next";
import { withSocial, type BreadcrumbEntry } from "@/lib/seo";

export type GuideSection = { heading: string; body: string };
export type GuideFaq = { question: string; answer: string };

export type Guide = {
  slug: string;
  path: string;
  breadcrumbs: BreadcrumbEntry[];
  metaTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  sections: GuideSection[];
  faqs: GuideFaq[];
  relatedPaths: string[];
};

export const guides: Record<string, Guide> = {
  "foreigners-buying-property": {
    slug: "foreigners-buying-property",
    path: "/guides/foreigners-buying-property",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "Guides", href: "/guides" }, { label: "Foreigners Buying Property" }],
    metaTitle: "Can Foreigners Buy Property in Sri Lanka?",
    metaDescription: "Can foreigners buy a condo in Sri Lanka? Learn how to buy an apartment in Sri Lanka as a foreigner, ownership rules, and real estate investment options.",
    h1: "Can Foreigners Buy Property in Sri Lanka?",
    intro: "Yes — foreigners can buy a condominium for sale in Sri Lanka, and this guide walks through exactly how. It covers what non-citizens can and cannot own directly, and how to buy an apartment in Sri Lanka as a foreigner without running into ownership restrictions.",
    sections: [
      {
        heading: "What foreigners can buy directly",
        body: "Under the Land (Restrictions on Alienation) Act, foreign buyers can purchase condominium units on or above the 4th floor of a registered condominium property outright, with full freehold title. This is the most common route for real estate investment in Sri Lanka for foreigners, and it applies to most new apartment and condominium projects listed on this site.",
      },
      {
        heading: "Buying below the 4th floor, or land",
        body: "Freehold land and lower-floor units are generally restricted for direct foreign ownership, but can be accessed through a locally incorporated company, a long-term lease (typically up to 99 years), or in partnership with a Sri Lankan co-owner. Villas and standalone homes usually fall under these routes rather than direct freehold purchase.",
      },
      {
        heading: "The buying process",
        body: "The process mirrors a standard property purchase: reserve a unit with the developer, sign a sale and purchase agreement, remit funds through an Inward Investment Account (IIA) at a licensed Sri Lankan bank, and register the transfer of title. Most developers and their sales teams are experienced working with overseas buyers and can guide you through each step.",
      },
    ],
    faqs: [
      { question: "Can foreigners buy a condo in Sri Lanka?", answer: "Yes. Foreigners can buy condominium units on the 4th floor or above with full freehold ownership under Sri Lankan law." },
      { question: "Can foreigners buy an apartment below the 4th floor?", answer: "Direct freehold ownership below the 4th floor is restricted, but foreign buyers can still access these units through a locally incorporated company or a long-term lease structure." },
      { question: "How do foreign buyers pay for property in Sri Lanka?", answer: "Funds are typically remitted in foreign currency through an Inward Investment Account (IIA) opened at a licensed commercial bank in Sri Lanka." },
    ],
    relatedPaths: ["/guides/investment-property", "/guides/golden-visa", "/projects/luxury"],
  },
  "investment-property": {
    slug: "investment-property",
    path: "/guides/investment-property",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "Guides", href: "/guides" }, { label: "Investment Property" }],
    metaTitle: "Investment Property Guide for Sri Lanka",
    metaDescription: "A guide to buying investment condos in Sri Lanka, covering rental yields, new construction real estate, and how to evaluate new development projects.",
    h1: "Investment Property Guide: Sri Lanka",
    intro: "Sri Lanka's new construction real estate market offers a growing range of investment condos, from city-centre apartments to resort-style residences. This guide covers what to evaluate before buying an investment condo in Sri Lanka.",
    sections: [
      {
        heading: "Why buy pre-construction",
        body: "Buying during the pre-construction phase of a new development typically secures the lowest per-square-foot price, with value often appreciating by handover. Combined with staged payment plans, this makes new construction in Sri Lanka real estate an accessible entry point for first-time investors.",
      },
      {
        heading: "Rental demand and yields",
        body: "Colombo apartments near business districts and beachfront or resort-style residences in tourist areas tend to see the strongest rental demand, whether for long-term tenants or short-stay guests. Serviced apartments in particular are built with rental management in mind.",
      },
      {
        heading: "What to check before buying",
        body: "Review the developer's track record on past projects, the payment plan structure, expected completion year, and whether the unit qualifies for foreign freehold ownership (4th floor and above). Compare pricing across similar new development projects before committing.",
      },
    ],
    faqs: [
      { question: "Is Sri Lanka a good place to buy investment property?", answer: "Sri Lanka's new-build condo market offers relatively low entry prices compared to other South and Southeast Asian markets, with rental demand concentrated in Colombo and coastal tourist areas." },
      { question: "What is a typical payment plan for new construction?", answer: "Most developers use a staged payment plan — a down payment at reservation, progress payments tied to construction milestones, and a balance due at handover." },
    ],
    relatedPaths: ["/guides/foreigners-buying-property", "/projects/pre-construction", "/projects/beachfront"],
  },
  "golden-visa": {
    slug: "golden-visa",
    path: "/guides/golden-visa",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "Guides", href: "/guides" }, { label: "Golden Visa" }],
    metaTitle: "Sri Lanka Golden Visa Property Guide",
    metaDescription: "How the Sri Lanka golden visa property route works — residency-by-investment thresholds, eligible property types, and the application process.",
    h1: "Sri Lanka Golden Visa Property Guide",
    intro: "Sri Lanka's residency-by-investment programme allows qualifying property investment to support long-term visa status. This guide explains how the golden visa Sri Lanka property route works.",
    sections: [
      {
        heading: "How the programme works",
        body: "Foreign nationals who invest above the government-set threshold in qualifying real estate — typically new condominium or apartment purchases — can apply for extended residency status, renewable in line with continued ownership of the property.",
      },
      {
        heading: "Eligible property types",
        body: "Condominium units eligible for foreign freehold ownership (4th floor and above) in registered developments are the most straightforward qualifying purchases. Buyers should confirm current thresholds and eligible project status with an immigration advisor before committing, as investment minimums are set by government policy and can change.",
      },
    ],
    faqs: [
      { question: "Does buying property in Sri Lanka grant residency?", answer: "Qualifying property investment above the government-set threshold can support a residency application under Sri Lanka's investment-based visa routes — confirm current thresholds with an immigration advisor, as policy can change." },
      { question: "What property qualifies for the golden visa route?", answer: "New condominium units eligible for foreign freehold ownership are the most common qualifying purchase; land and lower-floor units generally do not qualify directly." },
    ],
    relatedPaths: ["/guides/foreigners-buying-property", "/projects/luxury", "/projects/port-city-colombo"],
  },
  "apartment-prices-in-colombo": {
    slug: "apartment-prices-in-colombo",
    path: "/guides/apartment-prices-in-colombo",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "Guides", href: "/guides" }, { label: "Apartment Prices in Colombo" }],
    metaTitle: "Apartment Prices in Colombo: New Projects 2026",
    metaDescription: "What new apartments cost in Colombo by area: lowest, typical and highest starting prices for Colombo 2, 5, 7, 8 and nearby, with listings in each price range.",
    h1: "Apartment Prices in Colombo",
    intro: "What new apartments cost in Colombo, area by area. The numbers below come straight from developer listings on LankaNewHomes, so they move when prices change. Pick a price range to see the projects in it.",
    sections: [],
    faqs: [
      { question: "How much does a new apartment cost in Colombo?", answer: "On LankaNewHomes, new apartments in Colombo start from about Rs. 30 million in Colombo 14 and Rs. 60 million in Colombo 2, and go above Rs. 300 million for the most premium Colombo 7 projects. See the table above for each area." },
      { question: "Which Colombo area has the cheapest new apartments?", answer: "Of the projects listed here, Colombo 14 has the lowest starting prices, followed by Rajagiriya and Colombo 2. The table above ranks every area by its lowest starting price." },
      { question: "Are these final prices?", answer: "No. They are starting prices for the smallest unit that a developer advertises. Developers change prices, so check the current price on the listing or with the developer." },
      { question: "Can foreigners buy these apartments?", answer: "Yes, foreign buyers can buy condominium units on the 4th floor and above with freehold title. See the foreign buyer guide for the full rules." },
    ],
    relatedPaths: ["/projects/cheap-apartments-for-sale-in-colombo", "/projects/luxury-apartments-for-sale-in-colombo", "/projects/colombo", "/guides/foreigners-buying-property", "/guides/investment-property"],
  },
  "buy-land-in-sri-lanka": {
    slug: "buy-land-in-sri-lanka",
    path: "/guides/buy-land-in-sri-lanka",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "Guides", href: "/guides" }, { label: "Buy Land in Sri Lanka" }],
    metaTitle: "Buy Land in Sri Lanka: Guide for Overseas Buyers",
    metaDescription: "How to buy land in Sri Lanka from overseas: what foreigners can own, the lease and company routes, checks on the deed, and where to find plots for sale.",
    h1: "Buy Land in Sri Lanka as an Overseas Buyer",
    intro: "Sri Lankans living abroad and foreign buyers both ask the same thing: can I buy land in Sri Lanka, and how? This guide covers the ownership rules, the usual routes, and the checks to make before you pay.",
    sections: [
      {
        heading: "Who can own freehold land",
        body: "Sri Lankan citizens can own freehold land. Under the Land (Restrictions on Alienation) Act, a transfer of freehold land to a foreign person, or to a company with majority foreign ownership, is generally taxed at 100 percent of the value, which in practice blocks direct purchase. Rules and exemptions change, so confirm the current position with a Sri Lankan lawyer before you commit.",
      },
      {
        heading: "Routes open to foreign buyers",
        body: "Foreign buyers usually take a long lease of up to 99 years, buy through a Sri Lankan company, or buy a condominium unit on the 4th floor or above, which can be owned freehold. Sri Lankan citizens living abroad can buy land directly. For a first purchase, many overseas buyers choose an apartment, because the title is simpler.",
      },
      {
        heading: "Checks before you pay",
        body: "Ask a lawyer to trace the title back at least 30 years, confirm the survey plan matches the plot on the ground, and check for mortgages, road-widening notices and access to a public road. Never pay a full price before the title has been checked. Prices are quoted per perch (1 perch is about 25.3 square metres).",
      },
      {
        heading: "Where to find plots",
        body: "Browse plots by town on LankaNewHomes, for example land for sale in Homagama, Malabe, Kadawatha, Piliyandala, Horana and Kaduwela. Each listing shows the size in perches, the price per perch and the seller's contact details.",
      },
    ],
    faqs: [
      { question: "Can a foreigner buy land in Sri Lanka?", answer: "Not freehold, in practice: transfers of freehold land to foreigners are generally taxed at 100 percent. Foreigners can lease land for up to 99 years, buy through a Sri Lankan company, or buy an apartment on the 4th floor or above. Confirm current rules with a lawyer." },
      { question: "Can Sri Lankans living abroad buy land?", answer: "Yes. Sri Lankan citizens living overseas can buy land the same way as residents, usually by sending money through a bank and appointing a lawyer or power of attorney." },
      { question: "How is land priced in Sri Lanka?", answer: "Land is priced per perch. A perch is about 25.3 square metres, so a 10-perch plot is about 253 square metres. Price per perch varies widely between Colombo and other towns." },
    ],
    relatedPaths: ["/land", "/guides/foreigners-buying-property", "/guides/investment-property", "/projects/colombo"],
  },
  "house-prices-in-sri-lanka": {
    slug: "house-prices-in-sri-lanka",
    path: "/guides/house-prices-in-sri-lanka",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "Guides", href: "/guides" }, { label: "House Prices in Sri Lanka" }],
    metaTitle: "House Prices in Sri Lanka: New Homes by Town",
    metaDescription: "What new houses and villas cost in Sri Lanka by town: lowest, typical and highest starting prices for Thalawathugoda, Negombo, Kottawa and more, with listings.",
    h1: "House Prices in Sri Lanka",
    intro: "What new houses and villas cost in Sri Lanka, town by town. The numbers come straight from developer listings on LankaNewHomes, so they move when prices change. Pick a price range to see the homes in it.",
    sections: [],
    faqs: [
      { question: "How much does a new house cost in Sri Lanka?", answer: "On LankaNewHomes, new houses and villas start from about Rs. 19.5 million in Kadawatha and Rs. 22 million in Kalutara, and rise above Rs. 100 million for larger homes in Thalawathugoda, Negombo and Digana. See the table above for each town." },
      { question: "Are these final prices?", answer: "No. They are starting prices for the smallest or first house a developer advertises. Developers change prices, so check the listing or ask the developer." },
      { question: "Can foreigners buy a house in Sri Lanka?", answer: "Foreigners usually cannot buy freehold land directly, so houses are normally bought through a long lease or a Sri Lankan company. Apartments on the 4th floor and above can be owned freehold. See the buying guides for details." },
    ],
    relatedPaths: ["/projects/houses-for-sale-in-colombo", "/projects/villas", "/guides/buy-land-in-sri-lanka", "/guides/foreigners-buying-property", "/guides/apartment-prices-in-colombo"],
  },
};

export function buildGuideMetadata(guide: Guide): Metadata {
  return withSocial({
    title: guide.metaTitle,
    description: guide.metaDescription,
    alternates: {
      canonical: guide.path,
    },
  }, { type: "article" });
}
