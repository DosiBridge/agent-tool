/**
 * Tools API types
 */

export interface ToolsInfo {
  local_tools: Array<{
    name: string;
    description: string;
    type: string;
    custom?: boolean;
    id?: number;
    collection_id?: number | null;
  }>;
  mcp_servers: Array<{
    name: string;
    url: string;
    status: string;
  }>;
}

export interface CustomRAGTool {
  id: number;
  name: string;
  description: string;
  collection_id: number | null;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CustomRAGToolRequest {
  name: string;
  description: string;
  collection_id?: number | null;
  enabled?: boolean;
}
