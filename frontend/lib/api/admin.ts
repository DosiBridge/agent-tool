/**
 * Admin API client for superadmin operations
 */

import { getApiBaseUrl, getAuthHeaders, handleResponse } from "./client";

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  is_active: boolean;
  role: string;
  created_at?: string;
}

export interface SystemStats {
  total_users: number;
  active_users: number;
  blocked_users: number;
  total_conversations: number;
  total_documents: number;
  total_mcp_servers: number;
}

export async function listAllUsers(): Promise<AdminUser[]> {
  const apiBaseUrl = await getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/admin/users`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse<AdminUser[]>(response);
}

export async function getUser(userId: number): Promise<AdminUser> {
  const apiBaseUrl = await getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/admin/users/${userId}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse<AdminUser>(response);
}

export async function blockUser(userId: number): Promise<{ status: string; message: string; user: AdminUser }> {
  const apiBaseUrl = await getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/admin/users/${userId}/block`, {
    method: "PUT",
    headers: getAuthHeaders(),
  });
  return handleResponse<{ status: string; message: string; user: AdminUser }>(response);
}

export async function unblockUser(userId: number): Promise<{ status: string; message: string; user: AdminUser }> {
  const apiBaseUrl = await getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/admin/users/${userId}/unblock`, {
    method: "PUT",
    headers: getAuthHeaders(),
  });
  return handleResponse<{ status: string; message: string; user: AdminUser }>(response);
}

export async function getSystemStats(): Promise<SystemStats> {
  const apiBaseUrl = await getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/admin/system/stats`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
  return handleResponse<SystemStats>(response);
}
