/**
 * Users Types
 * 
 * Type definitions for users API responses and data structures.
 */

import { UserRole } from "@/lib/types/userRoles";

export interface UsersResponse {
  data: User[];
}

export interface User {
    id:           string;
    account_name: string;
    name:         string;
    role:         UserRole;
    is_active:    boolean;
    created_at:   Date;
    updated_at:   Date;
}
export interface CreateUserPayload {
    account_name: string;
    name:         string;
    password:     string;
    role:         UserRole;
}