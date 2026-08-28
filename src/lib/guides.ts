import type { Metadata } from "next";
import type { BreadcrumbEntry } from "@/lib/seo";

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
    metaTitle: "Can Foreigners Buy Property in Sri Lanka? Full Guide",
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
    relatedPaths: ["/guides/investment-property", "/guides/golden-visa", "/projects/colombo/luxury"],
  },
  "investment-property": {
    slug: "investment-property",
    path: "/guides/investment-property",
    breadcrumbs: [{ label: "Home", href: "/" }, { label: "Guides", href: "/guides" }, { label: "Investment Property" }],
    metaTitle: "Investment Property Guide: Buying New Construction in Sri Lanka",
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
    metaTitle: "Sri Lanka Golden Visa: Property Investment Residency Guide",
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
    relatedPaths: ["/guides/foreigners-buying-property", "/projects/colombo/luxury", "/projects/port-city-colombo"],
  },
};

export function buildGuideMetadata(guide: Guide): Metadata {
  return {
    title: guide.metaTitle,
    description: guide.metaDescription,
    alternates: {
      canonical: guide.path,
    },
    openGraph: {
      title: guide.metaTitle,
      description: guide.metaDescription,
      url: guide.path,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: guide.metaTitle,
      description: guide.metaDescription,
    },
  };
}
