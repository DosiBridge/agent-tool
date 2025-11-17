/**
 * Tools API client
 */

import type {
  CustomRAGTool,
  CustomRAGToolRequest,
  ToolsInfo,
} from "@/types/api";
import { getApiBaseUrl, getAuthHeaders, handleResponse } from "./client";

export async function getToolsInfo(): Promise<ToolsInfo> {
  const apiBaseUrl = await getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/tools`);
  return handleResponse<ToolsInfo>(response);
}

// Custom RAG Tools API
export async function createCustomRAGTool(
  tool: CustomRAGToolRequest
): Promise<CustomRAGTool> {
  const apiBaseUrl = await getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/custom-rag-tools`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(tool),
  });
  return handleResponse<CustomRAGTool>(response);
}

export async function listCustomRAGTools(): Promise<CustomRAGTool[]> {
  const apiBaseUrl = await getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/custom-rag-tools`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<CustomRAGTool[]>(response);
}

export async function getCustomRAGTool(toolId: number): Promise<CustomRAGTool> {
  const apiBaseUrl = await getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/custom-rag-tools/${toolId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<CustomRAGTool>(response);
}

export async function updateCustomRAGTool(
  toolId: number,
  tool: CustomRAGToolRequest
): Promise<CustomRAGTool> {
  const apiBaseUrl = await getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/custom-rag-tools/${toolId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(tool),
  });
  return handleResponse<CustomRAGTool>(response);
}

export async function deleteCustomRAGTool(toolId: number): Promise<void> {
  const apiBaseUrl = await getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/custom-rag-tools/${toolId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  await handleResponse(response);
}

export async function toggleCustomRAGTool(
  toolId: number
): Promise<CustomRAGTool> {
  const apiBaseUrl = await getApiBaseUrl();
  const response = await fetch(
    `${apiBaseUrl}/api/custom-rag-tools/${toolId}/toggle`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
    }
  );
  return handleResponse<CustomRAGTool>(response);
}
