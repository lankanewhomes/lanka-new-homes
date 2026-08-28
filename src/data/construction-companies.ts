import type { ConstructionCompany } from "@/types";

// Placeholder directory listings. Replace with real construction companies as
// they're onboarded — this file follows the same seed-data pattern as
// src/data/projects.ts.
export const constructionCompanies: ConstructionCompany[] = [
  {
    slug: "isuru-builders",
    name: "Isuru Builders",
    logo: "https://images.unsplash.com/photo-1541976590-713941681591?q=80&w=400&auto=format&fit=crop",
    description:
      "Isuru Builders is a Colombo-based home construction company delivering custom houses and small residential developments across the Western Province.",
    location: "Colombo, Western Province",
    categories: ["general", "colombo"],
    yearsInBusiness: 18,
    website: "https://example.com/isuru-builders",
    email: "info@isurubuilders.lk",
    phone: "+94 11 234 5678",
  },
  {
    slug: "lanka-poolworks",
    name: "Lanka Poolworks",
    logo: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=400&auto=format&fit=crop",
    description:
      "Lanka Poolworks designs and builds residential and resort swimming pools island-wide, from concept through waterproofing and finishing.",
    location: "Colombo, Western Province",
    categories: ["swimming-pools", "colombo"],
    yearsInBusiness: 12,
    website: "https://example.com/lanka-poolworks",
    email: "hello@lankapoolworks.lk",
    phone: "+94 11 345 6789",
  },
  {
    slug: "southern-build-consultants",
    name: "Southern Build Consultants",
    logo: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=400&auto=format&fit=crop",
    description:
      "Southern Build Consultants provides construction consulting, quantity surveying, and project management for residential developments in Sri Lanka.",
    location: "Galle, Southern Province",
    categories: ["consulting"],
    yearsInBusiness: 9,
    website: "https://example.com/southern-build-consultants",
    email: "contact@southernbuildconsultants.lk",
    phone: "+94 91 222 3344",
  },
  {
    slug: "kandy-home-construction",
    name: "Kandy Home Construction Co.",
    logo: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=400&auto=format&fit=crop",
    description:
      "Kandy Home Construction Co. builds new homes and villas across the Central Province, handling everything from foundation to handover.",
    location: "Kandy, Central Province",
    categories: ["general"],
    yearsInBusiness: 15,
    website: "https://example.com/kandy-home-construction",
    email: "info@kandyhomeconstruction.lk",
    phone: "+94 81 223 4455",
  },
];
