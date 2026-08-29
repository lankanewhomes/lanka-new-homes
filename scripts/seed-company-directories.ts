// One-time: seeds dummy listings into the sales_companies, marketing_companies,
// and architects Supabase tables (the CompanyProfile-shaped partner
// directories linked from a project's Connected Pages — see
// src/lib/company-profile-store.ts). Run with:
//   npx tsx scripts/seed-company-directories.ts
// Safe to re-run: skips any slug that already exists in its table.

import path from "node:path";
import { config } from "dotenv";
import type { CompanyProfile } from "../src/types";

config({ path: path.join(process.cwd(), ".env.local") });

type SeedEntry = Omit<CompanyProfile, "slug">;

const salesCompanies: SeedEntry[] = [
  {
    name: "Prime Homes Realty",
    logo: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=400&auto=format&fit=crop",
    description: "Prime Homes Realty is a Colombo-based sales brokerage representing new-build condominium and housing developments across the Western Province, from pre-launch reservations through to handover.",
    location: "Colombo 03, Western Province",
    yearsInBusiness: 12,
    website: "https://example.com/prime-homes-realty",
    email: "sales@primehomes.lk",
    phone: "+94 11 258 4410",
    officeHours: [
      { day: "Monday", open: true, from: "09:00", to: "18:00" },
      { day: "Tuesday", open: true, from: "09:00", to: "18:00" },
      { day: "Wednesday", open: true, from: "09:00", to: "18:00" },
      { day: "Thursday", open: true, from: "09:00", to: "18:00" },
      { day: "Friday", open: true, from: "09:00", to: "18:00" },
      { day: "Saturday", open: true, from: "10:00", to: "16:00" },
      { day: "Sunday", open: false },
    ],
    socialLinks: {
      facebook: "https://facebook.com/primehomesrealty",
      instagram: "https://instagram.com/primehomesrealty",
      linkedin: "https://linkedin.com/company/primehomesrealty",
      whatsapp: "https://wa.me/94112584410",
    },
  },
  {
    name: "Coastal Living Sales Partners",
    logo: "https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=400&auto=format&fit=crop",
    description: "Coastal Living Sales Partners manages on-site sales galleries and reservation programs for beachfront and southern-coast residential projects, from Galle to Mirissa.",
    location: "Galle Fort, Southern Province",
    yearsInBusiness: 8,
    website: "https://example.com/coastal-living-sales",
    email: "info@coastallivingsales.lk",
    phone: "+94 91 224 7710",
    officeHours: [
      { day: "Monday", open: true, from: "09:30", to: "17:30" },
      { day: "Tuesday", open: true, from: "09:30", to: "17:30" },
      { day: "Wednesday", open: true, from: "09:30", to: "17:30" },
      { day: "Thursday", open: true, from: "09:30", to: "17:30" },
      { day: "Friday", open: true, from: "09:30", to: "17:30" },
      { day: "Saturday", open: true, from: "09:30", to: "17:30" },
      { day: "Sunday", open: true, from: "10:00", to: "15:00" },
    ],
    socialLinks: {
      facebook: "https://facebook.com/coastallivingsales",
      instagram: "https://instagram.com/coastallivingsales",
      whatsapp: "https://wa.me/94912247710",
    },
  },
  {
    name: "Kandy Hills Property Sales",
    logo: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?q=80&w=400&auto=format&fit=crop",
    description: "Kandy Hills Property Sales handles buyer inquiries, site visits, and closings for hillside villa and townhouse developments in and around Kandy.",
    location: "Kandy, Central Province",
    yearsInBusiness: 6,
    website: "https://example.com/kandy-hills-sales",
    email: "hello@kandyhillssales.lk",
    phone: "+94 81 220 3355",
    officeHours: [
      { day: "Monday", open: true, from: "09:00", to: "17:00" },
      { day: "Tuesday", open: true, from: "09:00", to: "17:00" },
      { day: "Wednesday", open: true, from: "09:00", to: "17:00" },
      { day: "Thursday", open: true, from: "09:00", to: "17:00" },
      { day: "Friday", open: true, from: "09:00", to: "17:00" },
      { day: "Saturday", open: false },
      { day: "Sunday", open: false },
    ],
    socialLinks: {
      facebook: "https://facebook.com/kandyhillssales",
      linkedin: "https://linkedin.com/company/kandyhillssales",
    },
  },
];

const marketingCompanies: SeedEntry[] = [
  {
    name: "Lanka Property Marketing Group",
    logo: "https://images.unsplash.com/photo-1553877522-43269d4ea984?q=80&w=400&auto=format&fit=crop",
    description: "Lanka Property Marketing Group runs digital campaigns, launch events, and brand strategy for new-build residential and mixed-use developments across Sri Lanka.",
    location: "Colombo 05, Western Province",
    yearsInBusiness: 10,
    website: "https://example.com/lanka-property-marketing",
    email: "contact@lpmg.lk",
    phone: "+94 11 259 8820",
    officeHours: [
      { day: "Monday", open: true, from: "08:30", to: "17:30" },
      { day: "Tuesday", open: true, from: "08:30", to: "17:30" },
      { day: "Wednesday", open: true, from: "08:30", to: "17:30" },
      { day: "Thursday", open: true, from: "08:30", to: "17:30" },
      { day: "Friday", open: true, from: "08:30", to: "17:30" },
      { day: "Saturday", open: false },
      { day: "Sunday", open: false },
    ],
    socialLinks: {
      facebook: "https://facebook.com/lankapropertymarketing",
      instagram: "https://instagram.com/lankapropertymarketing",
      linkedin: "https://linkedin.com/company/lankapropertymarketing",
      twitter: "https://x.com/lpmg_lk",
      youtube: "https://youtube.com/@lankapropertymarketing",
    },
  },
  {
    name: "Skyline Digital Marketing",
    logo: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=400&auto=format&fit=crop",
    description: "Skyline Digital Marketing specializes in performance advertising, virtual tours, and social media management for condominium developers targeting local and diaspora buyers.",
    location: "Colombo 02, Western Province",
    yearsInBusiness: 5,
    website: "https://example.com/skyline-digital-marketing",
    email: "hello@skylinedigital.lk",
    phone: "+94 11 267 3120",
    officeHours: [
      { day: "Monday", open: true, from: "09:00", to: "18:00" },
      { day: "Tuesday", open: true, from: "09:00", to: "18:00" },
      { day: "Wednesday", open: true, from: "09:00", to: "18:00" },
      { day: "Thursday", open: true, from: "09:00", to: "18:00" },
      { day: "Friday", open: true, from: "09:00", to: "18:00" },
      { day: "Saturday", open: true, from: "10:00", to: "14:00" },
      { day: "Sunday", open: false },
    ],
    socialLinks: {
      instagram: "https://instagram.com/skylinedigitallk",
      tiktok: "https://tiktok.com/@skylinedigitallk",
      linkedin: "https://linkedin.com/company/skylinedigitalmarketing",
    },
  },
];

