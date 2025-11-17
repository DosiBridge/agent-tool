/**
 * Health API client
 */

import type { HealthStatus } from "@/types/api";
import { getApiBaseUrl, handleResponse } from "./client";

export async function getHealth(): Promise<HealthStatus> {
  const apiBaseUrl = await getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/health`);
  return handleResponse<HealthStatus>(response);
}
