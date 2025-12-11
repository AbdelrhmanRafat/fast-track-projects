// Language utilities - Arabic and English support

export type Language = 'ar' | 'en';

const LANGUAGE_COOKIE_NAME = 'preferred-language';
const DEFAULT_LANGUAGE: Language = 'ar';

/**
 * Server-side language detection utility
 * Returns the stored language or default (Arabic)
 */
export async function detectServerLanguage(): Promise<Language> {
  return DEFAULT_LANGUAGE;
}

/**
 * Client-side language detection utility
 * Returns the stored language from cookie/localStorage or default
 */
export function detectClientLanguage(): Language {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  
  // Try localStorage first
  const storedLang = localStorage.getItem(LANGUAGE_COOKIE_NAME);
  if (storedLang === 'ar' || storedLang === 'en') {
    return storedLang;
  }
  
  // Try cookie
  const cookieLang = getCookie(LANGUAGE_COOKIE_NAME);
  if (cookieLang === 'ar' || cookieLang === 'en') {
    return cookieLang as Language;
  }
  
  return DEFAULT_LANGUAGE;
}

/**
 * Get current language
 */
export function getLanguage(): Language {
  return detectClientLanguage();
}

/**
 * Set language preference
 */
export function setLanguage(lang: Language): void {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(LANGUAGE_COOKIE_NAME, lang);
  setCookie(LANGUAGE_COOKIE_NAME, lang, 365);
  
  // Apply to document immediately
  applyLanguageToDocument(lang);
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
}

/**
 * Apply language and direction settings to document
 */
export function applyLanguageToDocument(lang?: Language): void {
  if (typeof document === 'undefined') return;
  
  const currentLang = lang || getLanguage();
  const isRTL = currentLang === 'ar';
  
  // Set HTML attributes
  document.documentElement.setAttribute('lang', currentLang);
  document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
  
  // Set CSS classes
  if (isRTL) {
    document.documentElement.classList.add('rtl');
    document.documentElement.classList.remove('ltr');
  } else {
    document.documentElement.classList.add('ltr');
    document.documentElement.classList.remove('rtl');
  }
}

/**
 * Generate initial HTML attributes for server-side rendering
 * Returns default Arabic RTL attributes for initial render
 */
export function getLanguageAttributes(lang?: Language) {
  const currentLang = lang || DEFAULT_LANGUAGE;
  const isRTL = currentLang === 'ar';
  
  return {
    lang: currentLang,
    dir: isRTL ? 'rtl' : 'ltr',
    className: isRTL ? 'rtl' : 'ltr',
  };
}
