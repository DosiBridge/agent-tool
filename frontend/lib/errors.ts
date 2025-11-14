/**
 * Error handling utilities and custom error classes
 */

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = "APIError";
    Object.setPrototypeOf(this, APIError.prototype);
  }
}

export class NetworkError extends Error {
  constructor(
    message: string = "Network error. Please check your connection."
  ) {
    super(message);
    this.name = "NetworkError";
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = "Authentication required. Please log in.") {
    super(message);
    this.name = "AuthenticationError";
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ValidationError";
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Parse error from API response
 */
export function parseAPIError(error: any): string {
  if (error instanceof APIError) {
    return error.message;
  }

  if (error instanceof NetworkError) {
    return error.message;
  }

  if (error instanceof AuthenticationError) {
    return error.message;
  }

  if (error instanceof ValidationError) {
    return error.message;
  }

  if (error?.response?.data?.detail) {
    return error.response.data.detail;
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.message) {
    return error.message;
  }

  return "An unexpected error occurred. Please try again.";
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyError(error: any): string {
  const message = parseAPIError(error);

  // Map common error messages to user-friendly ones
  const errorMappings: Record<string, string> = {
    "401": "Please log in to continue.",
    "403": "You don't have permission to perform this action.",
    "404": "The requested resource was not found.",
    "429": "Too many requests. Please wait a moment and try again.",
    "500": "Server error. Please try again later.",
    "502": "Service temporarily unavailable. Please try again later.",
    "503": "Service unavailable. Please try again later.",
    "Network request failed":
      "Network error. Please check your internet connection.",
    "Failed to fetch":
      "Unable to connect to the server. Please check your connection.",
  };

  // Check for status code patterns
  for (const [key, value] of Object.entries(errorMappings)) {
    if (message.includes(key) || error?.statusCode?.toString() === key) {
      return value;
    }
  }

  return message || "An unexpected error occurred. Please try again.";
}

/**
 * Log error for debugging (in development) or monitoring (in production)
 */
export function logError(error: Error, context?: Record<string, any>) {
  if (process.env.NODE_ENV === "development") {
    console.error("Error:", error, context);
  } else {
    // In production, send to error monitoring service
    // Example: Sentry.captureException(error, { extra: context });
    console.error("Error:", error.name, error.message, context);
  }
}
