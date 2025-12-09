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
