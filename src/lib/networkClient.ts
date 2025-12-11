import { startGlobalLoading, stopGlobalLoading } from '@/stores/loadingStore';
import { useErrorStore } from '@/stores/errorStore';
import { getInternalApiHeaders } from '@/lib/utils/apiSecurity';

interface RequestOptions extends RequestInit {
  showLoading?: boolean;
  /**
   * Legacy flag: when false, suppress success messages but still show errors.
   * Use `showSuccess` / `showError` for fine-grained control.
   */
  showMessage?: boolean;
  /** Show success messages (overrides showMessage if provided) */
  showSuccess?: boolean;
  /** Show error messages (overrides showMessage if provided) */
  showError?: boolean;
}

class NetworkClient {
  private baseURL: string;

  constructor(baseURL: string = '') {
    this.baseURL = baseURL;
  }

  private async request(
    url: string, 
    options: RequestOptions = {}
  ): Promise<Response> {
  const { showLoading = true, showMessage = true, showSuccess, showError, ...fetchOptions } = options;
    const fullUrl = this.baseURL + url;
    
    // Only trigger loading for PUT, POST, DELETE requests (not GET)
    const shouldShowLoading = showLoading &&
      fetchOptions.method &&
      ['PUT', 'POST', 'DELETE'].includes(fetchOptions.method.toUpperCase());

    // Resolve message/show flags. Backwards compatibility: if showMessage === false,
    // treat that as "suppress success messages" but still show errors.
    const resolvedShowSuccess = typeof showSuccess === 'boolean' ? showSuccess : (showMessage !== false);
    const resolvedShowError = typeof showError === 'boolean' ? showError : true;

    try {
      if (shouldShowLoading) {
        startGlobalLoading();
      }

      const response = await fetch(fullUrl, {
        ...fetchOptions,
        credentials: 'include', // Include cookies in requests
      });
      
      // Handle automatic message display for PUT, POST, DELETE requests
      if ((resolvedShowSuccess || resolvedShowError) && fetchOptions.method &&
          ['PUT', 'POST', 'DELETE'].includes(fetchOptions.method.toUpperCase())) {
        await this.handleResponseMessage(response.clone(), resolvedShowSuccess, resolvedShowError);
      }
      
      if (shouldShowLoading) {
        stopGlobalLoading();
      }

      return response;
    } catch (error) {
      if (shouldShowLoading) {
        stopGlobalLoading();
      }
      
      // Show network error message (only if error messages are enabled)
      if (resolvedShowError) {
        const { showError } = useErrorStore.getState();
        showError('Network error occurred. Please check your connection.', 'error');
      }
      
      throw error;
    }
  }

  private async handleResponseMessage(response: Response, showSuccess = true, showError = true): Promise<void> {
    try {
      const data = await response.json();
      
      // Handle different response structures
      let message = '';
      
      if (data.message) {
        message = data.message;
      } else if (data.data && data.data.message) {
        message = data.data.message;
      } else if (!response.ok) {
        // Handle error messages
        if (data.error) {
          message = data.error;
        } else if (data.errors) {
          if (Array.isArray(data.errors)) {
            message = data.errors.join(', ');
          } else if (typeof data.errors === 'string') {
            message = data.errors;
          }
        } else {
          message = `Request failed with status ${response.status}`;
        }
      }
      
      if (message) {
         const isSuccess = response.ok;
         // Only show messages depending on flags: show success only if showSuccess, show errors only if showError
         if ((isSuccess && showSuccess) || (!isSuccess && showError)) {
           const messageType = isSuccess ? 'success' : 'error';
           useErrorStore.getState().showError(message, messageType);
         }
       }
    } catch (error) {
      // If response doesn't have JSON or message, ignore
    }
  }

  async get(url: string, options: RequestOptions = {}): Promise<Response> {
    return this.request(url, {
      ...options,
      method: 'GET',
      headers: {
        ...getInternalApiHeaders(),
        ...options.headers,
      },
    });
  }

  async post(url: string, body?: any, options: RequestOptions = {}): Promise<Response> {
    const requestOptions: RequestOptions = {
      ...options,
      method: 'POST',
    };

    if (body instanceof FormData) {
      requestOptions.body = body;
      requestOptions.headers = {
        ...getInternalApiHeaders(),
        ...options.headers,
      };
    } else if (body) {
      requestOptions.body = JSON.stringify(body);
      requestOptions.headers = {
        'Content-Type': 'application/json',
        ...getInternalApiHeaders(),
        ...options.headers,
      };
    } else {
      requestOptions.headers = {
        ...getInternalApiHeaders(),
        ...options.headers,
      };
    }

    return this.request(url, requestOptions);
  }

  async put(url: string, body?: any, options: RequestOptions = {}): Promise<Response> {
    const requestOptions: RequestOptions = {
      ...options,
      method: 'PUT',
    };

    if (body instanceof FormData) {
      requestOptions.body = body;
      requestOptions.headers = {
        ...getInternalApiHeaders(),
        ...options.headers,
      };
    } else if (body) {
      requestOptions.body = JSON.stringify(body);
      requestOptions.headers = {
        'Content-Type': 'application/json',
        ...getInternalApiHeaders(),
        ...options.headers,
      };
    } else {
      requestOptions.headers = {
        ...getInternalApiHeaders(),
        ...options.headers,
      };
    }

    return this.request(url, requestOptions);
  }

  async delete(url: string, options: RequestOptions = {}): Promise<Response> {
    return this.request(url, {
      ...options,
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...getInternalApiHeaders(),
        ...options.headers,
      },
    });
  }
}

// Create and export a default instance
const networkClient = new NetworkClient();

export default networkClient;
export { NetworkClient };