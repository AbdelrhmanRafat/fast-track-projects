// src/lib/network/config.ts

import type { NetworkConfig } from "./types";
import { getToken, getServerToken } from "../lib/cookies";

/**
 * Generate a UUID for device identification
 */
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get dynamic authentication configuration for server-side usage
 * @param cookieHeader - Optional cookie header from request
 * @returns Auth configuration with token from cookies
 */
export function getDynamicAuthConfig(cookieHeader?: string): {
  enabled: boolean;
  jwtToken?: string;
} {
  // Try to get token from server-side cookie parsing
  const token = getServerToken(cookieHeader);

  return {
    enabled: true,
    jwtToken: token || undefined,
  };
}

/**
 * Get language configuration
 * Always returns Arabic since we only support Arabic
 */
export function getDynamicLanguageConfig(): string {
  return "en";
}

/**
 * Get dynamic device configuration
 * Creates consistent device ID and push token
 */
export function getDynamicDeviceConfig() {
  return {
    deviceId: `web-${generateUUID()}`,
    pushToken: `web-push-token-${Date.now()}`,
  };
}

export const DEFAULT_CONFIG: NetworkConfig = {
  baseURL: "https://ikhznagivsbcbggvppnt.supabase.co/functions/v1",
  timeout: 30000,
  defaultHeaders: {
    Accept: "application/json",
  },
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 100,
  },
  auth: {
    enabled: true,
    jwtToken: getToken() || undefined,
  },
  language: {
    enabled: true,
    language: "en", // Default language
  },
  device: getDynamicDeviceConfig(),
  appEnv: {
    enabled: false,
    value: "test",
  },
};

export const DEFAULT_HEADERS = {
  Accept: "application/json",
  "App-Version": "11",
  "Device-Type": "web",
};

export const HTTP_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network request failed",
  TIMEOUT: "Request timeout",
  UNAUTHORIZED: "Authentication required",
  FORBIDDEN: "Access forbidden",
  NOT_FOUND: "Resource not found",
  SERVER_ERROR: "Internal server error",
  CACHE_ERROR: "Cache operation failed",
} as const;
