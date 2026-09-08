import type { FloorPlan, Project } from "@/types";
import { formatLkr } from "@/lib/format";
import type { SiteLanguage } from "@/components/layout/language-provider";
import { translateListingString } from "@/lib/i18n/listing-strings";

// The floor-plan page's Overview is a generated sentence built from the
// plan's own facts (see ProjectDescriptionSection). English keeps its
// original template; Sinhala and Tamil need their own word order, so each
// gets a template here rather than a word-for-word swap. Only facts the
// developer entered are mentioned — nothing is derived.
export function floorPlanSummarySentence(
  language: Exclude<SiteLanguage, "en">,
  floorPlan: FloorPlan,
  project: Pick<Project, "name" | "constructionStatus" | "completionYear">,
  upcomingMoveIn: boolean,
): string {
  const t = (text: string) => translateListingString(language, text);
  const beds = floorPlan.bedrooms > 0 ? floorPlan.bedrooms : 0;
  const baths = floorPlan.bathrooms > 0 ? floorPlan.bathrooms : 0;
  const sqft = floorPlan.floorAreaSqFt > 0 ? floorPlan.floorAreaSqFt.toLocaleString("en-US") : "";
  const status = typeof project.constructionStatus === "string" ? project.constructionStatus.trim() : "";
  const completed = /complete/i.test(status) && project.completionYear > 0 && !upcomingMoveIn;
  const availability = typeof floorPlan.availability === "string" && floorPlan.availability.trim() && floorPlan.availability.trim() !== "-"
    ? floorPlan.availability.trim()
    : "";

  if (language === "si") {
    const facts = [
      beds ? `නිදන කාමර ${beds}` : "",
      baths ? `නාන කාමර ${baths}` : "",
      sqft ? `වර්ග අඩි ${sqft}ක බිම් ප්‍රමාණයක්` : "",
    ].filter(Boolean).join(", ");
    return [
      facts ? `${floorPlan.planName} යනු ${project.name} හි ${facts} සහිත නිවසකි.` : `${floorPlan.planName} යනු ${project.name} හි නිවසකි.`,
      floorPlan.startingPriceLkr > 0 ? `මිල ${formatLkr(floorPlan.startingPriceLkr)} සිට.` : "",
      availability ? `දැනට ${t(availability)}.` : "",
      floorPlan.quickMoveIn ? "ඉක්මන් පදිංචිය සඳහා ලබා ගත හැක." : "",
      status
        ? (completed
          ? `ව්‍යාපෘතිය ${project.completionYear} දී නිම කරන ලදී.`
          : `ව්‍යාපෘතිය ${t(status)}${upcomingMoveIn ? `, පදිංචිය ${project.completionYear} දී අපේක්ෂිතයි` : ""}.`)
        : "",
    ].filter(Boolean).join(" ");
  }

  const facts = [
    beds ? `${beds} படுக்கையறைகள்` : "",
    baths ? `${baths} குளியலறைகள்` : "",
    sqft ? `${sqft} சதுர அடி தளப்பரப்பு` : "",
  ].filter(Boolean).join(", ");
  return [
    facts ? `${floorPlan.planName} என்பது ${project.name} இல் ${facts} கொண்ட வீடு.` : `${floorPlan.planName} என்பது ${project.name} இல் உள்ள வீடு.`,
    floorPlan.startingPriceLkr > 0 ? `விலை ${formatLkr(floorPlan.startingPriceLkr)} இலிருந்து.` : "",
    availability ? `தற்போது ${t(availability)}.` : "",
    floorPlan.quickMoveIn ? "விரைவில் குடியேற கிடைக்கிறது." : "",
    status
      ? (completed
        ? `திட்டம் ${project.completionYear} இல் நிறைவடைந்தது.`
        : `திட்டம் ${t(status)}${upcomingMoveIn ? `, ${project.completionYear} இல் குடியேற எதிர்பார்க்கப்படுகிறது` : ""}.`)
      : "",
  ].filter(Boolean).join(" ");
}
