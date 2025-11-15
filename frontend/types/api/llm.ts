/**
 * LLM Configuration API types
 */

export interface LLMConfig {
  type: "openai" | "groq" | "ollama" | "gemini";
  model: string;
  api_key?: string;
  base_url?: string;
  api_base?: string;
}

export interface LLMConfigResponse {
  type: string;
  model: string;
  has_api_key?: boolean;
  base_url?: string;
  api_base?: string;
}
