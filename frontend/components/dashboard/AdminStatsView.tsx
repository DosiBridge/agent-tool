import React, { useEffect, useState } from 'react';
import { Loader2, Users, MessageSquare, FileText, Server } from 'lucide-react';
import { getSystemStats, SystemStats } from '@/lib/api/admin';
import toast from 'react-hot-toast';

export default function AdminStatsView() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<SystemStats | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await getSystemStats();
                setStats(data);
            } catch (error) {
                console.error("Failed to load system stats:", error);
                toast.error("Failed to load system statistics");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                        <Users className="w-4 h-4" />
                    </div>
                    <span className="text-sm text-zinc-400">Users</span>
                </div>
                <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold text-white">{stats.total_users}</span>
                    <span className="text-xs text-zinc-500 mb-1">({stats.active_users} active)</span>
                </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                        <MessageSquare className="w-4 h-4" />
                    </div>
                    <span className="text-sm text-zinc-400">Chats</span>
                </div>
                <span className="text-2xl font-bold text-white">{stats.total_conversations}</span>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                        <FileText className="w-4 h-4" />
                    </div>
                    <span className="text-sm text-zinc-400">Docs</span>
                </div>
                <span className="text-2xl font-bold text-white">{stats.total_documents}</span>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                        <Server className="w-4 h-4" />
                    </div>
                    <span className="text-sm text-zinc-400">MCP Servers</span>
                </div>
                <span className="text-2xl font-bold text-white">{stats.total_mcp_servers}</span>
            </div>
        </div>
    );
}
