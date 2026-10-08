import type { Project } from "@/types";

// The homepage only draws listing cards, search suggestions and counts, but
// it receives every project and land as props — which Next serialises into
// the page HTML. Full records (floor plans, galleries, descriptions,
// translations…) made the homepage ~5.6 MB. Keep only what the cards read:
// name, location, price, status, hero image and a short photo carousel.
const CARD_PHOTOS = 6;

export function slimForHome(project: Project): Project {
  return {
    ...project,
    summary: "",
    description: "",
    highlights: undefined,
    translations: undefined,
    ownershipServices: undefined,
    paymentPlanItems: undefined,
    constructionUpdates: undefined,
    unitFeatures: undefined,
    amenities: [],
    nearby: [],
    // Bedroom search reads each plan's bedroom count — keep just that.
    floorPlans: (project.floorPlans ?? []).map((plan) => ({ bedrooms: plan.bedrooms }) as Project["floorPlans"][number]),
    gallery: project.gallery.slice(0, 12).filter((item) => !/\/(amenities|floor-plans|road-map|block-plan)\//.test(item.image)).slice(0, CARD_PHOTOS).map((item) => ({ label: "", image: item.image })),
    // Some rows still carry a large embedded `developer` blob the cards never read.
    ...({ developer: undefined } as object),
  };
}

export function countFloorPlans(projects: Project[]) {
  return projects.reduce((total, project) => total + (project.floorPlans?.length ?? 0), 0);
}
