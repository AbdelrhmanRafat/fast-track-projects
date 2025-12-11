// src/lib/network/errorHandler.ts

import type { ApiError, NetworkError } from './types';
import { HTTP_STATUS_CODES, ERROR_MESSAGES } from './config';

export class ErrorHandler {
  
  public static createError(
    message: string,
    status: number,
    statusText: string,
    code?: string,
    details?: any
  ): NetworkError {
    return {
      message,
      status,
      statusText,
      code,
      details
    };
  }

  /**
   * Extract error message from backend response data
   * Follows multiple possible response structures
   */
  private static extractErrorMessage(responseData?: any): string | null {
    if (!responseData) return null;

    // Try different possible error message paths
    if (typeof responseData === 'string') {
      return responseData;
    }

    // Common backend error structures
    if (responseData.message) {
      return responseData.message;
    }

    if (responseData.error) {
      if (typeof responseData.error === 'string') {
        return responseData.error;
      }
      if (responseData.error.message) {
        return responseData.error.message;
      }
    }

    // Laravel/PHP style errors
    if (responseData.errors) {
      if (typeof responseData.errors === 'string') {
        return responseData.errors;
      }
      // Handle validation errors object
      if (typeof responseData.errors === 'object') {
        const firstError = Object.values(responseData.errors)[0];
        if (Array.isArray(firstError) && firstError.length > 0) {
          return firstError[0] as string;
        }
      }
    }

    // Express.js style errors
    if (responseData.msg) {
      return responseData.msg;
    }

    return null;
  }

  public static handleFetchError(error: any, url: string): NetworkError {
    // Network connection error
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return this.createError(
        ERROR_MESSAGES.NETWORK_ERROR,
        0,
        'Network Error',
        'NETWORK_ERROR',
        { url, originalError: error.message }
      );
    }

    // Timeout error
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return this.createError(
        ERROR_MESSAGES.TIMEOUT,
        0,
        'Timeout',
        'TIMEOUT',
        { url, originalError: error.message }
      );
    }

    // Generic error
    return this.createError(
      error.message || ERROR_MESSAGES.NETWORK_ERROR,
      0,
      'Unknown Error',
      'UNKNOWN_ERROR',
      { url, originalError: error }
    );
  }

  public static handleHttpError(
    response: Response,
    responseData?: any
  ): NetworkError {
    const status = response.status;
    const statusText = response.statusText;

    // Extract the actual error message from backend response
    const extractedMessage = this.extractErrorMessage(responseData);

    switch (status) {
      case HTTP_STATUS_CODES.BAD_REQUEST:
        return this.createError(
          extractedMessage || 'Bad Request',
          status,
          statusText,
          'BAD_REQUEST',
          responseData
        );

      case HTTP_STATUS_CODES.UNAUTHORIZED:
        return this.createError(
          extractedMessage || ERROR_MESSAGES.UNAUTHORIZED,
          status,
          statusText,
          'UNAUTHORIZED',
          responseData
        );

      case HTTP_STATUS_CODES.FORBIDDEN:
        return this.createError(
          extractedMessage || ERROR_MESSAGES.FORBIDDEN,
          status,
          statusText,
          'FORBIDDEN',
          responseData
        );

      case HTTP_STATUS_CODES.NOT_FOUND:
        return this.createError(
          extractedMessage || ERROR_MESSAGES.NOT_FOUND,
          status,
          statusText,
          'NOT_FOUND',
          responseData
        );

      case HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR:
        return this.createError(
          extractedMessage || ERROR_MESSAGES.SERVER_ERROR,
          status,
          statusText,
          'SERVER_ERROR',
          responseData
        );

      case HTTP_STATUS_CODES.BAD_GATEWAY:
      case HTTP_STATUS_CODES.SERVICE_UNAVAILABLE:
        return this.createError(
          extractedMessage || 'Service temporarily unavailable',
          status,
          statusText,
          'SERVICE_UNAVAILABLE',
          responseData
        );

      default:
        return this.createError(
          extractedMessage || `HTTP Error ${status}`,
          status,
          statusText,
          'HTTP_ERROR',
          responseData
        );
    }
  }

  public static handleCacheError(operation: string, error: any): NetworkError {
    return this.createError(
      ERROR_MESSAGES.CACHE_ERROR,
      500,
      'Cache Error',
      'CACHE_ERROR',
      { operation, originalError: error.message }
    );
  }



  public static formatErrorMessage(error: NetworkError): string {
    if (error.status > 0) {
      return `${error.message} (${error.status})`;
    }

    return error.message;
  }

  public static logError(error: NetworkError, context?: any): void {
    const logData = {
      message: error.message,
      status: error.status,
      code: error.code,
      details: error.details,
      context,
      timestamp: new Date().toISOString()
    };

    // In production, send to logging service
    // Error logged silently
  }
}