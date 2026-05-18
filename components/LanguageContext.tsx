"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Locale, TranslationDictionary, DICTIONARIES } from "@/lib/i18n";

interface LanguageContextProps {
  language: Locale;
  setLanguage: (lang: Locale) => void;
  dict: TranslationDictionary;
  t: (key: keyof TranslationDictionary, variables?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Locale>("az");

  useEffect(() => {
    // Helper to get cookies client-side safely
    const getCookie = (name: string): string | null => {
      if (typeof document === "undefined") return null;
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
      return null;
    };

    // 1. Check Cookie first
    const savedCookie = getCookie("nf_locale");
    if (savedCookie === "az" || savedCookie === "en" || savedCookie === "tr") {
      setLanguageState(savedCookie as Locale);
      return;
    }

    // 2. Check LocalStorage fallback
    const savedLocal = localStorage.getItem("nf_locale");
    if (savedLocal === "az" || savedLocal === "en" || savedLocal === "tr") {
      setLanguageState(savedLocal as Locale);
      // Synchronize to cookie
      document.cookie = `nf_locale=${savedLocal}; path=/; max-age=31536000; SameSite=Lax`;
      return;
    }

    // 3. Auto-detect browser language
    const browserLang = navigator.language.toLowerCase();
    let detectedLocale: Locale = "az";
    if (browserLang.startsWith("tr")) {
      detectedLocale = "tr";
    } else if (browserLang.startsWith("en")) {
      detectedLocale = "en";
    }

    setLanguageState(detectedLocale);
    localStorage.setItem("nf_locale", detectedLocale);
    document.cookie = `nf_locale=${detectedLocale}; path=/; max-age=31536000; SameSite=Lax`;
  }, []);

  const setLanguage = (lang: Locale) => {
    setLanguageState(lang);
    localStorage.setItem("nf_locale", lang);
    // Write cookie to let server-side renders read the active language
    document.cookie = `nf_locale=${lang}; path=/; max-age=31536000; SameSite=Lax`;
  };

  const dict = DICTIONARIES[language];

  // Helper function to resolve dynamic interpolation values (e.g. {city}, {seats})
  const t = (key: keyof TranslationDictionary, variables?: Record<string, string>): string => {
    let text = dict[key] || DICTIONARIES["az"][key] || "";
    if (variables) {
      Object.entries(variables).forEach(([k, v]) => {
        text = text.replace(new RegExp(`{${k}}`, "g"), v);
      });
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, dict, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
