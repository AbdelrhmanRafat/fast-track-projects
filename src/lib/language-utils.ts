import { cookies, headers } from 'next/headers';
import { COOKIE_LANG } from '@/lib/cookies';

export type Language = 'en' | 'ar';

/**
 * Server-side language detection utility
 * Detects language from cookies, headers, and provides fallback
 */
export async function detectServerLanguage(): Promise<Language> {
  try {
    // First, check cookies
    const cookieStore = await cookies();
    const savedLanguage = cookieStore.get(COOKIE_LANG)?.value as Language;
    
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ar')) {
      return savedLanguage;
    }

    // Second, check Accept-Language header
    const headersList = await headers();
    const acceptLanguage = headersList.get('accept-language');
    
    if (acceptLanguage) {
      // Parse Accept-Language header
      const languages = acceptLanguage
        .split(',')
        .map(lang => lang.split(';')[0].trim().toLowerCase());
      
      // Check if Arabic is preferred
      for (const lang of languages) {
        if (lang.startsWith('ar')) {
          return 'ar';
        }
      }
    }

    // Default fallback
    return 'en';
  } catch (error) {
    // Fallback in case of any server-side errors
    console.warn('Error detecting server language:', error);
    return 'en';
  }
}

/**
 * Client-side language detection utility
 * Used as fallback when server detection is not available
 */
export function detectClientLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  
  try {
    // Check localStorage first (for persistence)
    const stored = localStorage.getItem('togoru-clinic-lang') as Language;
    if (stored && (stored === 'en' || stored === 'ar')) {
      return stored;
    }

    // Check browser language
    const browserLang = navigator.language || navigator.languages?.[0] || 'en';
    return browserLang.toLowerCase().startsWith('ar') ? 'ar' : 'en';
  } catch (error) {
    console.warn('Error detecting client language:', error);
    return 'en';
  }
}

/**
 * Get cookie value (client-side only)
 */
export function getCookie(name: string): string | null {
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
}

/**
 * Set cookie value (client-side only)
 */
export function setCookie(name: string, value: string, days: number = 365): void {
  if (typeof document === 'undefined') return;
  
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;samesite=lax`;
  
  // Also store in localStorage for faster access
  try {
    localStorage.setItem('togoru-clinic-lang', value);
  } catch (error) {
    console.warn('Could not save language to localStorage:', error);
  }
}

/**
 * Apply language and RTL settings to document
 */
export function applyLanguageToDocument(language: Language): void {
  if (typeof document === 'undefined') return;
  
  const isRTL = language === 'ar';
  
  // Set HTML attributes
  document.documentElement.setAttribute('lang', language);
  document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
  
  // Add/remove RTL class for Tailwind CSS
  if (isRTL) {
    document.documentElement.classList.add('rtl');
  } else {
    document.documentElement.classList.remove('rtl');
  }
}

/**
 * Generate initial HTML attributes for server-side rendering
 */
export function getLanguageAttributes(language: Language) {
  return {
    lang: language,
    dir: language === 'ar' ? 'rtl' : 'ltr',
    className: language === 'ar' ? 'rtl' : '',
  };
}