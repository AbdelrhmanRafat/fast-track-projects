# Translation System Documentation

This document provides a complete guide to the internationalization (i18n) system implemented in this Next.js application. Follow this guide step-by-step to replicate the same approach in another project.

---

## Table of Contents

1. [Overview](#1-overview)
2. [File Structure](#2-file-structure)
3. [Translation Files Setup](#3-translation-files-setup)
4. [Cookie Utilities](#4-cookie-utilities)
5. [Language Detection Utilities](#5-language-detection-utilities)
6. [Language Provider (Context)](#6-language-provider-context)
7. [Application Integration](#7-application-integration)
8. [Using Translations in Components](#8-using-translations-in-components)
9. [Language Switching](#9-language-switching)
10. [RTL Support](#10-rtl-support)
11. [Best Practices & Naming Conventions](#11-best-practices--naming-conventions)
12. [Quick Start for New Projects](#12-quick-start-for-new-projects)

---

## 1. Overview

This translation system provides:

- **Two-language support**: English (`en`) and Arabic (`ar`)
- **RTL/LTR automatic switching**: Based on selected language
- **Server-side language detection**: For optimal SEO and initial render
- **Client-side language switching**: Instant UI updates without page reload
- **Cookie-based persistence**: Language preference saved across sessions
- **Type-safe translations**: TypeScript support with autocomplete for translation keys
- **Fallback mechanism**: Falls back to English if a translation key is missing

---

## 2. File Structure

```
src/
├── lib/
│   ├── cookies.ts                    # Cookie utilities (set/get/delete)
│   ├── language-utils.ts             # Server/client language detection
│   └── translations/
│       ├── en.json                   # English translations
│       └── ar.json                   # Arabic translations
├── components/
│   └── providers/
│       └── LanguageProvider.tsx      # React Context for language state
├── hooks/
│   └── useTranslation.ts             # Alternative standalone hook (optional)
└── app/
    └── layout.tsx                    # Root layout with provider setup
```

---

## 3. Translation Files Setup

### 3.1 Create Translation Directory

Create the folder structure:

```bash
mkdir -p src/lib/translations
```

### 3.2 English Translation File (`en.json`)

Create `src/lib/translations/en.json`:

```json
{
    "common": {
        "currency": "SAR",
        "success": "Success",
        "error": "Error",
        "cancel": "Cancel",
        "ok": "OK",
        "active": "Active",
        "inactive": "Inactive",
        "status": "Status",
        "close": "Close",
        "noData": "No data available",
        "edit": "Edit",
        "delete": "Delete",
        "save": "Save",
        "saving": "Saving...",
        "view": "View",
        "loading": "Loading...",
        "tryAgain": "Try Again",
        "errorOccurred": "An error occurred",
        "previous": "Previous",
        "next": "Next",
        "arabic": "Arabic",
        "english": "English"
    },
    "validation": {
        "required": "This field is required",
        "email": "Please enter a valid email address",
        "minLength": "Minimum length is {{min}} characters",
        "maxLength": "Maximum length is {{max}} characters",
        "passwordMismatch": "Passwords do not match"
    },
    "form": {
        "submit": "Submit",
        "reset": "Reset",
        "cancel": "Cancel",
        "update": "Update",
        "create": "Create",
        "search": "Search"
    },
    "auth": {
        "welcomeBack": "Welcome Back",
        "signIn": "Sign In",
        "signOut": "Sign Out",
        "forgotPassword": "Forgot Password"
    },
    "sidebar": {
        "dashboard": "Dashboard",
        "users": "Users",
        "settings": "Settings"
    },
    "navbar": {
        "language": "Language",
        "theme": "Theme"
    }
}
```

### 3.3 Arabic Translation File (`ar.json`)

Create `src/lib/translations/ar.json`:

```json
{
    "common": {
        "currency": "ر.س",
        "success": "نجح",
        "error": "خطأ",
        "cancel": "إلغاء",
        "ok": "موافق",
        "active": "نشط",
        "inactive": "غير نشط",
        "status": "الحالة",
        "close": "إغلاق",
        "noData": "لا توجد بيانات متاحة",
        "edit": "تعديل",
        "delete": "حذف",
        "save": "حفظ",
        "saving": "جارٍ الحفظ...",
        "view": "عرض",
        "loading": "جارٍ التحميل...",
        "tryAgain": "حاول مرة أخرى",
        "errorOccurred": "حدث خطأ",
        "previous": "السابق",
        "next": "التالي",
        "arabic": "العربية",
        "english": "الإنجليزية"
    },
    "validation": {
        "required": "الحقل مطلوب",
        "email": "أدخل بريد إلكتروني صحيح",
        "minLength": "لا يقل عن {{min}} أحرف",
        "maxLength": "لا يزيد عن {{max}} أحرف",
        "passwordMismatch": "كلمتا المرور غير متطابقتين"
    },
    "form": {
        "submit": "حفظ",
        "reset": "إعادة ضبط",
        "cancel": "إلغاء",
        "update": "تحديث",
        "create": "إنشاء",
        "search": "بحث"
    },
    "auth": {
        "welcomeBack": "أهلاً بعودتك",
        "signIn": "تسجيل الدخول",
        "signOut": "تسجيل الخروج",
        "forgotPassword": "نسيت كلمة المرور"
    },
    "sidebar": {
        "dashboard": "لوحة التحكم",
        "users": "المستخدمون",
        "settings": "الإعدادات"
    },
    "navbar": {
        "language": "اللغة",
        "theme": "السمة"
    }
}
```

### 3.4 Naming Conventions for Translation Keys

| Convention | Example | Description |
|------------|---------|-------------|
| Nested structure | `common.save` | Group related translations |
| camelCase keys | `noData`, `tryAgain` | Use camelCase for key names |
| Feature-based grouping | `auth.signIn`, `form.submit` | Group by feature/page |
| Placeholders | `{{min}}`, `{{current}}` | Use double braces for dynamic values |
| Action verbs | `saving`, `loading` | Use -ing for loading states |

---

## 4. Cookie Utilities

Create `src/lib/cookies.ts`:

```typescript
/**
 * Cookie utilities for authentication and language state management
 */

/**
 * Cookie options interface
 */
export interface CookieOptions {
  expires?: Date;
  maxAge?: number;
  domain?: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

/**
 * Set a cookie with the specified name, value, and options
 */
export function setCookie(name: string, value: string, options: CookieOptions = {}): void {
  if (typeof document === 'undefined') return; // client-side only

  const {
    expires,
    maxAge,
    domain,
    path = '/',
    secure = process.env.NODE_ENV === 'production',
    sameSite = 'lax'
  } = options;

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (expires) cookieString += `; expires=${expires.toUTCString()}`;
  if (maxAge !== undefined) cookieString += `; max-age=${maxAge}`;
  if (domain) cookieString += `; domain=${domain}`;
  cookieString += `; path=${path}`;
  if (secure) cookieString += '; secure';
  cookieString += `; samesite=${sameSite}`;

  document.cookie = cookieString;
}

/**
 * Get a cookie value by name
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
 * Delete a cookie by name
 */
export function deleteCookie(name: string, options: Omit<CookieOptions, 'expires' | 'maxAge'> = {}): void {
  setCookie(name, '', { ...options, expires: new Date(0) });
}

/**
 * Check if a cookie exists
 */
export function hasCookie(name: string): boolean {
  return getCookie(name) !== null;
}

/* ========================= */
/* Language Cookie Constants */
/* ========================= */

export const COOKIE_TOKEN = 'AuthToken';
export const COOKIE_LANG = 'Lang';

/**
 * Set language preference cookie
 */
export function setLang(language: string): void {
  setCookie(COOKIE_LANG, language, {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });
}

/**
 * Get language preference from cookie
 */
export function getLang(): string | null {
  return getCookie(COOKIE_LANG);
}

/**
 * Server-side cookie parsing utility
 */
export function parseCookies(cookieHeader?: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;

  cookieHeader.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      cookies[decodeURIComponent(name)] = decodeURIComponent(value);
    }
  });

  return cookies;
}

/**
 * Get language from server-side cookies
 */
export function getServerLang(cookieHeader?: string): string | null {
  const cookies = parseCookies(cookieHeader);
  return cookies[COOKIE_LANG] || null;
}
```

---

## 5. Language Detection Utilities

Create `src/lib/language-utils.ts`:

```typescript
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
    console.warn('Error detecting server language:', error);
    return 'en';
  }
}

/**
 * Client-side language detection utility
 */
export function detectClientLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  
  try {
    // Check browser language
    const browserLang = navigator.language || navigator.languages?.[0] || 'en';
    return browserLang.toLowerCase().startsWith('ar') ? 'ar' : 'en';
  } catch (error) {
    console.warn('Error detecting client language:', error);
    return 'en';
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
```

---

## 6. Language Provider (Context)

Create `src/components/providers/LanguageProvider.tsx`:

```typescript
"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

// Import translation files
import enTranslations from '@/lib/translations/en.json';
import arTranslations from '@/lib/translations/ar.json';
import { COOKIE_LANG } from '@/lib/cookies';

type Language = 'en' | 'ar';

// Type for nested object access (provides autocomplete for translation keys)
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

  const contextValue = useMemo(() => ({
    language,
    isRTL,
    t,
    switchLanguage,
    isHydrated,
  }), [language, isRTL, t, switchLanguage, isHydrated]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Hook to access language context with full functionality
 */
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

/**
 * Backward compatibility hook (alias for useLanguage)
 */
export function useTranslation() {
  return useLanguage();
}
```

---

## 7. Application Integration

### 7.1 Root Layout Setup

Update `src/app/layout.tsx`:

```typescript
import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { detectServerLanguage, getLanguageAttributes } from "@/lib/language-utils";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import { ThemeProvider } from "next-themes";

// Use a font that supports both Latin and Arabic
const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["latin", "arabic"],
  weight: ["200", "300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "My Application",
  description: "Application description",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Detect language server-side for optimal performance
  const initialLanguage = await detectServerLanguage();
  const languageAttributes = getLanguageAttributes(initialLanguage);

  return (
    <html
      lang={languageAttributes.lang}
      dir={languageAttributes.dir}
      className={`${cairo.variable}`}
      suppressHydrationWarning
    >
      <body className={`antialiased font-cairo bg-background ${cairo.className}`}>
        <LanguageProvider initialLanguage={initialLanguage}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
```

### 7.2 Key Points

1. **Server-side detection**: `detectServerLanguage()` runs on the server to detect language from cookies/headers
2. **Initial HTML attributes**: `getLanguageAttributes()` sets correct `lang` and `dir` attributes for SSR
3. **Provider wrapping**: `LanguageProvider` wraps all children with the `initialLanguage` prop
4. **Font selection**: Cairo font supports both Latin and Arabic characters

---

## 8. Using Translations in Components

### 8.1 Basic Usage

```typescript
'use client';

import { useTranslation } from '@/components/providers/LanguageProvider';

export function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('common.success')}</h1>
      <p>{t('validation.required')}</p>
      <button>{t('form.submit')}</button>
    </div>
  );
}
```

### 8.2 With Language and RTL Access

```typescript
'use client';

import { useLanguage } from '@/components/providers/LanguageProvider';

export function MyComponent() {
  const { t, language, isRTL, isHydrated } = useLanguage();

  return (
    <div className={isRTL ? 'text-right' : 'text-left'}>
      <p>Current language: {language}</p>
      <p>{t('common.success')}</p>
      
      {/* Conditional rendering based on hydration */}
      {isHydrated && (
        <span>Client-only content</span>
      )}
    </div>
  );
}
```

### 8.3 With Fallback Values

```typescript
const { t } = useTranslation();

// If 'mySection.customKey' doesn't exist, returns 'Default Text'
const text = t('mySection.customKey', 'Default Text');
```

### 8.4 Dynamic Display Based on Language

```typescript
'use client';

import { useLanguage } from '@/components/providers/LanguageProvider';

interface Item {
  name: { en: string; ar: string };
}

export function ItemCard({ item }: { item: Item }) {
  const { language } = useLanguage();

  // Display the correct language version
  const displayName = language === 'ar' ? item.name.ar : item.name.en;

  return <div>{displayName}</div>;
}
```

---

## 9. Language Switching

### 9.1 Language Switcher Component

```typescript
'use client';

import { useLanguage } from '@/components/providers/LanguageProvider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { language, switchLanguage, t } = useLanguage();

  const handleLanguageChange = (newLanguage: 'en' | 'ar') => {
    switchLanguage(newLanguage);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Globe className="h-4 w-4" />
          <span className="sr-only">{t('navbar.language')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => handleLanguageChange('en')}
          className={language === 'en' ? 'bg-accent' : ''}
        >
          <span className="mr-2">🇺🇸</span>
          <span>English</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleLanguageChange('ar')}
          className={language === 'ar' ? 'bg-accent' : ''}
        >
          <span className="mr-2">🇸🇦</span>
          <span>العربية</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### 9.2 What Happens When Language Changes

1. `switchLanguage()` is called
2. State is updated via `setLanguage()`
3. Cookie is saved with new language preference
4. Document `lang` and `dir` attributes are updated immediately
5. RTL class is added/removed from `<html>` element
6. All components using `useTranslation()` re-render with new translations

---

## 10. RTL Support

### 10.1 CSS Configuration

In `globals.css`:

```css
/* RTL Support */
html[dir="rtl"] {
  direction: rtl;
}

/* Tailwind RTL utilities */
.rtl .rtl\:space-x-reverse > :not([hidden]) ~ :not([hidden]) {
  --tw-space-x-reverse: 1;
}

/* Custom RTL adjustments */
.rtl .ltr\:ml-auto {
  margin-left: 0;
  margin-right: auto;
}
```

### 10.2 Using RTL in Components

```typescript
'use client';

import { useLanguage } from '@/components/providers/LanguageProvider';

export function DirectionalComponent() {
  const { isRTL } = useLanguage();

  return (
    <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
      <span className={isRTL ? 'ml-2' : 'mr-2'}>Icon</span>
      <span>Text</span>
    </div>
  );
}
```

### 10.3 Tailwind RTL Classes

Use Tailwind's RTL modifiers:

```html
<div class="mr-4 rtl:mr-0 rtl:ml-4">
  <!-- Margin right in LTR, margin left in RTL -->
</div>
```

---

## 11. Best Practices & Naming Conventions

### 11.1 Translation Key Organization

| Category | Example Keys | Description |
|----------|--------------|-------------|
| `common` | `common.save`, `common.cancel` | Shared UI elements |
| `validation` | `validation.required`, `validation.email` | Form validation messages |
| `form` | `form.submit`, `form.create` | Form-related actions |
| `auth` | `auth.signIn`, `auth.forgotPassword` | Authentication |
| `[feature]` | `users.title`, `users.deleteConfirm` | Feature-specific |

### 11.2 Best Practices

1. **Always use the `t()` function** - Never hardcode strings that need translation
2. **Provide fallbacks** - Use `t('key', 'fallback')` for non-critical text
3. **Keep keys consistent** - Use the same key structure in both `en.json` and `ar.json`
4. **Group related translations** - Use nested objects for better organization
5. **Use meaningful key names** - Keys should describe the content, not the location
6. **Handle placeholders** - Use `{{variable}}` syntax for dynamic content
7. **Check for missing translations** - Periodically compare `en.json` and `ar.json`

### 11.3 Don'ts

- ❌ Don't concatenate translated strings
- ❌ Don't use translations in non-client components without proper handling
- ❌ Don't forget to wrap your app with `LanguageProvider`
- ❌ Don't use inline text that needs translation

---

## 12. Quick Start for New Projects

### Step-by-Step Checklist

```markdown
1. [ ] Create folder structure:
   - src/lib/cookies.ts
   - src/lib/language-utils.ts
   - src/lib/translations/en.json
   - src/lib/translations/ar.json
   - src/components/providers/LanguageProvider.tsx

2. [ ] Copy cookie utilities (Section 4)

3. [ ] Copy language utilities (Section 5)

4. [ ] Create translation JSON files (Section 3)

5. [ ] Copy LanguageProvider (Section 6)

6. [ ] Update root layout.tsx (Section 7)

7. [ ] Add RTL styles to globals.css (Section 10)

8. [ ] Use translations in components:
   - Import: `import { useTranslation } from '@/components/providers/LanguageProvider'`
   - Use: `const { t } = useTranslation()`
   - Display: `{t('common.save')}`

9. [ ] Add language switcher to navbar (Section 9)

10. [ ] Test:
    - Page loads with correct language
    - Language switching works
    - RTL direction changes correctly
    - Translations persist after refresh
```

### Required Dependencies

```json
{
  "dependencies": {
    "next": "^14.x",
    "react": "^18.x",
    "next-themes": "^0.2.x"
  }
}
```

### Optional: Font Configuration

For Arabic support, use Google Fonts that support Arabic:

- **Cairo** - Modern, clean (used in this project)
- **Tajawal** - Professional
- **Noto Sans Arabic** - Universal

---

## Summary

This translation system provides:

✅ **Type-safe translations** with autocomplete  
✅ **Server-side language detection** for SEO  
✅ **Cookie-based persistence** for user preference  
✅ **Instant language switching** without page reload  
✅ **RTL/LTR automatic switching**  
✅ **Fallback mechanism** for missing translations  
✅ **Clean API** with `useTranslation()` and `useLanguage()` hooks  

The system is modular and can be easily extended to support additional languages by adding new JSON files and updating the `translations` object in `LanguageProvider.tsx`.
