import React, { useEffect, useState } from 'react';
import {
    Users,
    TrendingUp,
    Lock,
    MessageSquare,
    FileText,
    Server,
    ArrowUpRight,
    ArrowDownRight,
    Activity
} from 'lucide-react';
import { getSystemStats, SystemStats, getUsageAnalytics } from '@/lib/api/admin';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AnalyticsView() {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [usageData, setUsageData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const [data, usage] = await Promise.all([
                    getSystemStats(),
                    getUsageAnalytics(30)
                ]);
                setStats(data);
                setUsageData(usage);
            } catch (error) {
                console.error("Failed to load stats:", error);
            } finally {
                setLoading(false);
            }
        };
        loadStats();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-zinc-500">Loading analytics...</div>;
    }

    if (!stats) {
        return <div className="p-8 text-center text-red-400">Failed to load analytics data.</div>;
    }

    const StatCard = ({ title, value, icon: Icon, color, trend, className, delay = 0 }: any) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            className={cn(
                "bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:border-white/10 transition-all duration-500",
                className
            )}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                    <div className={cn("p-3 rounded-2xl bg-white/5 border border-white/5", color)}>
                        <Icon className="w-6 h-6" />
                    </div>
                    {trend && (
                        <div className={cn("flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full bg-white/5 border border-white/5", trend > 0 ? 'text-green-400' : 'text-red-400')}>
                            {trend > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                            {Math.abs(trend)}%
                        </div>
                    )}
                </div>
                <div>
                    <h3 className="text-4xl font-bold text-white mb-2 tracking-tight">{value}</h3>
                    <p className="text-sm text-zinc-400 font-medium">{title}</p>
                </div>
            </div>

            {/* Decorative background glow */}
            <div className={cn("absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none transition-opacity duration-500 group-hover:opacity-40", color.replace('text-', 'bg-'))} />
        </motion.div>
    );

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-zinc-900 border border-white/10 p-3 rounded-xl shadow-xl">
                    <p className="text-zinc-400 text-xs mb-1">{label}</p>
                    <p className="text-white font-bold">{payload[0].value.toLocaleString()} {payload[0].name === 'tokens' ? 'Tokens' : 'Requests'}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <StatCard
                    title="Total Users"
                    value={stats.total_users}
                    icon={Users}
                    color="text-blue-400"
                    trend={12}
                    className="md:col-span-2"
                    delay={0.1}
                />
                <StatCard
                    title="Active Users"
                    value={stats.active_users}
                    icon={TrendingUp}
                    color="text-green-400"
                    trend={5}
                    delay={0.2}
                />
                <StatCard
                    title="Blocked Users"
                    value={stats.blocked_users}
                    icon={Lock}
                    color="text-red-400"
                    trend={-2}
                    delay={0.3}
                />
                <StatCard
                    title="Conversations"
                    value={stats.total_conversations}
                    icon={MessageSquare}
                    color="text-purple-400"
                    trend={8}
                    delay={0.4}
                />
                <StatCard
                    title="Documents Processed"
                    value={stats.total_documents}
                    icon={FileText}
                    color="text-orange-400"
                    trend={15}
                    className="md:col-span-2"
                    delay={0.5}
                />
                <StatCard
                    title="Active MCP Servers"
                    value={stats.total_mcp_servers}
                    icon={Server}
                    color="text-cyan-400"
                    delay={0.6}
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                    className="bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-3xl p-8 h-96 flex flex-col justify-between group hover:border-white/10 transition-all duration-500"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-white">Token Usage (30 Days)</h3>
                        <div className="p-2 rounded-xl bg-white/5">
                            <Activity className="w-5 h-5 text-zinc-400" />
                        </div>
                    </div>
                    <div className="flex-1 w-full h-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={usageData}>
                                <defs>
                                    <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="date" hide />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} />
                                <Area type="monotone" dataKey="tokens" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorTokens)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                    className="bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-3xl p-8 h-96 flex flex-col justify-between group hover:border-white/10 transition-all duration-500"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-white">API Requests (30 Days)</h3>
                        <div className="p-2 rounded-xl bg-white/5">
                            <Server className="w-5 h-5 text-zinc-400" />
                        </div>
                    </div>
                    <div className="flex-1 w-full h-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={usageData}>
                                <defs>
                                    <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="date" hide />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }} />
                                <Area type="monotone" dataKey="requests" stroke="#34d399" strokeWidth={3} fillOpacity={1} fill="url(#colorRequests)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
