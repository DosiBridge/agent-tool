/**
 * Conditional expression helpers
 * Following Refactoring.Guru: Decompose Conditional, Replace Nested Conditional with Guard Clauses
 */

/**
 * Check if user can send message
 */
export function canSendMessage(
  input: string,
  isLoading: boolean,
  isStreaming: boolean,
  maxChars: number
): boolean {
  if (!input.trim()) return false;
  if (isLoading) return false;
  if (isStreaming) return false;
  if (input.length > maxChars) return false;
  return true;
}

/**
 * Check if RAG mode requires authentication
 */
export function requiresAuthForRAG(mode: string, isAuthenticated: boolean): boolean {
  return mode === "rag" && !isAuthenticated;
}

/**
 * Check if session should be loaded from backend
 */
export function shouldLoadFromBackend(
  isAuthenticated: boolean,
  impersonatedUserId: string | null
): boolean {
  return isAuthenticated && impersonatedUserId !== null;
}

/**
 * Check if account is inactive
 */
export function isAccountInactive(user: { is_active?: boolean } | null): boolean {
  return user !== null && user.is_active === false;
}

/**
 * Check if should show rate limit warning
 */
export function shouldShowRateLimitWarning(
  isDefaultLLM: boolean,
  limit: number,
  remaining: number
): boolean {
  if (!isDefaultLLM) return false;
  if (limit === -1) return false;
  return remaining <= 10 && remaining > 0;
}

/**
 * Check if rate limit is exceeded
 */
export function isRateLimitExceeded(
  isDefaultLLM: boolean,
  limit: number,
  isAllowed: boolean
): boolean {
  if (!isDefaultLLM) return false;
  if (limit === -1) return false;
  return !isAllowed;
}

/**
 * Guard clause: Validate message can be sent
 */
export function validateMessageSend(
  input: string,
  isLoading: boolean,
  isStreaming: boolean,
  maxChars: number
): { valid: boolean; error?: string } {
  if (!input.trim()) {
    return { valid: false, error: "Message cannot be empty" };
  }
  if (isLoading) {
    return { valid: false, error: "Please wait for current request to complete" };
  }
  if (isStreaming) {
    return { valid: false, error: "Please wait for current stream to complete" };
  }
  if (input.length > maxChars) {
    return { valid: false, error: `Message exceeds ${maxChars} characters` };
  }
  return { valid: true };
}

/**
 * Guard clause: Validate RAG mode access
 */
export function validateRAGModeAccess(
  mode: string,
  isAuthenticated: boolean
): { valid: boolean; error?: string } {
  if (mode === "rag" && !isAuthenticated) {
    return {
      valid: false,
      error: "Please log in to use RAG mode.",
    };
  }
  return { valid: true };
}

