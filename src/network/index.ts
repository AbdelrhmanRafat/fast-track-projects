// src/lib/network/index.ts
import type {
  NetworkConfig,
  RequestOptions,
  ApiResponse,
  HttpMethod,
} from "./types";

import {
  DEFAULT_CONFIG,
  DEFAULT_HEADERS,
  getDynamicLanguageConfig,
  getDynamicAuthConfig,
} from "./config";
import { ServerCache } from "./cache";
import { AuthHandler } from "./auth";
import { LanguageHandler } from "./language";
import { DeviceDetector } from "./deviceDetector";
import { ErrorHandler } from "./errorHandler";
import { NetworkUtils } from "./utils";

export class NetworkLayer {
  private config: NetworkConfig;
  private cache: ServerCache;
  private authHandler: AuthHandler;
  private languageHandler: LanguageHandler;
  private deviceDetector: DeviceDetector;
  private clientIP?: string;

  constructor(config: Partial<NetworkConfig> = {}, cookieHeader?: string) {
    // Get dynamic configurations - use provided cookieHeader or empty string for server-side
    const dynamicLanguage = "ar";
    const dynamicAuth = getDynamicAuthConfig(cookieHeader || "");

    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      cache: {
        enabled: config.cache?.enabled ?? DEFAULT_CONFIG.cache!.enabled,
        ttl: config.cache?.ttl ?? DEFAULT_CONFIG.cache!.ttl,
        maxSize: config.cache?.maxSize ?? DEFAULT_CONFIG.cache!.maxSize,
      },
      auth: {
        enabled: config.auth?.enabled ?? dynamicAuth.enabled,
        jwtToken: config.auth?.jwtToken ?? dynamicAuth.jwtToken,
      },
      language: {
        enabled: config.language?.enabled ?? DEFAULT_CONFIG.language!.enabled,
        language: config.language?.language ?? dynamicLanguage,
      },
      device: {
        deviceId: config.device?.deviceId ?? `web-${this.generateUUID()}`,
        pushToken: config.device?.pushToken ?? `web-push-token-${Date.now()}`,
      },
      appEnv: {
        enabled: config.appEnv?.enabled ?? DEFAULT_CONFIG.appEnv!.enabled,
        value: config.appEnv?.value ?? DEFAULT_CONFIG.appEnv!.value,
      },
    };

