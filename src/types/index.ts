export type ProjectStatus =
  | "Now Selling"
  | "Coming Soon"
  | "Under Construction"
  | "Launching Soon"
  | "Nearly Sold Out"
  | "Nearly Complete";

export type Amenity = {
  name:
    | "Pool"
    | "Gym"
    | "Rooftop"
    | "Parking"
    | "Security"
    | "CCTV"
    | "Garden"
    | "Children's Area"
    | "Clubhouse"
    | "EV Charging"
    | "Concierge";
  icon: string;
};

export type FloorPlan = {
  id: string;
  planName: string;
  bedrooms: number;
  bathrooms: number;
  floorAreaSqFt: number;
  startingPriceLkr: number;
  image: string;
  availability: "Available" | "Limited" | "Sold Out";
};

export type Unit = {
  id: string;
  projectSlug: string;
  unitNumber: string;
  floor: number;
  apartmentType: string;
  areaSqFt: number;
  priceLkr: number;
  status: "Available" | "Reserved" | "Sold";
};

export type NearbyPlace = {
  category: "School" | "Hospital" | "Shopping" | "Restaurant" | "Transport" | "Landmark";
  name: string;
  distanceKm: number;
};

export type Developer = {
  slug: string;
  name: string;
  logo: string;
  description: string;
  location: string;
  establishedYear: number;
  yearsInBusiness: number;
  activeProjects: number;
  completedProjects: number;
  website: string;
  email: string;
  phone: string;
};

export type Project = {
  slug: string;
  name: string;
  developerSlug: string;
  developerName: string;
  location: string;
  district: string;
  city: string;
  province: string;
  neighborhood: string;
  type: string;
  status: ProjectStatus;
  launchDate: string;
  completionYear: number;
  constructionStatus: string;
  startingPriceLkr: number;
  priceRange: string;
  bedrooms: string;
  bathrooms: string;
  floorAreaRange: string;
  units: number;
  floors: number;
  parking: string;
  security: string;
  ownership: string;
  paymentPlan: string;
  summary: string;
  description: string;
  heroImage: string;
  gallery: { label: string; image: string }[];
  videos?: { label: string; embedUrl?: string; thumbnail?: string }[];
  virtualTours?: { label: string; url: string }[];
  interactiveMapUrl?: string;
  amenities: Amenity[];
  floorPlans: FloorPlan[];
  nearby: NearbyPlace[];
  coordinates: { lat: number; lng: number };
  contact: {
    name: string;
    email: string;
    phone: string;
  };
};

export type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  preferredContactMethod: "Email" | "Phone" | "WhatsApp";
  message: string;
  projectSlug: string;
  developerSlug: string;
  date: string;
  status: "New" | "Contacted" | "Qualified" | "Closed";
};

export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  category: "Buying Guide" | "Market Insight" | "Finance";
  readTime: string;
  image: string;
};

export type Location = {
  slug: string;
  name: string;
  district: string;
  province: string;
  projectCount: number;
  image: string;
  summary: string;
};
