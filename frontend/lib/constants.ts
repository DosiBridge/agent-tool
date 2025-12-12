/**
 * Application-wide constants
 * Following Refactoring.Guru: Replace Magic Number with Symbolic Constant
 */

// Input constraints
export const MAX_INPUT_CHARS = 2000;
export const MIN_SUGGESTION_LENGTH = 0;
export const MAX_SUGGESTION_LENGTH = 20;
export const MAX_SUGGESTIONS_DISPLAY = 3;
export const DEBOUNCE_DELAY_MS = 300;

// Textarea configuration
export const TEXTAREA_MIN_HEIGHT = 60;
export const TEXTAREA_MAX_HEIGHT = 200;

// Scroll behavior
export const SCROLL_THRESHOLD_PX = 100;
export const AUTO_SCROLL_THRESHOLD_PX = 150;
export const STREAMING_SCROLL_THRESHOLD_PX = 200;
export const SCROLL_CHECK_TIMEOUT_MS = 150;
export const STREAMING_SCROLL_INTERVAL_MS = 100;
export const STREAMING_SCROLL_DELAY_MS = 50;

// Animation delays
export const MESSAGE_ANIMATION_DELAY_MS = 50;
export const STREAM_CHAR_DELAY_MS = 5;

// UI dimensions
export const ICON_SIZE_SMALL = 4;
export const ICON_SIZE_MEDIUM = 5;
export const ICON_SIZE_LARGE = 6;
export const AVATAR_SIZE_SMALL = 16;
export const AVATAR_SIZE_MEDIUM = 20;
export const AVATAR_SIZE_LARGE = 24;

// Rate limiting warnings
export const RATE_LIMIT_WARNING_THRESHOLD = 10;

// Session management
export const DEFAULT_SESSION_ID = "default";
export const SESSION_ID_PREFIX = "session-";

// Theme
export const THEME_STORAGE_KEY = "theme";
export const DEFAULT_THEME: "light" | "dark" | "system" = "system";

// Storage keys
export const GUEST_EMAIL_STORAGE_KEY = "guest_email";
export const AUTH_TOKEN_STORAGE_KEY = "auth_token";

// Toast durations
export const TOAST_DURATION_SHORT = 3000;
export const TOAST_DURATION_MEDIUM = 4000;
export const TOAST_DURATION_LONG = 6000;

// Common query prefixes for autocomplete
export const COMMON_QUERY_PREFIXES = [
  "What is",
  "How to",
  "Explain",
  "Tell me about",
  "Help me with",
  "Show me",
  "Create",
  "Write",
  "Analyze",
  "Compare",
  "Define",
  "Generate",
  "Fix",
  "Debug",
  "Summarize",
  "Translate",
  "Improve",
  "Optimize",
  "List",
  "Suggest",
] as const;

