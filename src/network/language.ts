// src/network/language.ts

import { LanguageConfig } from './types';

export class LanguageHandler {
  private config: LanguageConfig;

  constructor(config: LanguageConfig) {
    this.config = { ...config };
  }

  /**
   * Check if language handling is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Check if a language is set
   */
  hasLanguage(): boolean {
    return !!this.config.language;
  }

  /**
   * Get language headers for requests
   */
  getLanguageHeaders(): Record<string, string> {
    if (!this.isEnabled() || !this.hasLanguage()) {
      return {};
    }

    return {
      'Accept-Language': this.config.language!,
    };
  }

  /**
   * Set the language
   */
  setLanguage(language: string): void {
    this.config.language = language;
  }

  /**
   * Clear the language completely
   */
  clearLanguage(): void {
    this.config.language = undefined;
  }

  /**
   * Get current language
   */
  getCurrentLanguage(): string | undefined {
    return this.config.language;
  }

  /**
   * Update language configuration
   */
  updateConfig(config: Partial<LanguageConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get language info for debugging
   */
  getLanguageInfo(): { enabled: boolean; language?: string } {
    return {
      enabled: this.config.enabled,
      language: this.config.language,
    };
  }

  /**
   * Get language from cookies (browser environment)
   */
  getLanguageFromCookies(): string | null {
    if (typeof document === 'undefined') {
      return null; // Not in browser environment
    }

    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'language' || name === 'lang') {
        return decodeURIComponent(value);
      }
    }
    return null;
  }

  /**
   * Initialize language from cookies if available
   */
  initializeFromCookies(): void {
    const cookieLanguage = this.getLanguageFromCookies();
    if (cookieLanguage) {
      this.setLanguage(cookieLanguage);
    }
  }
}