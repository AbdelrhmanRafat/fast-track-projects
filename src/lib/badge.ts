/**
 * PWA App Badge Utility Functions
 * 
 * App Badge API يسمح بإظهار عداد على أيقونة التطبيق مثل تطبيقات الموبايل الأصلية.
 * 
 * Browser Support:
 * - Chrome: ✅ Desktop & Android
 * - Edge: ✅ Desktop & Mobile
 * - Safari: ❌ iOS & macOS (not supported)
 * - Firefox: ❌ (not supported)
 */

// Extend Navigator interface for App Badge API
declare global {
  interface Navigator {
    setAppBadge?: (count?: number) => Promise<void>;
    clearAppBadge?: () => Promise<void>;
  }
}

/**
 * Check if App Badge API is supported in the current browser
 */
export function isBadgeSupported(): boolean {
  if (typeof navigator === 'undefined') return false;
  return 'setAppBadge' in navigator && 'clearAppBadge' in navigator;
}

/**
 * Set badge count on app icon
 * @param count - Number to display on badge (0 will clear the badge)
 * @returns true if badge was set successfully, false otherwise
 */
export async function setBadge(count: number): Promise<boolean> {
  if (!isBadgeSupported()) {
    return false;
  }

  try {
    if (count > 0) {
      await navigator.setAppBadge!(count);
    } else {
      await navigator.clearAppBadge!();
    }
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Clear badge from app icon
 * @returns true if badge was cleared successfully, false otherwise
 */
export async function clearBadge(): Promise<boolean> {
  if (!isBadgeSupported()) {
    return false;
  }
  
  try {
    await navigator.clearAppBadge!();
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get badge support info for debugging
 */
export function getBadgeSupportInfo(): {
  supported: boolean;
  browser: string;
  platform: string;
} {
  if (typeof navigator === 'undefined') {
    return {
      supported: false,
      browser: 'unknown',
      platform: 'server'
    };
  }

  const userAgent = navigator.userAgent;
  let browser = 'unknown';
  let platform = 'unknown';

  // Detect browser
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';

  // Detect platform
  if (userAgent.includes('Android')) platform = 'Android';
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) platform = 'iOS';
  else if (userAgent.includes('Windows')) platform = 'Windows';
  else if (userAgent.includes('Mac')) platform = 'macOS';
  else if (userAgent.includes('Linux')) platform = 'Linux';

  return {
    supported: isBadgeSupported(),
    browser,
    platform
  };
}
