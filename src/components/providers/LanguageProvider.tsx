"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

// Import Arabic translation file only
import arTranslations from '@/lib/translations/ar.json';

type TranslationKey = string;

// Type for nested object access
type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

type TranslationKeys = NestedKeyOf<typeof arTranslations>;

interface LanguageContextType {
  language: 'ar';
  isRTL: true;
  t: (key: TranslationKeys, fallback?: string) => string;
  isHydrated: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: React.ReactNode;
}

const getNestedValue = (obj: any, path: string): string => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
};

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize on mount (hydration)
  useEffect(() => {
    setIsHydrated(true);
    
    // Ensure Arabic RTL is always applied
    document.documentElement.setAttribute('lang', 'ar');
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.classList.add('rtl');
  }, []);

  // Translation function - Arabic only
  const t = useCallback((key: TranslationKeys, fallback?: string): string => {
    const value = getNestedValue(arTranslations, key);
    
    if (value !== null && value !== undefined) {
      return value;
    }
    
    // Return fallback or the key itself
    return fallback || key;
  }, []);

  const contextValue = useMemo(() => ({
    language: 'ar' as const,
    isRTL: true as const,
    t,
    isHydrated,
  }), [t, isHydrated]);

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
