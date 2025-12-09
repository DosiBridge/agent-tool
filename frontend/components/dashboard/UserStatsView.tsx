import React, { useEffect, useState } from 'react';
import { Loader2, Activity, Zap, Database, Cpu } from 'lucide-react';
import { getTodayUsage, getApiKeysInfo, UsageStats, ApiKeysInfo } from '@/lib/api/monitoring';
import toast from 'react-hot-toast';

export default function UserStatsView() {
    const [loading, setLoading] = useState(true);
    const [usage, setUsage] = useState<UsageStats | null>(null);
    const [keysInfo, setKeysInfo] = useState<ApiKeysInfo | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usageData, keysData] = await Promise.all([
                    getTodayUsage(),
                    getApiKeysInfo()
                ]);
                setUsage(usageData);
                setKeysInfo(keysData);
            } catch (error) {
                console.error("Failed to load stats:", error);
                toast.error("Failed to load usage statistics");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
            </div>
        );
    }

    if (!usage || !keysInfo) return null;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                            <Activity className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-white font-medium">Daily Usage</h3>
                            <p className="text-xs text-zinc-500">Reset at midnight UTC</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-zinc-400">Requests</span>
                                <span className="text-white font-medium">
                                    {usage.request_count} / {usage.limit === -1 ? '∞' : usage.limit}
                                </span>
                            </div>
                            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-indigo-500 rounded-full"
                                    style={{ width: `${usage.limit === -1 ? 0 : Math.min((usage.request_count / usage.limit) * 100, 100)}%` }}
                                />
                            </div>
                        </div>

                        <div className="pt-2 border-t border-zinc-800">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-zinc-400">Provider</span>
                                <span className="text-white font-mono bg-zinc-800 px-2 py-0.5 rounded text-xs">
                                    {usage.llm_provider || keysInfo.active_provider}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm mt-2">
                                <span className="text-zinc-400">Model</span>
                                <span className="text-white font-mono bg-zinc-800 px-2 py-0.5 rounded text-xs truncate max-w-[150px]">
                                    {usage.llm_model || keysInfo.active_model}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                            <Zap className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-white font-medium">Token Consumption</h3>
                            <p className="text-xs text-zinc-500">Today's metrics</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800">
                            <p className="text-xs text-zinc-500 mb-1">Input Tokens</p>
                            <p className="text-lg font-semibold text-white">{usage.input_tokens.toLocaleString()}</p>
                        </div>
                        <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800">
                            <p className="text-xs text-zinc-500 mb-1">Output Tokens</p>
                            <p className="text-lg font-semibold text-white">{usage.output_tokens.toLocaleString()}</p>
                        </div>
                        <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800">
                            <p className="text-xs text-zinc-500 mb-1">Total</p>
                            <p className="text-lg font-semibold text-white">{usage.total_tokens.toLocaleString()}</p>
                        </div>
                        <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-800">
                            <p className="text-xs text-zinc-500 mb-1">Embedding</p>
                            <p className="text-lg font-semibold text-white">{usage.embedding_tokens.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-amber-400" />
                    API Key Status
                </h3>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-zinc-950/50 rounded-lg border border-zinc-800">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-white font-medium">OpenAI</span>
                                {keysInfo.keys_configured.openai.set ? (
                                    <span className="text-[10px] bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded">Configured</span>
                                ) : (
                                    <span className="text-[10px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded">Missing</span>
                                )}
                            </div>
                            <p className="text-xs text-zinc-500 mt-0.5">{keysInfo.keys_configured.openai.purpose}</p>
                        </div>
                        <div className="text-right">
                            <Database className="w-4 h-4 text-zinc-600 ml-auto" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-zinc-950/50 rounded-lg border border-zinc-800">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-white font-medium">DeepSeek</span>
                                {keysInfo.keys_configured.deepseek.set ? (
                                    <span className="text-[10px] bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded">Configured</span>
                                ) : (
                                    <span className="text-[10px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded">Default</span>
                                )}
                            </div>
                            <p className="text-xs text-zinc-500 mt-0.5">{keysInfo.keys_configured.deepseek.purpose}</p>
                        </div>
                        <div className="text-right">
                            <Cpu className="w-4 h-4 text-zinc-600 ml-auto" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
