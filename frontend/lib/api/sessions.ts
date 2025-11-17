/**
 * Sessions API client
 */

import type { Session, SessionInfo } from "@/types/api";
import { getApiBaseUrl, getAuthHeaders, handleResponse } from "./client";

export async function getSession(sessionId: string): Promise<SessionInfo> {
  const apiBaseUrl = await getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/session/${sessionId}`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<SessionInfo>(response);
}

export async function deleteSession(sessionId: string): Promise<void> {
  const apiBaseUrl = await getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/session/${sessionId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  await handleResponse(response);
}

/**
 * Delete all sessions from the backend (if authenticated)
 */
export async function deleteAllSessions(): Promise<void> {
  try {
    const { sessions } = await listSessions();
    // Delete all sessions in parallel
    await Promise.all(
      sessions.map((session) => deleteSession(session.session_id))
    );
  } catch (error) {
    // If not authenticated or error, just continue (local storage will be cleared)
    console.warn("Failed to delete sessions from backend:", error);
  }
}

export async function listSessions(): Promise<{ sessions: Session[] }> {
  const apiBaseUrl = await getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/api/sessions`, {
    headers: getAuthHeaders(),
  });
  return handleResponse<{ sessions: Session[] }>(response);
}
