// src/lib/network/auth.ts
import type { AuthConfig } from './types';

export class AuthHandler {
  private config: AuthConfig;

  constructor(config: AuthConfig) {
    this.config = config;
  }

  public isEnabled(): boolean {
    return this.config.enabled;
  }

  public hasToken(): boolean {
    return !!this.config.jwtToken;
  }

  public getAuthHeaders(authOverride?: boolean): Record<string, string> {
    const headers: Record<string, string> = {};

    // Check if auth should be disabled for this specific request
    if (authOverride === false) {
      return headers;
    }

    // Use global config if no override specified
    const authEnabled = authOverride !== undefined ? authOverride : this.config.enabled;
        
    if (!authEnabled || !this.config.jwtToken) {
      return headers;
    }

    // Add JWT Token as Authorization header
    headers['Authorization'] = `Bearer ${this.config.jwtToken}`;

    return headers;
  }

  public setToken(token: string): void {
    this.config.jwtToken = token;
  }

  public clearToken(): void {
    this.config.jwtToken = undefined;
  }

  public getTokenInfo(): { hasToken: boolean; token?: string } {
    return {
      hasToken: !!this.config.jwtToken,
      token: this.config.jwtToken
    };
  }
}