"use client";

import { useState, useEffect, useCallback } from 'react';

// Import translation files
import enTranslations from '@/lib/translations/en.json';
import arTranslations from '@/lib/translations/ar.json';
import { COOKIE_LANG, setLang } from '@/lib/cookies';

type Language = 'en' | 'ar';
// Type for nested object access
type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

type TranslationKeys = NestedKeyOf<typeof enTranslations>;

const translations = {
  en: enTranslations,
  ar: arTranslations,
};

// Helper function to get cookie value (outside component to avoid recreation)
const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const nameEQ = encodeURIComponent(name) + '=';
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length));
    }
  }
  return null;
};

// Function to get nested translation value (outside component to avoid recreation)
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
  const [language, setLanguageState] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  // Initialize language from cookie
  useEffect(() => {
    setMounted(true);
    const savedLanguage = getCookie(COOKIE_LANG) as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ar')) {
      setLanguageState(savedLanguage);
    }
  }, []);

  // Function to set language and persist to cookie
  const setLanguage = useCallback((newLang: Language) => {
    setLanguageState(newLang);
    setLang(newLang);
    
    // Apply changes to document immediately
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', newLang);
      document.documentElement.setAttribute('dir', newLang === 'ar' ? 'rtl' : 'ltr');
      
      // Add/remove RTL class for Tailwind
      if (newLang === 'ar') {
        document.documentElement.classList.add('rtl');
        document.documentElement.classList.remove('ltr');
      } else {
        document.documentElement.classList.add('ltr');
        document.documentElement.classList.remove('rtl');
      }
    }
  }, []);

  // Translation function
  const t = useCallback((key: TranslationKeys, fallback?: string): string => {
    const currentTranslations = translations[language];
    const value = getNestedValue(currentTranslations as Record<string, unknown>, key);
    
    if (value !== null && value !== undefined) {
      return value;
    }
    
    // Fallback to English if current language doesn't have the key
    if (language !== 'en') {
      const englishValue = getNestedValue(translations.en as Record<string, unknown>, key);
      if (englishValue !== null && englishValue !== undefined) {
        return englishValue;
      }
    }
    
    // Return fallback or the key itself
    return fallback || key;
  }, [language]);

  const isRTL = language === 'ar';
  const dir = isRTL ? 'rtl' : 'ltr';

  return {
    t,
    language,
    setLanguage,
    isRTL,
    dir,
    mounted,
  };
}