/**
 * Documents API types
 */

export interface Document {
  id: number;
  filename: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  status: "pending" | "processing" | "ready" | "error" | "needs_review";
  metadata?: Record<string, unknown>;
  chunk_count: number;
  embedding_status: string;
  collection_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface DocumentCollection {
  id: number;
  name: string;
  description?: string;
  document_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface AddTextRequest {
  title: string;
  content: string;
  collection_id?: number | null;
  chunk_size?: number;
  chunk_overlap?: number;
  metadata?: Record<string, unknown>;
}

export interface AddTextResponse {
  message: string;
  document: Document;
  chunks_added: number;
  embedding_status: string;
}
