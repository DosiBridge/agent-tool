import React, { useEffect, useState } from 'react';
import { MessageSquare, CheckCircle, Clock, X, Send, RefreshCw, User, Mail, Calendar } from 'lucide-react';
import { listAppeals, respondToAppeal, UserAppeal } from '@/lib/api/admin';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function AppealsView() {
    const [appeals, setAppeals] = useState<UserAppeal[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'reviewed' | 'resolved'>('all');
    const [selectedAppeal, setSelectedAppeal] = useState<UserAppeal | null>(null);
    const [responseText, setResponseText] = useState('');
    const [responding, setResponding] = useState(false);

    const loadAppeals = async () => {
        setLoading(true);
        try {
            const data = await listAppeals(filter === 'all' ? undefined : filter);
            setAppeals(data);
        } catch (error: any) {
            console.error("Failed to load appeals:", error);
            const errorMessage = error?.detail || error?.message || "Failed to load appeals";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAppeals();
    }, [filter]);

    const handleRespond = async () => {
        if (!selectedAppeal || !responseText.trim()) {
            toast.error("Please enter a response");
            return;
        }

        setResponding(true);
        try {
            await respondToAppeal(selectedAppeal.id, responseText.trim(), 'reviewed');
            toast.success("Response sent successfully");
            setSelectedAppeal(null);
            setResponseText('');
            await loadAppeals();
        } catch (error: any) {
            const errorMessage = error?.detail || error?.message || "Failed to send response";
            toast.error(errorMessage);
        } finally {
            setResponding(false);
        }
    };

    const handleResolve = async (appeal: UserAppeal) => {
        if (!confirm(`Mark this appeal as resolved?`)) {
            return;
        }

        try {
            await respondToAppeal(appeal.id, appeal.admin_response || "Resolved", 'resolved');
            toast.success("Appeal marked as resolved");
            await loadAppeals();
        } catch (error: any) {
            const errorMessage = error?.detail || error?.message || "Failed to update appeal";
            toast.error(errorMessage);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-zinc-400">Loading appeals...</p>
                </div>
            </div>
        );
    }

    const pendingCount = appeals.filter(a => a.status === 'pending').length;
    const reviewedCount = appeals.filter(a => a.status === 'reviewed').length;
    const resolvedCount = appeals.filter(a => a.status === 'resolved').length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-900/50 backdrop-blur-sm border border-white/5 p-6 rounded-3xl">
                <div>
                    <h2 className="text-xl font-bold text-white mb-1">User Appeals</h2>
                    <p className="text-sm text-zinc-400">
                        Messages from blocked users requesting account unblocking
                    </p>
                </div>
                <button
                    onClick={loadAppeals}
                    disabled={loading}
                    className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-400 hover:text-white transition-colors border border-white/5"
                    title="Refresh appeals"
                >
                    <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-zinc-400 mb-1">Pending</p>
                            <p className="text-2xl font-bold text-yellow-400">{pendingCount}</p>
                        </div>
                        <Clock className="w-8 h-8 text-yellow-400/20" />
                    </div>
                </div>
                <div className="bg-zinc-900/50 border border-blue-500/20 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-zinc-400 mb-1">Reviewed</p>
                            <p className="text-2xl font-bold text-blue-400">{reviewedCount}</p>
                        </div>
                        <MessageSquare className="w-8 h-8 text-blue-400/20" />
                    </div>
                </div>
                <div className="bg-zinc-900/50 border border-green-500/20 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-zinc-400 mb-1">Resolved</p>
                            <p className="text-2xl font-bold text-green-400">{resolvedCount}</p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-400/20" />
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 border-b border-white/5">
                {(['all', 'pending', 'reviewed', 'resolved'] as const).map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={cn(
                            "px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize",
                            filter === status
                                ? "border-purple-500 text-purple-400"
                                : "border-transparent text-zinc-400 hover:text-white"
                        )}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {/* Appeals List */}
            <div className="space-y-4">
                {appeals.length === 0 ? (
                    <div className="text-center py-12 text-zinc-500">
                        <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>No appeals found</p>
                    </div>
                ) : (
                    appeals.map((appeal) => (
                        <motion.div
                            key={appeal.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-zinc-900/50 border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                            {appeal.user_name?.[0]?.toUpperCase() || appeal.user_email?.[0]?.toUpperCase() || "U"}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-white truncate">{appeal.user_name || appeal.user_email || "Unknown User"}</p>
                                            <p className="text-xs text-zinc-500 flex items-center gap-1 truncate">
                                                <Mail className="w-3 h-3 flex-shrink-0" />
                                                <span className="truncate">{appeal.user_email || "No email"}</span>
                                            </p>
                                            {appeal.user_id && (
                                                <p className="text-xs text-zinc-600 mt-0.5">User ID: {appeal.user_id}</p>
                                            )}
                                        </div>
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-xs font-medium",
                                            appeal.status === 'pending'
                                                ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                                                : appeal.status === 'reviewed'
                                                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                                : "bg-green-500/10 text-green-400 border border-green-500/20"
                                        )}>
                                            {appeal.status}
                                        </span>
                                    </div>
                                    <div className="bg-zinc-950/50 rounded-lg p-4 mb-3">
                                        <p className="text-xs font-medium text-zinc-400 mb-2">Message:</p>
                                        <p className="text-sm text-zinc-300 whitespace-pre-wrap break-words">{appeal.message || "No message provided"}</p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 mb-2">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            Created: {appeal.created_at ? format(new Date(appeal.created_at), 'MMM d, yyyy HH:mm') : 'Unknown'}
                                        </span>
                                        {appeal.reviewed_at && (
                                            <>
                                                <span className="text-zinc-600">•</span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    Reviewed: {format(new Date(appeal.reviewed_at), 'MMM d, yyyy HH:mm')}
                                                </span>
                                            </>
                                        )}
                                        {appeal.reviewer_name && (
                                            <>
                                                <span className="text-zinc-600">•</span>
                                                <span>Reviewed by: <span className="text-zinc-400 font-medium">{appeal.reviewer_name}</span></span>
                                            </>
                                        )}
                                    </div>
                                    {appeal.admin_response && (
                                        <div className="mt-3 bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
                                            <p className="text-xs font-medium text-blue-400 mb-2 flex items-center gap-2">
                                                <CheckCircle className="w-3 h-3" />
                                                Admin Response:
                                            </p>
                                            <p className="text-sm text-zinc-300 whitespace-pre-wrap break-words">{appeal.admin_response}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col gap-2">
                                    {appeal.status === 'pending' && (
                                        <button
                                            onClick={() => setSelectedAppeal(appeal)}
                                            className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 hover:border-blue-500/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                        >
                                            <Send className="w-4 h-4" />
                                            Respond
                                        </button>
                                    )}
                                    {appeal.status !== 'resolved' && (
                                        <button
                                            onClick={() => handleResolve(appeal)}
                                            className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 hover:border-green-500/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                            Mark Resolved
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Response Modal */}
            <AnimatePresence>
                {selectedAppeal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        onClick={(e) => e.target === e.currentTarget && setSelectedAppeal(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-2xl shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-white">Respond to Appeal</h3>
                                <button
                                    onClick={() => {
                                        setSelectedAppeal(null);
                                        setResponseText('');
                                    }}
                                    className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="mb-4">
                                <div className="mb-4 p-3 bg-zinc-950/50 rounded-lg border border-zinc-800">
                                    <p className="text-xs text-zinc-500 mb-1">From:</p>
                                    <p className="text-sm font-medium text-white">{selectedAppeal.user_name || selectedAppeal.user_email || "Unknown User"}</p>
                                    {selectedAppeal.user_email && (
                                        <p className="text-xs text-zinc-500 mt-1">{selectedAppeal.user_email}</p>
                                    )}
                                    {selectedAppeal.user_id && (
                                        <p className="text-xs text-zinc-600 mt-1">User ID: {selectedAppeal.user_id}</p>
                                    )}
                                </div>
                                <div className="bg-zinc-950/50 rounded-lg p-3 mb-4">
                                    <p className="text-xs font-medium text-zinc-400 mb-2">Original Message:</p>
                                    <p className="text-sm text-zinc-300 whitespace-pre-wrap break-words">{selectedAppeal.message || "No message provided"}</p>
                                </div>
                                <label className="block text-sm font-medium text-zinc-300 mb-2">
                                    Your Response
                                </label>
                                <textarea
                                    value={responseText}
                                    onChange={(e) => setResponseText(e.target.value)}
                                    placeholder="Enter your response to the user..."
                                    rows={6}
                                    className="w-full bg-zinc-950/50 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 resize-none"
                                />
                            </div>
                            <div className="flex items-center justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setSelectedAppeal(null);
                                        setResponseText('');
                                    }}
                                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-white text-sm transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRespond}
                                    disabled={responding || !responseText.trim()}
                                    className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 hover:border-purple-500/30 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {responding ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Send Response
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

