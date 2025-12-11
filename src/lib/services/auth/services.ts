import networkClient from '@/lib/networkClient';
import type { ApiResponse } from '@/lib/types/response';
import type { 
  SignInRequest, 
  SignInResponse, 
  VerifyLoginResponse, 
  ChangePasswordRequest, 
  ChangePasswordResponse,
  LogoutResponse 
} from './types';
import { setToken, clearAuthCookies, getToken, setUserData, getUserData, type UserData } from '@/lib/cookies';

// Re-export getUserData for convenience
export { getUserData, type UserData } from '@/lib/cookies';

/**
 * Sign in user with account name and password
 * Uses the secure pattern: Client → /api/auth/sign-in → NetworkLayer → External API
 * Saves token and encrypted user data (account_name, role) to cookies
 */
export async function signIn(
  signInData: SignInRequest
): Promise<ApiResponse<SignInResponse> | null> {
  try {
    const response = await networkClient.post('/api/auth/sign-in', signInData, {
      showMessage: false // Handle messages manually for auth flows
    });

    const result: ApiResponse<SignInResponse> = await response.json();

    if (response.ok && result.data) {
      // Save token to cookies
      setToken(result.data.token);
      
      // Save encrypted user data to cookies (including name if available)
      await setUserData({
        account_name: result.data.user.account_name,
        role: result.data.user.role,
        name: result.data.user.name
      });
      
      return result;
    }

    // Handle error response
    return result;
  } catch (error: any) {
    return null;
  }
}

/**
 * Verify login by checking the token stored in cookies
 * Token is automatically read from cookies - no token argument needed
 * Uses the secure pattern: Client → /api/auth/verify-login → NetworkLayer → External API
 */
export async function verifyLogin(): Promise<ApiResponse<VerifyLoginResponse> | null> {
  try {
    // Get token from cookies
    const token = getToken();
    
    if (!token) {
      return {
        code: 401,
        status: 401,
        errors: 'No authentication token found',
        message: 'No authentication token found',
        data: { isValid: false, user: null as any }
      };
    }

    const response = await networkClient.post('/api/auth/verify-login', {}, {
      showMessage: false, // Handle messages manually for auth flows
      showLoading : false, // No loading indicator for background verification
      showSuccess : false, // No success message for background verification
    });

    const result: ApiResponse<VerifyLoginResponse> = await response.json();

    if (!response.ok) {
      // Clear cookies if token is invalid
      clearAuthCookies();
    }

    return result;
  } catch (error: any) {
    clearAuthCookies();
    return null;
  }
}

/**
 * Change admin password
 * Uses the secure pattern: Client → /api/auth/change-password → NetworkLayer → External API
 */
export async function changePassword(
  passwordData: ChangePasswordRequest
): Promise<ApiResponse<ChangePasswordResponse> | null> {
  try {
    const response = await networkClient.post('/api/auth/change-password', passwordData, {
      showMessage: true // Show success/error messages for password change
    });

    const result: ApiResponse<ChangePasswordResponse> = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to change password');
    }

    return result;
  } catch (error: any) {
    return null;
  }
}

/**
 * Logout user and clear authentication cookies
 * Uses the secure pattern: Client → /api/auth/logout → NetworkLayer → External API
 */
export async function logout(): Promise<ApiResponse<LogoutResponse> | null> {
  try {
    const response = await networkClient.post('/api/auth/logout', {}, {
      showMessage: false // Handle messages manually for auth flows
    });

    // Clear auth cookies regardless of API response
    clearAuthCookies();

    if (response.ok) {
      const result: ApiResponse<LogoutResponse> = await response.json();
      return result;
    }

    // Return a standard response for failed API call (but local logout succeeded)
    return {
      code: 200,
      status: 200,
      errors: null,
      message: 'Logged out successfully',
      data: { message: 'Logged out successfully' }
    };
  } catch (error: any) {
    // Still clear cookies even on error
    clearAuthCookies();
    return {
      code: 200,
      status: 200,
      errors: null,
      message: 'Logged out successfully',
      data: { message: 'Logged out successfully' }
    };
  }
}
