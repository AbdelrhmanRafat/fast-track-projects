/**
 * Currency utilities for formatting prices with proper localization
 */

export interface CurrencyFormatOptions {
  language: 'en' | 'ar';
  showCurrencyName?: boolean;
}

/**
 * Formats a price value with Saudi Riyal currency
 * @param price - The price value to format
 * @param options - Formatting options including language and display preferences
 * @returns Formatted price string
 */
export function formatCurrency(price: number, options: CurrencyFormatOptions): string {
  const { language, showCurrencyName = false } = options;
  
  // Format the number with proper decimal places (always use English numerals)
  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
  
  if (showCurrencyName) {
    const currencyName = language === 'ar' ? 'ريال سعودي' : 'Saudi Riyal';
    return `${formattedNumber} ${currencyName}`;
  }
  
  // Default format with SAR symbol
  return language === 'ar' 
    ? `${formattedNumber} ر.س`
    : `${formattedNumber} SAR`;
}

/**
 * Gets the currency name based on language
 * @param language - The language code ('en' or 'ar')
 * @returns Currency name string
 */
export function getCurrencyName(language: 'en' | 'ar'): string {
  return language === 'ar' ? 'ريال سعودي' : 'Saudi Riyal';
}

/**
 * Gets the currency symbol based on language
 * @param language - The language code ('en' or 'ar')
 * @returns Currency symbol string
 */
export function getCurrencySymbol(language: 'en' | 'ar'): string {
  return language === 'ar' ? 'ر.س' : 'SAR';
}