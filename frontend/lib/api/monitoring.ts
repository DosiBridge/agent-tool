import { getApiBaseUrl, getAuthHeaders, handleResponse } from "./client";

export interface UsageStats {
  request_count: number;
  remaining: number;
  limit: number;
  is_allowed: boolean;
  is_default_llm: boolean;
  input_tokens: number;
  output_tokens: number;
  embedding_tokens: number;
  total_tokens: number;
  llm_provider?: string;
  llm_model?: string;
}

export interface ApiKeysInfo {
  active_provider: string;
  active_model: string;
  keys_configured: {
    openai: {
      set: boolean;
      purpose: string;
      used_for: string;
    };
    deepseek: {
      set: boolean;
      purpose: string;
      used_for: string;
    };
  };
  today_usage: {
    provider?: string;
    model?: string;
    input_tokens: number;
    output_tokens: number;
    embedding_tokens: number;
  };
}

export const getTodayUsage = async (): Promise<UsageStats> => {
  const apiBaseUrl = await getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/monitoring/usage/today`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<{ status: string; data: UsageStats }>(response);
  return data.data;
};

export const getApiKeysInfo = async (): Promise<ApiKeysInfo> => {
  const apiBaseUrl = await getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/monitoring/usage/keys`, {
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<{ status: string; data: ApiKeysInfo }>(response);
  return data.data;
};
