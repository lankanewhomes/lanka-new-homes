"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type SiteLanguage = "en" | "ta" | "si";

type LanguageContextValue = {
  language: SiteLanguage;
  setLanguage: (lang: SiteLanguage) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "lankaliving-language";

const htmlLangMap: Record<SiteLanguage, string> = {
  en: "en",
  ta: "ta",
  si: "si",
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SiteLanguage>("en");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as SiteLanguage | null;
    if (saved === "en" || saved === "ta" || saved === "si") {
      setLanguageState(saved);
      document.documentElement.lang = htmlLangMap[saved];
      return;
    }
    document.documentElement.lang = htmlLangMap.en;
  }, []);

  const setLanguage = (lang: SiteLanguage) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = htmlLangMap[lang];
  };

  const value = useMemo(() => ({ language, setLanguage }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}
