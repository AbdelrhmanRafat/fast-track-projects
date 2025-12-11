"use client";

import { useState, useEffect, useCallback } from 'react';
// Import translation files
import arTranslations from '@/lib/translations/ar.json';
import enTranslations from '@/lib/translations/en.json';
import { getLanguage, setLanguage as setStoredLanguage, type Language } from '@/lib/language-utils';

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

export function useTranslation() {
  const [language, setLanguageState] = useState<Language>('ar');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedLang = getLanguage();
    setLanguageState(storedLang);
  }, []);

  // Translation function - uses current language
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
    
    // Return fallback or the key itself
    return fallback || key;
  }, [language]);

  // Function to change language
  const setLanguage = useCallback((newLang: Language) => {
    setStoredLanguage(newLang);
    setLanguageState(newLang);
    // Apply language to document
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', newLang);
      document.documentElement.setAttribute('dir', newLang === 'ar' ? 'rtl' : 'ltr');
      if (newLang === 'ar') {
        document.documentElement.classList.add('rtl');
        document.documentElement.classList.remove('ltr');
      } else {
        document.documentElement.classList.add('ltr');
        document.documentElement.classList.remove('rtl');
      }
    }
    // Force re-render by updating state
    window.dispatchEvent(new Event('languagechange'));
  }, []);

  // Toggle between languages
  const toggleLanguage = useCallback(() => {
    const newLang = language === 'ar' ? 'en' : 'ar';
    setLanguage(newLang);
  }, [language, setLanguage]);

  return {
    t,
    language,
    setLanguage,
    toggleLanguage,
    isRTL: language === 'ar',
    mounted,
  };
}
