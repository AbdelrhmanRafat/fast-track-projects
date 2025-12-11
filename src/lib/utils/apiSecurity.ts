/**
 * API Security Utilities
 * 
 * This module provides utilities to secure internal API routes from direct browser access.
 * It validates that requests come from the application's pages using multiple checks:
 * 1. Custom header that can only be set via JavaScript fetch (not browser URL bar)
 * 2. Authentication token verification (user must be logged in)
 * 3. Referer header validation (optional, as it can be spoofed)
 */

import { NextRequest } from 'next/server';
import { COOKIE_TOKEN } from '@/lib/cookies';

// Header name for the internal API marker
export const INTERNAL_API_HEADER = 'x-internal-request';

// Expected value for the internal API header
const INTERNAL_API_VALUE = 'true';

/**
 * Verify that a request is coming from internal application pages
 * 
 * Security checks:
 * 1. Custom header presence (cannot be set via direct browser navigation)
 * 2. Valid authentication token (user must be logged in)
 * 3. Optionally check referer (less reliable, can be omitted for API routes)
 * 
 * @param request - Next.js request object
 * @param requireAuth - Whether to require authentication (default: true)
 * @returns null if valid, error response object if invalid
 */
export function verifyInternalApiRequest(
  request: NextRequest,
  requireAuth: boolean = true
): { error: string; status: number } | null {
  
  // Check 1: Verify custom header
  // This header can only be set via JavaScript fetch/XMLHttpRequest, not via browser URL bar
  const internalHeader = request.headers.get(INTERNAL_API_HEADER);
  
  if (internalHeader !== INTERNAL_API_VALUE) {
    return {
      error: 'Forbidden: Direct access to this API endpoint is not allowed',
      status: 403
    };
  }

  // Check 2: Verify authentication token (if required)
  if (requireAuth) {
    const token = request.cookies.get(COOKIE_TOKEN)?.value;
    
    if (!token) {
      return {
        error: 'Unauthorized: Authentication required',
        status: 401
      };
    }
  }

  // Check 3 (Optional): Verify referer header
  // Note: This is less reliable as it can be spoofed or omitted by browsers
  // We'll use it as an additional check but not rely on it solely
  const referer = request.headers.get('referer');
  const origin = request.headers.get('origin');
  
  // If referer or origin exists, validate it's from the same host (allowing different ports/protocols in dev)
  if (referer || origin) {
    const requestUrl = new URL(request.url);
    const refererUrl = referer ? new URL(referer) : null;
    const originUrl = origin ? new URL(origin) : null;
    
    // In development, allow localhost, 127.0.0.1, and local network IPs
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const isLocalHost = (hostname: string) => {
      return hostname === 'localhost' || 
             hostname === '127.0.0.1' || 
             hostname.startsWith('192.168.') || 
             hostname.startsWith('10.') ||
             hostname.startsWith('172.');
    };
    
    const isSameOrigin = 
      (refererUrl && refererUrl.origin === requestUrl.origin) ||
      (originUrl && originUrl.origin === requestUrl.origin);
    
    const isValidDevelopmentOrigin = isDevelopment && (
      (refererUrl && isLocalHost(refererUrl.hostname) && isLocalHost(requestUrl.hostname)) ||
      (originUrl && isLocalHost(originUrl.hostname) && isLocalHost(requestUrl.hostname))
    );
    
    if (!isSameOrigin && !isValidDevelopmentOrigin) {
      return {
        error: 'Forbidden: Invalid request origin',
        status: 403
      };
    }
  }

  // All checks passed
  return null;
}

/**
 * Get headers for internal API requests (client-side)
 * These headers identify the request as coming from the application
 * 
 * @returns Headers object with internal API marker
 */
export function getInternalApiHeaders(): Record<string, string> {
  return {
    [INTERNAL_API_HEADER]: INTERNAL_API_VALUE
  };
}