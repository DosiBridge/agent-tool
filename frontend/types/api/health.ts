/**
 * Health API types
 */

export interface HealthStatus {
  status: string;
  version: string;
  rag_available: boolean;
  mcp_servers: number;
}
