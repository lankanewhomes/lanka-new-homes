import type { Land, Project } from "@/types";
import { formatLkr } from "@/lib/format";

// Plain-language questions and answers for every project and land page, built ONLY from the listing's own fields: a question is left out
// when its data is missing, nothing is estimated and no price is derived. They are shown on the page and sent as FAQPage structured data, so
// search engines and AI assistants (Google AI Overviews, ChatGPT, Perplexity) can quote a short, direct answer (owner, 2026-10-16).

export type ListingFaq = { question: string; answer: string };

function list(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

const clean = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export function buildProjectFaqs(project: Project, neighborhoodName?: string): ListingFaq[] {
  const name = project.name;
  const faqs: ListingFaq[] = [];
  const place = [clean(project.location), clean(project.city) && !clean(project.location).includes(clean(project.city)) ? clean(project.city) : "", clean(project.district)].filter(Boolean);
  if (place.length) {
    faqs.push({
      question: `Where is ${name} located?`,
      answer: `${name} is located at ${place.join(", ")}.${neighborhoodName ? ` It sits in the ${neighborhoodName} area; see the neighbourhood guide for what is nearby.` : ""}`,
    });
  }
  if (project.developerName) {
    const extra = [project.architectName ? `The architect is ${project.architectName}.` : "", project.contractor ? `The main contractor is ${project.contractor}.` : ""].filter(Boolean).join(" ");
    faqs.push({ question: `Who is the developer of ${name}?`, answer: `${name} is developed by ${project.developerName}. ${extra}`.trim() });
  }
  const facts: string[] = [];
  if (clean(project.type)) facts.push(`a ${clean(project.type).toLowerCase()} development`);
  if (project.units > 0) facts.push(`${project.units} ${project.units === 1 ? "unit" : "units"}`);
  if (project.floors > 0) facts.push(`${project.floors} floors`);
  if (clean(project.bedrooms)) facts.push(`${clean(project.bedrooms)} bedrooms`);
  if (clean(project.floorAreaRange)) facts.push(`${clean(project.floorAreaRange)} sq ft of floor area`);
  if (facts.length) faqs.push({ question: `What kind of property is ${name}?`, answer: `${name} is ${list(facts)}, as published by the developer.` });
  if (project.startingPriceLkr > 0 && clean(project.priceRange)) {
    faqs.push({ question: `How much does ${name} cost?`, answer: `The developer's published pricing for ${name} is ${clean(project.priceRange).replace(/^From/, "from")}. Prices can change, so confirm the current figure with the developer through the enquiry form on this page.` });
  }
  if (project.status) {
    const when = project.completionYear > 0 ? ` Completion is shown as ${project.completionYear}.` : "";
    faqs.push({ question: `Is ${name} ready or still under construction?`, answer: `${name} is listed as ${project.status}.${when}` });
  }
  const amenities = (project.amenities ?? []).map((item) => item.name).filter(Boolean);
  if (amenities.length) faqs.push({ question: `What amenities does ${name} have?`, answer: `${name} offers ${list(amenities.slice(0, 14))}${amenities.length > 14 ? " and more" : ""}.` });
  const plans = (project.floorPlans ?? []).map((plan) => plan.planName).filter(Boolean);
  if (plans.length) faqs.push({ question: `What floor plans are available at ${name}?`, answer: `${name} has ${plans.length} floor ${plans.length === 1 ? "plan" : "plans"} on LankaNewHomes: ${list(plans.slice(0, 10))}${plans.length > 10 ? " and more" : ""}. Open any plan for its size, rooms and layout.` });
  const near = (project.nearby ?? []).filter((item) => item.name).slice(0, 6).map((item) => (item.distanceKm ? `${item.name} (${item.distanceKm} km)` : item.name));
  if (near.length) faqs.push({ question: `What is near ${name}?`, answer: `Places near ${name} include ${list(near)}.` });
  faqs.push({
    question: `How can I enquire about ${name}?`,
    answer: `Use the enquiry form or the WhatsApp button on this page. LankaNewHomes passes your message to ${project.developerName || "the developer"}, who replies directly with availability, prices and a viewing.`,
  });
  return faqs;
}

export function buildLandFaqs(land: Land): ListingFaq[] {
  const name = land.title;
  const faqs: ListingFaq[] = [];
  const place = [clean(land.location), clean(land.city) && !clean(land.location).includes(clean(land.city)) ? clean(land.city) : "", clean(land.district)].filter(Boolean);
  if (place.length) faqs.push({ question: `Where is ${name}?`, answer: `${name} is located at ${place.join(", ")}.` });
  if (land.sellerName) faqs.push({ question: `Who is selling ${name}?`, answer: `${name} is offered by ${land.sellerName}.` });
  const size = land.landSizePerches > 0 ? (land.landSizePerchesMax && land.landSizePerchesMax > land.landSizePerches ? `${land.landSizePerches} to ${land.landSizePerchesMax} perches` : `${land.landSizePerches} perches`) : "";
  const total = land.plots?.length || land.plotCount || 0;
  const bits = [size ? `plot sizes of ${size}` : "", total > 0 ? `${total} plots` : "", land.landUse?.length ? `${land.landUse.join(" and ").toLowerCase()} use` : ""].filter(Boolean);
  if (bits.length) faqs.push({ question: `How big is ${name}?`, answer: `${name} has ${list(bits)}, as published by the seller.` });
  if (land.priceLkr > 0) faqs.push({ question: `How much does ${name} cost?`, answer: `The published price for ${name} is ${formatLkr(land.priceLkr)}. Confirm the current price with the seller through the enquiry form on this page.` });
  else if (land.pricePerPerchLkrMin && land.pricePerPerchLkrMin > 0) {
    const max = land.pricePerPerchLkrMax && land.pricePerPerchLkrMax > land.pricePerPerchLkrMin ? ` to ${formatLkr(land.pricePerPerchLkrMax)}` : "";
    faqs.push({ question: `What is the price per perch at ${name}?`, answer: `The published price per perch at ${name} is ${formatLkr(land.pricePerPerchLkrMin)}${max}.` });
  }
  const docs = [clean(land.titleType) ? `the title is ${clean(land.titleType)}` : "", clean(land.surveyPlanStatus) ? `the survey plan status is ${clean(land.surveyPlanStatus).toLowerCase()}` : ""].filter(Boolean);
  if (docs.length) faqs.push({ question: `What is the title and survey status of ${name}?`, answer: `For ${name}, ${list(docs)}. Ask the seller for the deed and survey plan before you pay a deposit.` });
  const access = [clean(land.roadAccess) ? `road access: ${clean(land.roadAccess)}` : "", land.roadWidthFt ? `road width ${land.roadWidthFt} ft` : "", clean(land.electricity) ? `electricity: ${clean(land.electricity)}` : "", clean(land.water) ? `water: ${clean(land.water)}` : ""].filter(Boolean);
  if (access.length) faqs.push({ question: `Does ${name} have road access, water and electricity?`, answer: `The published details for ${name} are ${list(access)}.` });
  if (land.status) faqs.push({ question: `Is ${name} still available?`, answer: `${name} is listed as ${land.status}.` });
  faqs.push({ question: `How can I enquire about ${name}?`, answer: `Use the enquiry form or the WhatsApp button on this page. LankaNewHomes passes your message to ${land.sellerName || "the seller"}, who replies directly with plot availability, prices and a site visit.` });
  return faqs;
}