const architects: SeedEntry[] = [
  {
    name: "Studio Meridian Architects",
    logo: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=400&auto=format&fit=crop",
    description: "Studio Meridian Architects designs contemporary residential towers and low-rise housing across Colombo, blending tropical modernism with efficient unit layouts.",
    location: "Colombo 07, Western Province",
    yearsInBusiness: 15,
    website: "https://example.com/studio-meridian",
    email: "studio@meridianarchitects.lk",
    phone: "+94 11 269 4415",
    officeHours: [
      { day: "Monday", open: true, from: "09:00", to: "17:30" },
      { day: "Tuesday", open: true, from: "09:00", to: "17:30" },
      { day: "Wednesday", open: true, from: "09:00", to: "17:30" },
      { day: "Thursday", open: true, from: "09:00", to: "17:30" },
      { day: "Friday", open: true, from: "09:00", to: "17:30" },
      { day: "Saturday", open: false },
      { day: "Sunday", open: false },
    ],
    socialLinks: {
      instagram: "https://instagram.com/studiomeridianarchitects",
      linkedin: "https://linkedin.com/company/studiomeridianarchitects",
    },
  },
  {
    name: "Tharu de Silva & Associates",
    logo: "https://images.unsplash.com/photo-1519452575417-564c1401ecc0?q=80&w=400&auto=format&fit=crop",
    description: "Tharu de Silva & Associates is a boutique architecture practice known for hillside villa design and site-sensitive planning for developments in the Central and Southern Provinces.",
    location: "Kandy, Central Province",
    yearsInBusiness: 22,
    website: "https://example.com/tharu-de-silva-associates",
    email: "info@tdsarchitects.lk",
    phone: "+94 81 222 6690",
    officeHours: [
      { day: "Monday", open: true, from: "08:30", to: "17:00" },
      { day: "Tuesday", open: true, from: "08:30", to: "17:00" },
      { day: "Wednesday", open: true, from: "08:30", to: "17:00" },
      { day: "Thursday", open: true, from: "08:30", to: "17:00" },
      { day: "Friday", open: true, from: "08:30", to: "17:00" },
      { day: "Saturday", open: true, from: "09:00", to: "13:00" },
      { day: "Sunday", open: false },
    ],
    socialLinks: {
      facebook: "https://facebook.com/tdsarchitects",
      linkedin: "https://linkedin.com/company/tdsarchitects",
    },
  },
  {
    name: "Horizon Line Design Studio",
    logo: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=400&auto=format&fit=crop",
    description: "Horizon Line Design Studio provides architectural and interior shell design for mixed-use and beachfront developments along Sri Lanka's southern coast.",
    location: "Galle, Southern Province",
    yearsInBusiness: 9,
    website: "https://example.com/horizon-line-design",
    email: "studio@horizonlinedesign.lk",
    phone: "+94 91 223 8845",
    officeHours: [
      { day: "Monday", open: true, from: "09:00", to: "17:30" },
      { day: "Tuesday", open: true, from: "09:00", to: "17:30" },
      { day: "Wednesday", open: true, from: "09:00", to: "17:30" },
      { day: "Thursday", open: true, from: "09:00", to: "17:30" },
      { day: "Friday", open: true, from: "09:00", to: "17:30" },
      { day: "Saturday", open: false },
      { day: "Sunday", open: false },
    ],
    socialLinks: {
      instagram: "https://instagram.com/horizonlinedesign",
      whatsapp: "https://wa.me/94912238845",
    },
  },
];

async function seed(label: string, table: string, entries: SeedEntry[]) {
  const { createCompanyProfileStore } = await import("../src/lib/company-profile-store");
  const store = createCompanyProfileStore(table);
  const existing = await store.getAll();
  const existingNames = new Set(existing.map((company) => company.name));

  for (const entry of entries) {
    if (existingNames.has(entry.name)) {
      console.log(`  skip (already exists): ${entry.name}`);
      continue;
    }
    const created = await store.create(entry);
    console.log(`  created: ${created.name} -> /${table.replace(/_/g, "-")}/${created.slug}`);
  }
  console.log(`${label}: done (${entries.length} entries checked)`);
}

async function main() {
  console.log("Seeding sales companies...");
  await seed("Sales companies", "sales_companies", salesCompanies);

  console.log("Seeding marketing companies...");
  await seed("Marketing companies", "marketing_companies", marketingCompanies);

  console.log("Seeding architects...");
  await seed("Architects", "architects", architects);
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
