/**
 * Parameter objects for function calls
 * Following Refactoring.Guru: Introduce Parameter Object
 */

export interface ChatRequestParams {
  message: string;
  sessionId: string;
  mode: "agent" | "rag";
  collectionId?: number | null;
  useReact?: boolean;
  guestEmail?: string;
}

export interface StreamCallbacks {
  onError: (error: string) => void;
  onStatusChange: (status: string | null) => void;
  onToolUsed: (tool: string) => void;
  onContent: (content: string) => void;
  onComplete: (toolsUsed?: string[]) => void;
}

export interface ScrollConfig {
  threshold: number;
  autoScrollThreshold: number;
  streamingThreshold: number;
  checkTimeout: number;
  streamingInterval: number;
  streamingDelay: number;
}

export interface MessageValidationResult {
  valid: boolean;
  error?: string;
}

export interface RateLimitInfo {
  isDefaultLLM: boolean;
  limit: number;
  remaining: number;
  isAllowed: boolean;
}

export interface SessionLoadParams {
  sessionId: string;
  isAuthenticated: boolean;
  impersonatedUserId: string | null;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: { is_active?: boolean } | null;
  accountInactive: boolean;
}

