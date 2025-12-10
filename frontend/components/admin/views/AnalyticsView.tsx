import React, { useEffect, useState } from 'react';
import {
    Users,
    TrendingUp,
    Lock,
    MessageSquare,
    FileText,
    Server,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import { getSystemStats, SystemStats } from '@/lib/api/admin';

export default function AnalyticsView() {
    const [stats, setStats] = useState<SystemStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const data = await getSystemStats();
                setStats(data);
            } catch (error) {
                console.error("Failed to load stats:", error);
            } finally {
                setLoading(false);
            }
        };
        loadStats();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Loading analytics...</div>;
    }

    if (!stats) {
        return <div className="p-8 text-center text-muted-foreground">Failed to load analytics data.</div>;
    }

    const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
                    <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-xs font-medium ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <div>
                <h3 className="text-2xl font-bold text-foreground mb-1">{value}</h3>
                <p className="text-sm text-muted-foreground">{title}</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard
                    title="Total Users"
                    value={stats.total_users}
                    icon={Users}
                    color="text-blue-500"
                    trend={12}
                />
                <StatCard
                    title="Active Users"
                    value={stats.active_users}
                    icon={TrendingUp}
                    color="text-green-500"
                    trend={5}
                />
                <StatCard
                    title="Blocked Users"
                    value={stats.blocked_users}
                    icon={Lock}
                    color="text-red-500"
                    trend={-2}
                />
                <StatCard
                    title="Conversations"
                    value={stats.total_conversations}
                    icon={MessageSquare}
                    color="text-purple-500"
                    trend={8}
                />
                <StatCard
                    title="Documents Processed"
                    value={stats.total_documents}
                    icon={FileText}
                    color="text-orange-500"
                    trend={15}
                />
                <StatCard
                    title="Active MCP Servers"
                    value={stats.total_mcp_servers}
                    icon={Server}
                    color="text-cyan-500"
                />
            </div>

            {/* Placeholder for charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6">
                <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 h-80 flex items-center justify-center text-muted-foreground">
                    User Growth Chart Placeholder
                </div>
                <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6 h-80 flex items-center justify-center text-muted-foreground">
                    System Usage Chart Placeholder
                </div>
            </div>
        </div>
    );
}
