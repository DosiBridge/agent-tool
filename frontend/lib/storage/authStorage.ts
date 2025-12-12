/**
 * Secure Authentication Storage Utility
 *
 * Provides session-only token storage for all users
 */

const TOKEN_KEY = "auth_token";
const USER_ROLE_KEY = "user_role";

/**
 * Store user role
 */
export function storeUserRole(role: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(USER_ROLE_KEY, role);
}

/**
 * Get stored user role
 */
export function getUserRole(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USER_ROLE_KEY) || sessionStorage.getItem(USER_ROLE_KEY);
}

/**
 * Clear user role
 */
export function clearUserRole(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(USER_ROLE_KEY);
  sessionStorage.removeItem(USER_ROLE_KEY);
}

/**
 * Get authentication token from session storage
 */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

/**
 * Store authentication token in session storage
 */
export function setAuthToken(token: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(TOKEN_KEY, token);
}

/**
 * Remove authentication token from storage
 */
export function removeAuthToken(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(TOKEN_KEY);
  clearUserRole();
}


