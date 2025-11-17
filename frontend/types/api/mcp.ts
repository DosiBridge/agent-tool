/**
 * MCP Servers API types
 */

export interface MCPServer {
  name: string;
  url: string;
  connection_type?: "stdio" | "http" | "sse";
  has_api_key?: boolean;
  headers?: Record<string, string>;
  enabled?: boolean;
}

export interface MCPServerRequest {
  name: string;
  url: string;
  connection_type?: "stdio" | "http" | "sse";
  api_key?: string;
  headers?: Record<string, string>;
  enabled?: boolean;
}
