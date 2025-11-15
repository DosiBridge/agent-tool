/**
 * Sessions API types
 */

export interface Session {
  session_id: string;
  title?: string;
  summary?: string;
  message_count: number;
  updated_at?: string;
}

export interface SessionInfo {
  session_id: string;
  message_count: number;
  messages: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}
