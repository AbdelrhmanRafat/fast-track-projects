// src/lib/network/utils.ts

export class NetworkUtils {
  
  public static createAbortController(timeout: number): AbortController {
    const controller = new AbortController();
    
    setTimeout(() => {
      controller.abort();
    }, timeout);
    
    return controller;
  }

  public static buildUrl(baseURL: string, endpoint: string, params?: Record<string, any>): string {
    // Remove trailing slash from baseURL and leading slash from endpoint
    const cleanBase = baseURL.replace(/\/+$/, '');
    const cleanEndpoint = endpoint.replace(/^\/+/, '');
    
    let url = `${cleanBase}/${cleanEndpoint}`;

    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
      
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    return url;
  }

  public static mergeHeaders(...headerObjects: (Record<string, string> | undefined)[]): Record<string, string> {
    const merged: Record<string, string> = {};
    
    headerObjects.forEach(headers => {
      if (headers && typeof headers === 'object') {
        Object.entries(headers).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            merged[key] = String(value);
          }
        });
      }
    });
    
    return merged;
  }

  public static parseResponseHeaders(headers: Headers): Record<string, string> {
    const parsed: Record<string, string> = {};
    
    headers.forEach((value, key) => {
      parsed[key] = value;
    });
    
    return parsed;
  }

  public static isJsonResponse(headers: Record<string, string>): boolean {
    const contentType = headers['content-type'] || headers['Content-Type'] || '';
    return contentType.includes('application/json');
  }

  public static async parseResponse<T>(response: Response): Promise<T> {
    const headers = this.parseResponseHeaders(response.headers);
    
    if (!response.ok) {
      // Try to parse error response
      try {
        if (this.isJsonResponse(headers)) {
          return await response.json();
        } else {
          const text = await response.text();
          return { message: text || response.statusText } as T;
        }
      } catch {
        return { message: response.statusText } as T;
      }
    }

    // Parse successful response
    try {
      if (this.isJsonResponse(headers)) {
        return await response.json();
      } else {
        const text = await response.text();
        return (text as unknown) as T;
      }
    } catch (error) {
      throw new Error(`Failed to parse response: ${error}`);
    }
  }

  public static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public static isSSR(): boolean {
    return typeof window === 'undefined';
  }

  public static getEnvironment(): 'server' | 'client' {
    return this.isSSR() ? 'server' : 'client';
  }

  public static sanitizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      return parsed.toString();
    } catch {
      // If URL parsing fails, do basic sanitization
      return url.replace(/[<>'"]/g, '');
    }
  }

  public static getTimestamp(): number {
    return Date.now();
  }

  public static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  public static deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (obj instanceof Date) {
      return new Date(obj.getTime()) as unknown as T;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.deepClone(item)) as unknown as T;
    }
    
    const cloned = {} as T;
    Object.keys(obj).forEach(key => {
      (cloned as any)[key] = this.deepClone((obj as any)[key]);
    });
    
    return cloned;
  }

  public static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  public static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  public static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  public static getRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}