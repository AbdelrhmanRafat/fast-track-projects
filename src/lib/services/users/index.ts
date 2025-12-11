/**
 * Users Service
 * 
 * Server-side service for fetching users data using NetworkLayer.
 * Following the security pattern: Server Component → NetworkLayer → External API
 */

import { NetworkLayer } from '@/network';
import type { ApiResponse } from '@/network/types';
import type { User, UsersResponse } from './types';

/**
 * Get all users from the API
 * 
 * This is a server-side function that uses NetworkLayer.createWithAutoConfig()
 * to automatically handle authentication and headers.
 * 
 * @returns Promise<ApiResponse<UsersResponse> | null>
 * 
 * @example
 * // In a server component (page.tsx)
 * const usersResponse = await getUsers();
 * if (usersResponse?.data) {
 *   // Pass to client component
 * }
 */
export async function getUsers(): Promise<ApiResponse<UsersResponse> | null> {
  try {
    // Create NetworkLayer with automatic cookie/auth configuration
    const api = await NetworkLayer.createWithAutoConfig();
    
    // Make GET request to users endpoint
    const response = await api.get<UsersResponse>('/get-project-engineers');
    
    return response;
  } catch (error) {
    return null;
  }
}

/**
 * Get a single user by ID
 * 
 * @param userId - The user ID
 * @returns Promise<ApiResponse<User> | null>
 */
export async function getUserById(
  userId: string | number
): Promise<ApiResponse<User> | null> {
  try {
    const api = await NetworkLayer.createWithAutoConfig();
    const response = await api.get<User>(`/users/${userId}`);
    return response;
  } catch (error) {
    return null;
  }
}
