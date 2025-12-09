import { getApiBaseUrl, getAuthHeaders, handleResponse } from "./client";

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  is_active: boolean;
  role: string;
  created_at: string;
}

export interface SystemStats {
  total_users: number;
  active_users: number;
  blocked_users: number;
  total_conversations: number;
  total_documents: number;
  total_mcp_servers: number;
}

export interface SystemUsageHistory {
  history: {
    date: string;
    requests: number;
    tokens: number;
    input_tokens: number;
    output_tokens: number;
    embedding_tokens: number;
    errors: number;
  }[];
  total_requests: number;
  days: number;
}

export const listUsers = async (): Promise<AdminUser[]> => {
  const apiBaseUrl = await getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/admin/users`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<AdminUser[]>(response);
};

export const getUser = async (userId: number): Promise<AdminUser> => {
  const apiBaseUrl = await getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/admin/users/${userId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<AdminUser>(response);
};

export const blockUser = async (userId: number): Promise<AdminUser> => {
  const apiBaseUrl = await getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/admin/users/${userId}/block`, {
    method: "PUT",
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<{ status: string; user: AdminUser }>(response);
  return data.user;
};

export const unblockUser = async (userId: number): Promise<AdminUser> => {
  const apiBaseUrl = await getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/admin/users/${userId}/unblock`, {
    method: "PUT",
    headers: getAuthHeaders(),
  });
  const data = await handleResponse<{ status: string; user: AdminUser }>(response);
  return data.user;
};

export const getSystemStats = async (): Promise<SystemStats> => {
  const apiBaseUrl = await getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/admin/system/stats`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<SystemStats>(response);
};

export const getSystemUsageHistory = async (days: number = 7): Promise<SystemUsageHistory> => {
  const apiBaseUrl = await getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/admin/system/usage-history?days=${days}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<SystemUsageHistory>(response);
};
