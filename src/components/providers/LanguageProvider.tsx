"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import arTranslations from '@/lib/translations/ar.json';
import enTranslations from '@/lib/translations/en.json';
import { getLanguage, setLanguage as setStoredLanguage, applyLanguageToDocument, type Language } from '@/lib/language-utils';

// Type for nested object access
type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

type TranslationKeys = NestedKeyOf<typeof arTranslations>;

const translations = {
  ar: arTranslations,
  en: enTranslations,
} as const;

// Function to get nested translation value - moved outside component to avoid recreation
const getNestedValue = (obj: Record<string, unknown>, path: string): string | null => {
  return path.split('.').reduce((current: unknown, key: string) => {
    if (current && typeof current === 'object' && current !== null) {
      const currentObj = current as Record<string, unknown>;
      return currentObj[key] !== undefined ? currentObj[key] : null;
    }
    return null;
  }, obj) as string | null;
};

// Language context type
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  isRTL: boolean;
  dir: 'rtl' | 'ltr';
  t: (key: TranslationKeys, fallback?: string) => string;
  mounted: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Language Provider Component
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ar');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedLang = getLanguage();
    setLanguageState(storedLang);
    applyLanguageToDocument(storedLang);
  }, []);

  // Translation function
  const t = useCallback((key: TranslationKeys, fallback?: string): string => {
    const currentTranslations = translations[language];
    const value = getNestedValue(currentTranslations as Record<string, unknown>, key);
    
    if (value !== null && value !== undefined) {
      return value;
    }
    
    // Fallback to Arabic if key not found in English
    if (language === 'en') {
      const arValue = getNestedValue(arTranslations as Record<string, unknown>, key);
      if (arValue !== null && arValue !== undefined) {
        return arValue;
      }
    }
    
    return fallback || key;
  }, [language]);

  // Function to change language
  const setLanguage = useCallback((newLang: Language) => {
    setStoredLanguage(newLang);
    setLanguageState(newLang);
    applyLanguageToDocument(newLang);
  }, []);

  // Toggle between languages
  const toggleLanguage = useCallback(() => {
    const newLang = language === 'ar' ? 'en' : 'ar';
    setLanguage(newLang);
  }, [language, setLanguage]);

  const isRTL = language === 'ar';
  const dir = isRTL ? 'rtl' : 'ltr';

  const value: LanguageContextType = {
    language,
    setLanguage,
    toggleLanguage,
    isRTL,
    dir,
    t,
    mounted,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

// Hook to use language context
export function useLanguageProvider(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    // Return default values if used outside provider (for SSR or initial render)
    return {
      language: 'ar',
      setLanguage: () => {},
      toggleLanguage: () => {},
      isRTL: true,
      dir: 'rtl',
      t: (key: string) => key,
      mounted: false,
    };
  }
  return context;
}

// Alias for useLanguageProvider for convenience
export function useTranslation() {
  return useLanguageProvider();
}

// Export Language type
export type { Language, TranslationKeys };
