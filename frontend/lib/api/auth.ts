/**
 * Authentication API client
 */

import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from "@/types/api";
import {
  getApiBaseUrl,
  getAuthHeaders,
  handleResponse,
  removeAuthToken,
  setAuthToken,
} from "./client";

export async function requestOtp(email: string): Promise<{ message: string }> {
  const apiBaseUrl = await getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/auth/request-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return handleResponse<{ message: string }>(response);
}

export async function verifyOtp(email: string, otp: string): Promise<AuthResponse> {
  const apiBaseUrl = await getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
  const result = await handleResponse<AuthResponse>(response);

  // Determine if user is superadmin
  const isSuperadmin = result.user?.role === "superadmin";

  // Store token (always persistent for now? Or session? Standard is persistent for OAuth/modern apps)
  setAuthToken(result.access_token, isSuperadmin, true);
  return result;
}

// Deprecated: Legacy login
export async function login(
  data: LoginRequest,
  persistentAccess: boolean = false
): Promise<AuthResponse> {
  // Redirect to new flow or keep for backward compat if needed during transition
  // For now, throwing error to force new flow usage
  throw new Error("Password login is deprecated. Please use OTP login.");
}

// Deprecated: Legacy register
export async function register(
  data: RegisterRequest,
  persistentAccess: boolean = false
): Promise<AuthResponse> {
  throw new Error("Password registration is deprecated. Please use OTP login.");
}

export async function logout(): Promise<void> {
  const apiBaseUrl = await getApiBaseUrl();
  try {
    await fetch(`${apiBaseUrl}/api/auth/logout`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
  } catch (error) {
    // Ignore errors on logout
    console.error("Logout error:", error);
  } finally {
    removeAuthToken();
  }
}

/**
 * Get current user - returns user if authenticated, throws error if not
 * Note: 401 errors are expected when not authenticated and are handled silently
 */
export async function getCurrentUser(): Promise<User> {
  const apiBaseUrl = await getApiBaseUrl();
  try {
    const response = await fetch(`${apiBaseUrl}/api/auth/me`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      // For 401, this is expected when not authenticated - throw a specific error
      // Don't call handleResponse as it will remove the token unnecessarily
      if (response.status === 401) {
        const error = new Error("Not authenticated") as Error & {
          statusCode: number;
          isUnauthenticated: boolean;
        };
        error.statusCode = 401;
        error.isUnauthenticated = true;
        throw error;
      }
      // For other errors, use handleResponse
      return handleResponse<User>(response);
    }
    return response.json();
  } catch (error) {
    // If fetch fails (network error, etc.), treat as not authenticated
    if (error instanceof Error && error.name !== "AbortError") {
      // Re-throw if it's already our custom error
      if ((error as any).isUnauthenticated) {
        throw error;
      }
      const authError = new Error("Not authenticated") as Error & {
        statusCode: number;
        isUnauthenticated: boolean;
      };
      authError.statusCode = 401;
      authError.isUnauthenticated = true;
      throw authError;
    }
    throw error;
  }
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export async function updateProfile(data: UpdateProfileRequest): Promise<User> {
  const apiBaseUrl = await getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/auth/profile`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<User>(response);
}

export async function changePassword(data: ChangePasswordRequest): Promise<{ status: string; message: string }> {
  const apiBaseUrl = await getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/auth/change-password`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse<{ status: string; message: string }>(response);
}
