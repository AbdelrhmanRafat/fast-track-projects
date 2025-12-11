// src/lib/network/types.ts

export interface LanguageConfig {
  enabled: boolean;
  language?: string;
}

export interface DeviceConfig {
  deviceId: string;
  pushToken: string;
}

export interface NetworkConfig {
  baseURL: string;
  timeout?: number;
  defaultHeaders?: Record<string, string>;
  cache?: CacheConfig;
  auth?: AuthConfig;
  language?: LanguageConfig;
  device?: DeviceConfig;
  appEnv?: AppEnvConfig;
}

export interface AppEnvConfig {
  enabled: boolean;
  value?: string;
}

export interface CacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache entries
}

export interface AuthConfig {
  enabled: boolean;
  jwtToken?: string;
}

export interface RequestOptions<T = any> {
  headers?: Record<string, string>;
  timeout?: number;
  cache?: boolean;
  auth?: boolean;
  body?: T;
  contentType?: 'json' | 'form-data' | 'auto'; // Auto-detect based on body type
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  success: boolean;
}

export interface ApiError {
  message: string;
  status: number;
  statusText: string;
  code?: string;
  details?: any;
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface DeviceInfo {
  name: string;
  type: string;
  os: string;
  osVersion: string;
  udid: string;
  pushToken: string;
}

// Generic HTTP Methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// Supported body types for requests
export type RequestBody = 
  | string 
  | FormData 
  | File 
  | Blob 
  | URLSearchParams 
  | ReadableStream
  | object 
  | null 
  | undefined;

// API Endpoint typing
export interface ApiEndpoint<TRequest = any, TResponse = any> {
  url: string;
  method: HttpMethod;
  request?: TRequest;
  response: TResponse;
}

// Generic response types
export type NetworkResponse<T> = Promise<ApiResponse<T>>;
export type NetworkError = ApiError;

// Utility types
export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;