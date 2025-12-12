"use client";

/**
 * Re-export useTranslation from LanguageProvider for backward compatibility
 * All translation logic is centralized in LanguageProvider
 */
export { useTranslation, useLanguage } from '@/components/providers/LanguageProvider';

// Re-export Language type for convenience
export type { Language } from '@/lib/language-utils';