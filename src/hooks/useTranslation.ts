"use client";

// Import translation files
import arTranslations from '@/lib/translations/ar.json';

// Type for nested object access
type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

type TranslationKeys = NestedKeyOf<typeof arTranslations>;

export function useTranslation() {
  // Function to get nested translation value
  const getNestedValue = (obj: Record<string, unknown>, path: string): string | null => {
    return path.split('.').reduce((current: unknown, key: string) => {
      if (current && typeof current === 'object' && current !== null) {
        const currentObj = current as Record<string, unknown>;
        return currentObj[key] !== undefined ? currentObj[key] : null;
      }
      return null;
    }, obj) as string | null;
  };

  // Translation function - always uses Arabic
  const t = (key: TranslationKeys, fallback?: string): string => {
    const value = getNestedValue(arTranslations, key);
    
    if (value !== null && value !== undefined) {
      return value;
    }
    
    // Return fallback or the key itself
    return fallback || key;
  };

  return {
    t,
    language: 'ar' as const,
    isRTL: true,
  };
}
