"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { getReviewStatistics, listDocuments } from "@/lib/api";
import { Document } from "@/types/api";
import {
    BookOpen,
    CheckCircle2,
    Clock,
    AlertCircle,
    Database,
    RefreshCw,
    Loader2,
    FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface RAGStats {
    pending: number;
    needs_review: number;
    ready: number;
    error: number;
    total: number;
}

export default function RAGStatus() {
    const mode = useStore((state) => state.mode);
    const isAuthenticated = useStore((state) => state.isAuthenticated);
    const [stats, setStats] = useState<RAGStats | null>(null);
    const [processingDocs, setProcessingDocs] = useState<Document[]>([]);
    const [loading, setLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);

    const fetchData = async () => {
        if (!isAuthenticated) return;

        setLoading(true);
        try {
            const [statsData, docsData] = await Promise.all([
                getReviewStatistics(),
                listDocuments()
            ]);
            setStats(statsData);

            // Filter for docs that are currently processing/pending
            const processing = docsData.documents.filter(
                doc => doc.status === 'processing' || doc.status === 'pending'
            );
            setProcessingDocs(processing);

            // Auto expand if there are processing items
            if (processing.length > 0) {
                setIsExpanded(true);
            }
        } catch (error) {
            console.error("Failed to fetch RAG data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (mode === "rag" && isAuthenticated) {
            fetchData();
            // Poll frequently (5s) for updates
            const interval = setInterval(fetchData, 5000);
            return () => clearInterval(interval);
        }
    }, [mode, isAuthenticated]);

    if (mode !== "rag" || !isAuthenticated) return null;

    const isProcessing = processingDocs.length > 0;

    return (
        <div className="fixed top-24 right-4 z-40 w-64 pointer-events-none sm:pointer-events-auto">
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-xl shadow-xl overflow-hidden"
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-zinc-800/50 transition-colors"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center gap-2">
                        {isProcessing ? (
                            <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                        ) : (
                            <Database className="w-4 h-4 text-indigo-400" />
                        )}
                        <span className="text-xs font-semibold uppercase tracking-wider text-indigo-100">
                            {isProcessing ? "Training in progress..." : "Knowledge Base"}
                        </span>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            fetchData();
                        }}
                        className={cn(
                            "p-1 text-zinc-500 hover:text-white rounded-full transition-colors",
                            loading && "animate-spin"
                        )}
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Content */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="px-4 pb-4"
                        >
                            {/* Processing List */}
                            {processingDocs.length > 0 && (
                                <div className="mb-3 space-y-2">
                                    <h5 className="text-[10px] font-semibold text-zinc-500 uppercase">Processing Queue</h5>
                                    <div className="space-y-1.5">
                                        {processingDocs.slice(0, 3).map(doc => (
                                            <div key={doc.id} className="flex items-center gap-2 text-xs text-zinc-300 bg-zinc-800/50 p-1.5 rounded-lg border border-zinc-700/30">
                                                <Loader2 className="w-3 h-3 animate-spin text-indigo-400 shrink-0" />
                                                <span className="truncate flex-1">{doc.original_filename}</span>
                                            </div>
                                        ))}
                                        {processingDocs.length > 3 && (
                                            <div className="text-[10px] text-center text-zinc-500">
                                                +{processingDocs.length - 3} more files...
                                            </div>
                                        )}
                                    </div>
                                    <div className="h-px bg-zinc-800/50 my-2" />
                                </div>
                            )}

                            {stats ? (
                                <div className="grid grid-cols-2 gap-3 pt-1">
                                    <div className="flex flex-col p-2 bg-zinc-950/50 rounded-lg border border-zinc-800/50">
                                        <div className="flex items-center gap-1.5 text-zinc-400 mb-1">
                                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                                            <span className="text-[10px] font-medium">Ready</span>
                                        </div>
                                        <span className="text-xl font-bold text-zinc-200">{stats.ready}</span>
                                    </div>

                                    <div className="col-span-1 flex flex-col p-2 bg-zinc-950/50 rounded-lg border border-zinc-800/50">
                                        <div className="flex items-center gap-1.5 text-zinc-400 mb-1">
                                            <BookOpen className="w-3 h-3 text-blue-500" />
                                            <span className="text-[10px] font-medium">Total</span>
                                        </div>
                                        <span className="text-xl font-bold text-zinc-200">{stats.total}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-2 text-center text-xs text-zinc-500">
                                    Loading...
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
