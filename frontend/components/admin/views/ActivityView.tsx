import React, { useEffect, useState } from 'react';
import { Activity as ActivityIcon, Clock, CheckCircle, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { getSystemActivity } from '@/lib/api/admin';
import { formatDistanceToNow } from 'date-fns';

export default function ActivityView() {
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadActivity = async () => {
            try {
                const data = await getSystemActivity(50);
                setActivities(data);
            } catch (error) {
                console.error("Failed to load activity", error);
            } finally {
                setLoading(false);
            }
        };
        loadActivity();
    }, []);

    if (loading) {
        return <div className="p-12 text-center text-zinc-500 flex flex-col items-center"><Loader2 className="w-8 h-8 animate-spin mb-2" />Loading activity log...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20">
                    <ActivityIcon className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white">System Activity</h2>
                    <p className="text-zinc-400 text-sm">Real-time log of important system events.</p>
                </div>
            </div>

            <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-3xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-32 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

                <div className="divide-y divide-white/5 relative z-10">
                    {activities.length === 0 && (
                        <div className="p-8 text-center text-zinc-500">No recent activity found.</div>
                    )}
                    {activities.map((activity, index) => (
                        <motion.div
                            key={activity.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="p-6 hover:bg-white/[0.02] transition-colors flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-5">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${activity.status === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                    {activity.status === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white flex items-center gap-2">
                                        {activity.action}
                                        {activity.status === 'success' && <Sparkles className="w-3 h-3 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                    </p>
                                    <p className="text-xs text-zinc-500 flex items-center gap-1.5 mt-0.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                                        by <span className="text-zinc-300">{activity.user}</span>
                                        <span className="text-zinc-600 px-1">•</span>
                                        <span className="text-zinc-500">{activity.details}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono bg-black/20 px-3 py-1.5 rounded-full border border-white/5">
                                <Clock className="w-3 h-3" />
                                {activity.time ? formatDistanceToNow(new Date(activity.time), { addSuffix: true }) : 'Unknown'}
                            </div>
                        </motion.div>
                    ))}
                </div>
                <div className="p-4 bg-white/[0.02] border-t border-white/5 text-center">
                    <button className="text-xs text-zinc-400 hover:text-white font-medium transition-colors uppercase tracking-wider">View All Activity</button>
                </div>
            </div>
        </div>
    );
}
