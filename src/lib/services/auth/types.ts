import { UserRole } from "@/lib/types/userRoles";

// Sign In Types
export interface SignInRequest {
    account_name: string;
    password: string;
}

export interface SignInResponse {
    user: User;
    token: string;
}

// User Type
export interface User {
    id: string;
    account_name: string;
    name: string;
    role: UserRole;
    created_at: Date;
    updated_at: Date;
}

// Verify Login Types
export interface VerifyLoginResponse {
    isValid: boolean;
    user: User;
}

// Change Password Types
export interface ChangePasswordRequest {
    current_password: string;
    new_password: string;
}

export interface ChangePasswordResponse {
    message: string;
}

// Logout Types
export interface LogoutResponse {
    message: string;
}
