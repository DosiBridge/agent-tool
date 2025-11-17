/**
 * Documents API client
 */

import type {
  AddTextRequest,
  AddTextResponse,
  Document,
  DocumentCollection,
} from "@/types/api";
import {
  getApiBaseUrl,
  getAuthHeaders,
  getAuthToken,
  handleResponse,
} from "./client";

export async function uploadDocument(
  file: File,
  collectionId?: number
): Promise<{ message: string; document: Document }> {
  const apiBaseUrl = await getApiBaseUrl();
  const formData = new FormData();
  formData.append("file", file);
  if (collectionId) {
    formData.append("collection_id", collectionId.toString());
  }

  const token = getAuthToken();
  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${apiBaseUrl}/api/documents/upload`, {
    method: "POST",
    headers,
    body: formData,
  });
  return handleResponse(response);
}

export async function listDocuments(
  collectionId?: number,
  status?: string
): Promise<{ documents: Document[]; count: number }> {
  const apiBaseUrl = await getApiBaseUrl();
  const params = new URLSearchParams();
  if (collectionId) params.append("collection_id", collectionId.toString());
  if (status) params.append("status", status);

  const response = await fetch(
    `${apiBaseUrl}/api/documents?${params.toString()}`,
    {
      headers: getAuthHeaders(),
    }
  );
  return handleResponse(response);
}

export async function getDocument(
  documentId: number
): Promise<{ document: Document }> {
  const apiBaseUrl = await getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/documents/${documentId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function deleteDocument(documentId: number): Promise<void> {
  const apiBaseUrl = await getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/documents/${documentId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  await handleResponse(response);
}

export async function approveDocument(
  documentId: number
): Promise<{ message: string }> {
  const apiBaseUrl = await getApiBaseUrl();
  const response = await fetch(
    `${apiBaseUrl}/api/documents/${documentId}/approve`,
    {
      method: "POST",
      headers: getAuthHeaders(),
    }
  );
  return handleResponse(response);
}

export async function rejectDocument(
  documentId: number,
  reason?: string
): Promise<{ message: string }> {
  const apiBaseUrl = await getApiBaseUrl();
  const response = await fetch(
    `${apiBaseUrl}/api/documents/${documentId}/reject`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    }
  );
  return handleResponse(response);
}

export async function getDocumentsNeedingReview(): Promise<{
  documents: Document[];
  count: number;
}> {
  const apiBaseUrl = await getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/documents/review/needed`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function getReviewStatistics(): Promise<{
  pending: number;
  needs_review: number;
  ready: number;
  error: number;
  total: number;
}> {
  const apiBaseUrl = await getApiBaseUrl();
  const response = await fetch(
    `${apiBaseUrl}/api/documents/review/statistics`,
    {
      headers: getAuthHeaders(),
    }
  );
  return handleResponse(response);
}

// Collections API
export async function createCollection(
  name: string,
  description?: string
): Promise<{ message: string; collection: DocumentCollection }> {
  const apiBaseUrl = await getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/collections`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ name, description }),
  });
  return handleResponse(response);
}

export async function listCollections(): Promise<{
  collections: DocumentCollection[];
  count: number;
}> {
  const apiBaseUrl = await getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/collections`, {
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
}

export async function deleteCollection(collectionId: number): Promise<void> {
  const apiBaseUrl = await getApiBaseUrl();
  const response = await fetch(
    `${apiBaseUrl}/api/collections/${collectionId}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    }
  );
  await handleResponse(response);
}

// Add text directly to RAG system
export async function addTextToRAG(
  request: AddTextRequest
): Promise<AddTextResponse> {
  const apiBaseUrl = await getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/documents/add-text`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });
  return handleResponse<AddTextResponse>(response);
}
