// Language utilities - Arabic only

export type Language = 'ar';

/**
 * Server-side language detection utility
 * Always returns Arabic since we only support Arabic
 */
export async function detectServerLanguage(): Promise<Language> {
  return 'ar';
}

/**
 * Client-side language detection utility
 * Always returns Arabic since we only support Arabic
 */
export function detectClientLanguage(): Language {
  return 'ar';
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
 * Apply language and RTL settings to document
 * Always applies Arabic RTL since we only support Arabic
 */
export function applyLanguageToDocument(): void {
  if (typeof document === 'undefined') return;
  
  // Set HTML attributes for Arabic RTL
  document.documentElement.setAttribute('lang', 'ar');
  document.documentElement.setAttribute('dir', 'rtl');
  document.documentElement.classList.add('rtl');
}

/**
 * Generate initial HTML attributes for server-side rendering
 * Always returns Arabic RTL attributes
 */
export function getLanguageAttributes() {
  return {
    lang: 'ar',
    dir: 'rtl',
    className: 'rtl',
  };
}
