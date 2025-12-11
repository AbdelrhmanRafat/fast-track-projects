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
 * User data interface for encrypted storage
 */
export interface UserData {
  account_name: string;
  role: string;
  name?: string;
}

/* ========================= */
/* Encryption Utilities */
/* ========================= */

// Encryption key derived from environment or fallback (should be set in .env)
const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'fast-track-purchasing-secret-key-2024';

/**
 * Generate a random IV for AES encryption
 */
function generateIV(): Uint8Array {
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto.getRandomValues(new Uint8Array(16));
  }
  // Fallback for server-side
  const iv = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    iv[i] = Math.floor(Math.random() * 256);
  }
  return iv;
}

/**
 * Convert string to Uint8Array
 */
function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * Convert Uint8Array to string
 */
function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

/**
 * Convert Uint8Array to base64
 */
function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 to Uint8Array
 */
function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Derive a crypto key from the encryption key string
 */
async function deriveKey(): Promise<CryptoKey> {
  const keyBytes = stringToBytes(ENCRYPTION_KEY);
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    keyBytes.buffer as ArrayBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const saltBytes = stringToBytes('fast-track-salt');
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes.buffer as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data using AES-GCM
 */
async function encryptData(data: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    // Fallback: simple base64 encoding for SSR
    return btoa(encodeURIComponent(data));
  }

  try {
    const key = await deriveKey();
    const iv = generateIV();
    const encodedData = stringToBytes(data);

    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
      key,
      encodedData.buffer as ArrayBuffer
    );

    const encryptedBytes = new Uint8Array(encryptedBuffer);
    
    // Combine IV + encrypted data
    const combined = new Uint8Array(iv.length + encryptedBytes.length);
    combined.set(iv);
    combined.set(encryptedBytes, iv.length);

    return bytesToBase64(combined);
  } catch (error) {
    // Fallback to base64
    return btoa(encodeURIComponent(data));
  }
}

/**
 * Decrypt data using AES-GCM
 */
async function decryptData(encryptedData: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    // Fallback: simple base64 decoding for SSR
    try {
      return decodeURIComponent(atob(encryptedData));
    } catch {
      return '';
    }
  }

  try {
    const key = await deriveKey();
    const combined = base64ToBytes(encryptedData);

    // Extract IV and encrypted data
    const iv = combined.slice(0, 16);
    const data = combined.slice(16);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
      key,
      data.buffer as ArrayBuffer
    );

    return bytesToString(new Uint8Array(decryptedBuffer));
  } catch (error) {
    // Try fallback base64 decoding
    try {
      return decodeURIComponent(atob(encryptedData));
    } catch {
      return '';
    }
  }
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

/**
 * Get all cookies as an object
 */
export function getAllCookies(): Record<string, string> {
  if (typeof document === 'undefined') return {};

  const cookies: Record<string, string> = {};
  const cookieArray = document.cookie.split(';');

  for (let cookie of cookieArray) {
    cookie = cookie.trim();
    const [name, value] = cookie.split('=');
    if (name && value) {
      cookies[decodeURIComponent(name)] = decodeURIComponent(value);
    }
  }

  return cookies;
}

/* ========================= */
/* Generic Auth Cookies */
/* ========================= */

export const COOKIE_TOKEN = 'AuthToken';
export const COOKIE_USER_DATA = 'UserData';
export const COOKIE_USER_ROLE = 'UserRole'; // Plain text role for middleware access
export const COOKIE_LANG = 'Lang'; // Language preference cookie

/**
 * Set authentication token cookie
 */
export function setToken(token: string): void {
  setCookie(COOKIE_TOKEN, token, {
    maxAge: 60 * 60 * 24 * 7, // 7 days
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });
}

/**
 * Get authentication token from cookie
 */
export function getToken(): string | null {
  return getCookie(COOKIE_TOKEN);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return hasCookie(COOKIE_TOKEN);
}

/**
 * Set encrypted user data cookie (account_name and role)
 * Also sets a plain-text role cookie for middleware access
 */
export async function setUserData(userData: UserData): Promise<void> {
  try {
    const jsonData = JSON.stringify(userData);
    const encryptedData = await encryptData(jsonData);
    
    // Set encrypted user data
    setCookie(COOKIE_USER_DATA, encryptedData, {
      maxAge: 60 * 60 * 24 * 7, // 7 days (same as token)
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
    
    // Set plain-text role cookie for middleware access (role is not sensitive info)
    setCookie(COOKIE_USER_ROLE, userData.role, {
      maxAge: 60 * 60 * 24 * 7, // 7 days (same as token)
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
  } catch (error) {
    // Error setting user data
  }
}

/**
 * Get decrypted user data from cookie
 */
export async function getUserData(): Promise<UserData | null> {
  try {
    const encryptedData = getCookie(COOKIE_USER_DATA);
    if (!encryptedData) return null;

    const jsonData = await decryptData(encryptedData);
    if (!jsonData) return null;

    return JSON.parse(jsonData) as UserData;
  } catch (error) {
    return null;
  }
}

/**
 * Clear auth cookies (token, user data, and role)
 */
export function clearAuthCookies(): void {
  deleteCookie(COOKIE_TOKEN);
  deleteCookie(COOKIE_USER_DATA);
  deleteCookie(COOKIE_USER_ROLE);
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
 * Get token from server-side cookies
 */
export function getServerToken(cookieHeader?: string): string | null {
  const cookies = parseCookies(cookieHeader);
  return cookies[COOKIE_TOKEN] || null;
}

/* ========================= */
/* Language Cookies */
/* ========================= */

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
 * Get language preference with fallback to browser language
 */
export function getLangWithFallback(): string {
  const cookieLang = getCookie(COOKIE_LANG);
  if (cookieLang) return cookieLang;

  if (typeof navigator !== 'undefined') {
    const browserLang = navigator.language || navigator.languages?.[0];
    if (browserLang?.startsWith('ar')) return 'ar';
  }

  return 'en'; // default
}

/**
 * Get language from server-side cookies
 */
export function getServerLang(cookieHeader?: string): string | null {
  const cookies = parseCookies(cookieHeader);
  return cookies[COOKIE_LANG] || null;
}