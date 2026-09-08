"use client";

import { useCallback } from "react";
import { useLanguage } from "@/components/layout/language-provider";
import { translateFromPrice, translateListingString } from "@/lib/i18n/listing-strings";
import type { Project } from "@/types";

// t("Beds") → the site language's word for it (English unchanged). Also
// exposes the language so callers can pick project-level translations.
export function useListingT() {
  const { language } = useLanguage();
  const t = useCallback((text: string) => translateListingString(language, text), [language]);
  const tPrice = useCallback((text: string) => translateFromPrice(language, text), [language]);
  return { language, t, tPrice };
}

// Per-project prose in the current language, falling back to English field
// by field (a project may have a Sinhala summary but no description yet).
export function localizedProjectCopy(project: Pick<Project, "summary" | "description" | "highlights" | "translations">, language: "en" | "si" | "ta") {
  const tr = language === "en" ? undefined : project.translations?.[language];
  return {
    summary: tr?.summary?.trim() || project.summary,
    description: tr?.description?.trim() || project.description,
    highlights: tr?.highlights?.length ? tr.highlights : project.highlights ?? [],
    isTranslated: Boolean(tr?.summary || tr?.description || tr?.highlights?.length),
  };
}
