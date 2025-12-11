import networkClient from '@/lib/networkClient';
import type { ApiResponse } from '@/lib/types/response';
import type { User } from './types';
import type { UserRole } from '@/lib/types/userRoles';

export interface CreateUserPayload {
  account_name: string;
  name: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserPayload {
  account_name?: string;
  name?: string;
  password?: string;
  role?: UserRole;
}

/**
 * Create a new user
 * Note: @fast-track.com is automatically appended to account_name by the API
 */
export async function createUser(payload: CreateUserPayload): Promise<ApiResponse<User>> {
  const response = await networkClient.post('/api/users', payload);
  return response.json();
}

/**
 * Update an existing user
 * Note: @fast-track.com is automatically appended to account_name by the API
 */
export async function updateUser(id: string, payload: UpdateUserPayload): Promise<ApiResponse<User>> {
  const response = await networkClient.put(`/api/users/update?id=${id}`, payload);
  return response.json();
}

/**
 * Delete a user
 */
export async function deleteUser(id: string): Promise<ApiResponse<null>> {
  const response = await networkClient.delete(`/api/users/delete?id=${id}`);
  return response.json();
}

/**
 * Toggle user activation status
 */
export async function toggleUserActivation(id: string): Promise<ApiResponse<User>> {
  const response = await networkClient.put(`/api/users/toggle-activation?id=${id}`, {});
  return response.json();
}
