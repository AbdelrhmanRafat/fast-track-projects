"use client";

import { useLanguageProvider } from '@/components/providers/LanguageProvider';

/**
 * Hook to get the current language direction for UI components
 * Returns 'rtl' for Arabic, 'ltr' for English
 */
export function useDirection() {
  const { dir, isRTL, language } = useLanguageProvider();
  return { dir, isRTL, language };
}

/**
 * Get static direction based on language
 * Use this for components that don't need reactivity
 */
export function getDirection(language: 'ar' | 'en'): 'rtl' | 'ltr' {
  return language === 'ar' ? 'rtl' : 'ltr';
}
