"use client";

import { useState, useEffect, useRef } from "react";
import Modal from "@/components/ui/Modal";
import { useStore } from "@/lib/store"; // Assuming useStore has collections or we fetch them
import { uploadDocument, listCollections } from "@/lib/api"; // Updated import to use index
import { DocumentCollection } from "@/types/api";
import {
    CloudUpload,
    FileText,
    Plus,
    X,
    FolderOpen,
    CheckCircle2,
    AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface RAGUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUploadComplete?: () => void;
}

export default function RAGUploadModal({
    isOpen,
    onClose,
    onUploadComplete
}: RAGUploadModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [collections, setCollections] = useState<DocumentCollection[]>([]);
    const [selectedCollectionId, setSelectedCollectionId] = useState<number | undefined>(undefined);
    const [isUploading, setIsUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Fetch collections when modal opens
    useEffect(() => {
        if (isOpen) {
            loadCollections();
        } else {
            // Reset state when closed
            setFile(null);
            setIsUploading(false);
        }
    }, [isOpen]);

    const loadCollections = async () => {
        try {
            const result = await listCollections();
            setCollections(result.collections);
            // Optional: Auto-select recent collection or default?
        } catch (error) {
            console.error("Failed to load collections:", error);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        try {
            await uploadDocument(file, selectedCollectionId);
            toast.success("Document uploaded successfully! It is now processing.");
            if (onUploadComplete) {
                onUploadComplete();
            }
            onClose();
        } catch (error) {
            console.error("Upload failed:", error);
            toast.error("Failed to upload document.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Upload Knowledge"
            size="md"
        >
            <div className="p-6 pt-0 space-y-6">
                <p className="text-zinc-400 text-sm">
                    Upload documents to your knowledge base. The AI will learn from these files to answer your questions.
                </p>

                {/* Upload Handling */}
                <div
                    className={cn(
                        "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors cursor-pointer",
                        dragActive
                            ? "border-indigo-500 bg-indigo-500/10"
                            : "border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50",
                        file && "border-green-500/50 bg-green-500/5"
                    )}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        className="hidden"
                        onChange={handleChange}
                        accept=".pdf,.txt,.md,.docx,.csv"
                    />

                    {file ? (
                        <div className="text-center">
                            <div className="w-12 h-12 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mx-auto mb-3">
                                <FileText className="w-6 h-6" />
                            </div>
                            <p className="text-zinc-200 font-medium truncate max-w-[200px]">{file.name}</p>
                            <p className="text-zinc-500 text-xs mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setFile(null);
                                }}
                                className="mt-4 text-xs text-red-400 hover:text-red-300 flex items-center gap-1 mx-auto"
                            >
                                <X className="w-3 h-3" /> Remove file
                            </button>
                        </div>
                    ) : (
                        <div className="text-center">
                            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-3 text-zinc-400">
                                <CloudUpload className="w-6 h-6" />
                            </div>
                            <p className="text-zinc-300 font-medium">Click to upload or drag and drop</p>
                            <p className="text-zinc-500 text-xs mt-2">Support for PDF, TXT, DOCX, MD</p>
                        </div>
                    )}
                </div>

                {/* Collection Selector */}
                <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400 flex items-center gap-2">
                        <FolderOpen className="w-3.5 h-3.5" />
                        Collection (Optional)
                    </label>
                    <select
                        value={selectedCollectionId || ""}
                        onChange={(e) => setSelectedCollectionId(e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                        <option value="">Default Collection</option>
                        {collections.map(col => (
                            <option key={col.id} value={col.id}>{col.name}</option>
                        ))}
                    </select>
                </div>

                {/* Footer Actions */}
                <div className="flex gap-3 pt-2">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!file || isUploading}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isUploading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                Confirm Upload
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
