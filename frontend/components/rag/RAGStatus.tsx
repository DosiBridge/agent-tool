"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { getReviewStatistics } from "@/lib/api";
import {
    BookOpen,
    CheckCircle2,
    Clock,
    AlertCircle,
    Database,
    RefreshCw
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
    const [loading, setLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);

    const fetchStats = async () => {
        if (!isAuthenticated) return;

        setLoading(true);
        try {
            const data = await getReviewStatistics();
            setStats(data);
        } catch (error) {
            console.error("Failed to fetch RAG stats:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (mode === "rag" && isAuthenticated) {
            fetchStats();
            // Poll every 30 seconds
            const interval = setInterval(fetchStats, 30000);
            return () => clearInterval(interval);
        }
    }, [mode, isAuthenticated]);

    if (mode !== "rag" || !isAuthenticated) return null;

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
                    <div className="flex items-center gap-2 text-indigo-400">
                        <Database className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase tracking-wider">Knowledge Base</span>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            fetchStats();
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
                            {stats ? (
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <div className="flex flex-col p-2 bg-zinc-950/50 rounded-lg border border-zinc-800/50">
                                        <div className="flex items-center gap-1.5 text-zinc-400 mb-1">
                                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                                            <span className="text-[10px] font-medium">Ready</span>
                                        </div>
                                        <span className="text-xl font-bold text-zinc-200">{stats.ready}</span>
                                    </div>

                                    <div className="flex flex-col p-2 bg-zinc-950/50 rounded-lg border border-zinc-800/50">
                                        <div className="flex items-center gap-1.5 text-zinc-400 mb-1">
                                            <Clock className="w-3 h-3 text-amber-500" />
                                            <span className="text-[10px] font-medium">Pending</span>
                                        </div>
                                        <span className="text-xl font-bold text-zinc-200">{stats.pending + stats.needs_review}</span>
                                    </div>

                                    <div className="col-span-2 flex items-center justify-between p-2 bg-zinc-950/50 rounded-lg border border-zinc-800/50">
                                        <div className="flex items-center gap-1.5 text-zinc-400">
                                            <BookOpen className="w-3 h-3 text-blue-500" />
                                            <span className="text-[10px] font-medium">Total Documents</span>
                                        </div>
                                        <span className="text-sm font-bold text-zinc-200">{stats.total}</span>
                                    </div>

                                    {stats.error > 0 && (
                                        <div className="col-span-2 flex items-center justify-between p-2 bg-red-950/20 rounded-lg border border-red-900/30">
                                            <div className="flex items-center gap-1.5 text-red-400">
                                                <AlertCircle className="w-3 h-3" />
                                                <span className="text-[10px] font-medium">Errors</span>
                                            </div>
                                            <span className="text-sm font-bold text-red-400">{stats.error}</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="py-4 text-center text-xs text-zinc-500">
                                    Loading stats...
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
