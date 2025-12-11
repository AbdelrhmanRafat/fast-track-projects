// src/lib/network/cache.ts

import type { CacheEntry, CacheConfig } from './types';

export class ServerCache {
  private cache: Map<string, CacheEntry> = new Map();
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
  }

  private generateKey(url: string, headers?: Record<string, string>): string {
    const headersStr = headers ? JSON.stringify(headers) : '';
    return `${url}:${headersStr}`;
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > (entry.timestamp + entry.ttl);
  }

  private cleanupExpired(): void {
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
      }
    }
  }

  private enforceMaxSize(): void {
    if (this.config.maxSize && this.cache.size > this.config.maxSize) {
      // Remove oldest entries (FIFO)
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = this.cache.size - this.config.maxSize;
      for (let i = 0; i < toRemove; i++) {
        this.cache.delete(entries[i][0]);
      }
    }
  }

  public get<T>(url: string, headers?: Record<string, string>): T | null {
    if (!this.config.enabled) {
      return null;
    }

    this.cleanupExpired();

    const key = this.generateKey(url, headers);
    const entry = this.cache.get(key);

    if (!entry || this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  public set<T>(url: string, data: T, headers?: Record<string, string>): void {
    if (!this.config.enabled) {
      return;
    }

    const key = this.generateKey(url, headers);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: this.config.ttl
    };

    this.cache.set(key, entry);
    this.enforceMaxSize();
  }

  public has(url: string, headers?: Record<string, string>): boolean {
    if (!this.config.enabled) {
      return false;
    }

    const key = this.generateKey(url, headers);
    const entry = this.cache.get(key);
    return entry ? !this.isExpired(entry) : false;
  }

  public delete(url: string, headers?: Record<string, string>): boolean {
    const key = this.generateKey(url, headers);
    return this.cache.delete(key);
  }

  public clear(): void {
    this.cache.clear();
  }

  public getStats(): { size: number; maxSize?: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize
    };
  }

  public invalidatePattern(pattern: string): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }
}