/**
 * RAG Enable Popup Component
 * Shows information about RAG mode and allows enabling it
 */
"use client";

import Modal from "@/components/ui/Modal";
import { useStore } from "@/lib/store";
import { FileText, Sparkles, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

export interface RAGEnablePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onEnable?: () => void;
}

export default function RAGEnablePopup({
  isOpen,
  onClose,
  onEnable,
}: RAGEnablePopupProps) {
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const setMode = useStore((state) => state.setMode);

  const handleEnable = () => {
    if (!isAuthenticated) {
      // Dispatch custom event to open auth modal (handled by chat page)
      window.dispatchEvent(
        new CustomEvent("open-auth", {
          detail: { mode: "login" },
        })
      );
      onClose();
      toast.error(
        "Please log in to use RAG mode. RAG mode requires authentication to upload and query documents."
      );
      return;
    }

    setMode("rag");
    if (onEnable) {
      onEnable();
    }
    onClose();
    toast.success("RAG mode enabled");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enable RAG Mode"
      size="md"
      showCloseButton={true}
      closeOnClickOutside={true}
      closeOnEscape={true}
    >
      <div className="p-6 space-y-6">
        {/* Icon and Description */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[var(--green)]/10 flex items-center justify-center">
            <FileText className="w-8 h-8 text-[var(--green)]" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              What is RAG Mode?
            </h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-md">
              RAG (Retrieval-Augmented Generation) mode allows you to upload
              documents and query them using AI. The AI can retrieve relevant
              information from your documents to provide more accurate and
              context-aware responses.
            </p>
          </div>
        </div>

        {/* Features List */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[var(--green)] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Upload and manage documents
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                Store your documents in collections for easy access
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[var(--green)] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Intelligent document search
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                AI retrieves relevant information from your documents
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[var(--green)] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Context-aware responses
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                Get answers based on your specific documents and data
              </p>
            </div>
          </div>
        </div>

        {/* Authentication Notice */}
        {!isAuthenticated && (
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              <strong>Note:</strong> RAG mode requires authentication. You'll be
              prompted to log in when you enable RAG mode.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] bg-[var(--input-bg)] hover:bg-[var(--surface-hover)] border border-[var(--input-border)] rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleEnable}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[var(--green)] hover:bg-[var(--green)]/90 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
          >
            <Sparkles className="w-4 h-4" />
            Enable RAG Mode
          </button>
        </div>
      </div>
    </Modal>
  );
}

