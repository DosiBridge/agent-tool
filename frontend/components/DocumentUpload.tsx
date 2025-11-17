/**
 * Document upload component for RAG
 */
'use client';

import { useState } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { uploadDocument, listDocuments, deleteDocument, approveDocument, Document } from '@/lib/api';

interface DocumentUploadProps {
  onUploadComplete?: () => void;
}

export default function DocumentUpload({ onUploadComplete }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    await handleFiles(files);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      await handleFiles(files);
    }
  };

  const handleFiles = async (files: File[]) => {
    setIsUploading(true);
    setError(null);

    try {
      for (const file of files) {
        await uploadDocument(file);
      }
      await loadDocuments();
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const loadDocuments = async () => {
    try {
      const result = await listDocuments();
      setDocuments(result.documents);
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  };

  const handleDelete = async (documentId: number) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await deleteDocument(documentId);
      await loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    }
  };

  const handleApprove = async (documentId: number) => {
    try {
      await approveDocument(documentId);
      await loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve document');
    }
  };

  const getStatusIcon = (status: Document['status']) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'needs_review':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <File className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4 text-gray-200">Upload Documents</h2>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-gray-600 bg-gray-800/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-300 mb-2">
          Drag and drop files here, or click to select
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Supported formats: PDF, TXT, DOCX, MD (Max 100MB)
        </p>
        <input
          type="file"
          multiple
          accept=".pdf,.txt,.docx,.doc,.md"
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
          disabled={isUploading}
        />
        <label
          htmlFor="file-upload"
          className={`inline-block px-4 py-2 rounded bg-blue-600 text-white cursor-pointer hover:bg-blue-700 transition-colors ${
            isUploading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isUploading ? 'Uploading...' : 'Select Files'}
        </label>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-300">
          {error}
        </div>
      )}

      {/* Documents List */}
      {documents.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-200">Your Documents</h3>
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700"
              >
                <div className="flex items-center gap-3 flex-1">
                  {getStatusIcon(doc.status)}
                  <div className="flex-1">
                    <p className="text-gray-200 font-medium">{doc.original_filename}</p>
                    <p className="text-sm text-gray-400">
                      {formatFileSize(doc.file_size)} • {doc.chunk_count} chunks •{' '}
                      {doc.status}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {doc.status === 'needs_review' && (
                    <button
                      onClick={() => handleApprove(doc.id)}
                      className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 rounded text-white"
                    >
                      Approve
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