    this.cache = new ServerCache(this.config.cache!);
    this.authHandler = new AuthHandler(this.config.auth!);
    this.languageHandler = new LanguageHandler(this.config.language!);
    this.deviceDetector = new DeviceDetector(this.config.device!);
  }

  private generateUUID(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Static factory method to create NetworkLayer with automatic cookie detection
   * This method properly handles async headers() in Next.js 15+
   *
   * @param config - Optional NetworkConfig overrides
   * @param cookieHeader - Optional cookie header string (useful in API routes where you have access to request.headers)
   */
  static async createWithAutoConfig(
    config: Partial<NetworkConfig> = {},
    cookieHeader?: string
  ): Promise<NetworkLayer> {
    let finalCookieHeader = cookieHeader || "";

    // If cookie header not provided, try to auto-detect from Next.js headers
    if (!finalCookieHeader) {
      // Auto-detect server-side context and get cookies from headers
      const isServerSide = typeof window === "undefined";

      if (isServerSide) {
        try {
          // Try to get cookies from Next.js headers() if available (async in Next.js 15+)
          const { headers } = await import("next/headers");
          const headerStore = await headers();
          finalCookieHeader = headerStore.get("cookie") || "";
        } catch (error) {
          // Fallback: headers() might not be available in all contexts (e.g., API routes)
          finalCookieHeader = "";
        }
      }
    }

    return new NetworkLayer(config, finalCookieHeader);
  }

  public async get<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>("GET", endpoint, options);
  }

  public async post<T, D = any>(
    endpoint: string,
    data?: D,
    options: RequestOptions<D> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>("POST", endpoint, { ...options, body: data });
  }

  public async put<T, D = any>(
    endpoint: string,
    data?: D,
    options: RequestOptions<D> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>("PUT", endpoint, { ...options, body: data });
  }

  public async delete<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>("DELETE", endpoint, options);
  }

  public async patch<T, D = any>(
    endpoint: string,
    data?: D,
    options: RequestOptions<D> = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>("PATCH", endpoint, { ...options, body: data });
  }

  private async request<T>(
    method: HttpMethod,
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const requestId = NetworkUtils.getRequestId();

    try {
      // Build URL
      const url = NetworkUtils.buildUrl(this.config.baseURL, endpoint);

      // Check cache for GET requests
      if (method === "GET" && options.cache !== false) {
        const cachedResponse = this.cache.get<ApiResponse<T>>(
          url,
          options.headers
        );
        if (cachedResponse) {
          return cachedResponse;
        }
      }

      // Prepare headers (with per-request auth control)
      const headers = this.buildHeaders(options.headers, options.auth);

      // Explicitly override accept-language header with cookie value to prevent browser override
      const languageHeaders = this.languageHandler.getLanguageHeaders();
      if (languageHeaders["Accept-Language"]) {
        headers["Accept-Language"] = languageHeaders["Accept-Language"];
      }

      // Determine content type and prepare body
      let body: BodyInit | null = null;
      let contentType: string | null = null;

      if (method !== "GET" && options.body !== undefined) {
        const result = this.prepareRequestBody(
          options.body,
          options.contentType
        );
        body = result.body;
        contentType = result.contentType;

        // Only set Content-Type header if determined and not already set
        if (
          contentType &&
          !headers["Content-Type"] &&
          !headers["content-type"]
        ) {
          headers["Content-Type"] = contentType;
        }
        // For FormData, explicitly avoid setting any Content-Type header
        // The browser will automatically set multipart/form-data with boundary
      } else if (
        method !== "GET" &&
        options.body === undefined &&
        !headers["Content-Type"] &&
        !headers["content-type"]
      ) {
        // For non-GET requests without body, default to JSON if no Content-Type is set
        headers["Content-Type"] = "application/json";
      }

      // Prepare request options
      const fetchOptions: RequestInit = {
        method,
        headers,
        body,
        signal: NetworkUtils.createAbortController(
          options.timeout || this.config.timeout || 10000
        ).signal,
      };

      // Make the request
      const response = await fetch(url, fetchOptions);

      // Parse response
      const responseData = await NetworkUtils.parseResponse<T>(response);
      const responseHeaders = NetworkUtils.parseResponseHeaders(
        response.headers
      );

      // Create API response
      const apiResponse: ApiResponse<T> = {
        data: responseData,
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        success: response.ok,
      };

      // Handle errors
      if (!response.ok) {
        const error = ErrorHandler.handleHttpError(response, responseData);
        ErrorHandler.logError(error, { requestId, url, method });
        throw error;
      }

      // Cache successful GET responses
      if (method === "GET" && options.cache !== false) {
        this.cache.set(url, apiResponse, options.headers);
      }

      return apiResponse;
    } catch (error: any) {
      // Handle network and other errors
      if (error.status !== undefined) {
        // Already a NetworkError, re-throw
        throw error;
      }

      const networkError = ErrorHandler.handleFetchError(error, endpoint);
      ErrorHandler.logError(networkError, { requestId, method, endpoint });
      throw networkError;
    }
  }

  private prepareRequestBody(
    body: any,
    contentType?: "json" | "form-data" | "auto"
  ): { body: BodyInit | null; contentType: string | null } {
    if (body === null || body === undefined) {
      return { body: null, contentType: null };
    }

    // Handle explicit content type
    if (contentType === "json") {
      return {
        body: typeof body === "string" ? body : JSON.stringify(body),
        contentType: "application/json",
      };
    }

    if (contentType === "form-data") {
      if (body instanceof FormData) {
        return { body, contentType: null }; // Let browser set multipart boundary
      }
      // Convert object to FormData
      const formData = new FormData();
      if (typeof body === "object") {
        Object.entries(body).forEach(([key, value]) => {
          if (value instanceof File || value instanceof Blob) {
            formData.append(key, value);
          } else if (value !== null && value !== undefined) {
            formData.append(key, String(value));
          }
        });
      }
      return { body: formData, contentType: null };
    }

    // Auto-detect content type (default behavior)
    if (body instanceof FormData) {
      return { body, contentType: null }; // Let browser set multipart boundary
    }

    if (body instanceof File || body instanceof Blob) {
      return { body, contentType: body.type || "application/octet-stream" };
    }

    if (body instanceof URLSearchParams) {
      return { body, contentType: "application/x-www-form-urlencoded" };
    }

    if (body instanceof ReadableStream) {
      return { body, contentType: "application/octet-stream" };
    }

    if (typeof body === "string") {
      return { body, contentType: "text/plain" };
    }

    // Default to JSON for objects
    return {
      body: JSON.stringify(body),
      contentType: "application/json",
    };
  }

  private buildHeaders(
    customHeaders?: Record<string, string>,
    authOverride?: boolean
  ): Record<string, string> {
    const headers = NetworkUtils.mergeHeaders(
      DEFAULT_HEADERS,
      this.deviceDetector.getDeviceHeaders(),
      this.config.defaultHeaders,
      this.authHandler.getAuthHeaders(authOverride),
      this.getAppEnvHeaders(),
      customHeaders,
      this.languageHandler.getLanguageHeaders()
    );

    return headers;
  }

  private getAppEnvHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    if (this.config.appEnv?.enabled && this.config.appEnv?.value) {
      headers["app-env"] = this.config.appEnv.value;
    }

    return headers;
  }

  // Method to set the real client IP (for server-side usage)
  public setClientIP(ip: string): void {
    this.clientIP = ip;
  }

  // Configuration methods
  public updateConfig(config: Partial<NetworkConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      cache: {
        enabled: config.cache?.enabled ?? this.config.cache!.enabled,
        ttl: config.cache?.ttl ?? this.config.cache!.ttl,
        maxSize: config.cache?.maxSize ?? this.config.cache!.maxSize,
      },
      auth: {
        enabled: config.auth?.enabled ?? this.config.auth!.enabled,
        jwtToken: config.auth?.jwtToken ?? this.config.auth!.jwtToken,
      },
      language: {
        enabled: config.language?.enabled ?? this.config.language!.enabled,
        language: config.language?.language ?? this.config.language!.language,
      },
      device: {
        deviceId: config.device?.deviceId ?? this.config.device!.deviceId,
        pushToken: config.device?.pushToken ?? this.config.device!.pushToken,
      },
    };

    // Update internal instances
    this.cache = new ServerCache(this.config.cache!);
    this.authHandler = new AuthHandler(this.config.auth!);
    this.languageHandler = new LanguageHandler(this.config.language!);
    this.deviceDetector = new DeviceDetector(this.config.device!);
  }

  public getConfig(): NetworkConfig {
    return NetworkUtils.deepClone(this.config);
  }

  // Authentication methods
  public setAuthToken(token: string): void {
    this.authHandler.setToken(token);
  }

  public clearAuthTokens(): void {
    this.authHandler.clearToken();
  }

  public getTokenInfo() {
    return this.authHandler.getTokenInfo();
  }

  // Language methods
  public setLanguage(language: string): void {
    this.languageHandler.setLanguage(language);
  }

  public getCurrentLanguage(): string | undefined {
    return this.languageHandler.getCurrentLanguage();
  }

  public clearLanguage(): void {
    this.languageHandler.clearLanguage();
  }

  public getLanguageInfo() {
    return this.languageHandler.getLanguageInfo();
  }

  // Cache methods
  public clearCache(): void {
    this.cache.clear();
  }

  public invalidateCache(pattern: string): number {
    return this.cache.invalidatePattern(pattern);
  }

  public getCacheStats() {
    return this.cache.getStats();
  }

  // Utility methods
  public isSSR(): boolean {
    return NetworkUtils.isSSR();
  }

  public buildUrl(endpoint: string, params?: Record<string, any>): string {
    return NetworkUtils.buildUrl(this.config.baseURL, endpoint, params);
  }
}

// Export types and utilities
export * from "./types";
export { ErrorHandler } from "./errorHandler";
export { NetworkUtils } from "./utils";

// Default export
export default NetworkLayer;
