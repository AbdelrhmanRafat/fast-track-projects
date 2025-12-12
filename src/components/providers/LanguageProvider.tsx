"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

// Import translation files
import enTranslations from '@/lib/translations/en.json';
import arTranslations from '@/lib/translations/ar.json';
import { COOKIE_LANG } from '@/lib/cookies';

type Language = 'en' | 'ar';
type TranslationKey = string;

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

interface LanguageContextType {
  language: Language;
  isRTL: boolean;
  dir: 'rtl' | 'ltr';
  t: (key: TranslationKeys, fallback?: string) => string;
  switchLanguage: (newLanguage: Language) => void;
  setLanguage: (newLanguage: Language) => void; // Alias for switchLanguage
  isHydrated: boolean;
  mounted: boolean; // Alias for isHydrated
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: React.ReactNode;
  initialLanguage?: Language;
}

// Helper functions
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

const setCookie = (name: string, value: string, days: number = 365) => {
  if (typeof document === 'undefined') return;
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;samesite=lax`;
};

const detectBrowserLanguage = (): Language => {
  if (typeof navigator === 'undefined') return 'en';
  const browserLang = navigator.language || navigator.languages?.[0] || 'en';
  return browserLang.startsWith('ar') ? 'ar' : 'en';
};

const getNestedValue = (obj: any, path: string): string => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
};

export function LanguageProvider({ children, initialLanguage }: LanguageProviderProps) {
  // Initialize with server-safe default, then hydrate with actual value
  const [language, setLanguage] = useState<Language>(initialLanguage || 'en');
  const [isHydrated, setIsHydrated] = useState(false);

  // Memoized RTL detection
  const isRTL = useMemo(() => language === 'ar', [language]);

  // Initialize language on mount (hydration)
  useEffect(() => {
    const savedLanguage = getCookie(COOKIE_LANG) as Language;
    const finalLanguage = savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ar') 
      ? savedLanguage 
      : initialLanguage || detectBrowserLanguage();
    
    setLanguage(finalLanguage);
    setIsHydrated(true);
    
    // Apply language and direction to document
    document.documentElement.setAttribute('lang', finalLanguage);
    document.documentElement.setAttribute('dir', finalLanguage === 'ar' ? 'rtl' : 'ltr');
    
    // Save to cookie if not already saved
    if (!savedLanguage) {
      setCookie(COOKIE_LANG, finalLanguage);
    }
  }, [initialLanguage]);

  // Optimized language switching
  const switchLanguage = useCallback((newLanguage: Language) => {
    if (newLanguage === language) return;
    
    setLanguage(newLanguage);
    setCookie(COOKIE_LANG, newLanguage);
    
    // Apply changes to document immediately
    document.documentElement.setAttribute('lang', newLanguage);
    document.documentElement.setAttribute('dir', newLanguage === 'ar' ? 'rtl' : 'ltr');
    
    // Add/remove RTL class for Tailwind
    if (newLanguage === 'ar') {
      document.documentElement.classList.add('rtl');
    } else {
      document.documentElement.classList.remove('rtl');
    }
  }, [language]);

  // Apply RTL class on language change
  useEffect(() => {
    if (!isHydrated) return;
    
    if (isRTL) {
      document.documentElement.classList.add('rtl');
    } else {
      document.documentElement.classList.remove('rtl');
    }
  }, [isRTL, isHydrated]);

  // Optimized translation function
  const t = useCallback((key: TranslationKeys, fallback?: string): string => {
    const currentTranslations = translations[language];
    const value = getNestedValue(currentTranslations, key);
    
    if (value !== null && value !== undefined) {
      return value;
    }
    
    // Fallback to English if current language doesn't have the key
    if (language !== 'en') {
      const englishValue = getNestedValue(translations.en, key);
      if (englishValue !== null && englishValue !== undefined) {
        return englishValue;
      }
    }
    
    // Return fallback or the key itself
    return fallback || key;
  }, [language]);

  const dir: 'rtl' | 'ltr' = isRTL ? 'rtl' : 'ltr';

  const contextValue = useMemo(() => ({
    language,
    isRTL,
    dir,
    t,
    switchLanguage,
    setLanguage: switchLanguage, // Alias for backward compatibility
    isHydrated,
    mounted: isHydrated, // Alias for backward compatibility
  }), [language, isRTL, dir, t, switchLanguage, isHydrated]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Backward compatibility hook
export function useTranslation() {
  return useLanguage();
}