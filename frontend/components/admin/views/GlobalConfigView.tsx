import React, { useState } from 'react';
import {
    Globe,
    Server,
    Database,
    Plus,
    Trash2,
    ShieldAlert,
    Check,
    Save
} from 'lucide-react';
import { createGlobalLLMConfig, createGlobalMCPServer, deleteGlobalMCPServer } from '@/lib/api/admin';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function GlobalConfigView() {
    const [activeTab, setActiveTab] = useState<'llm' | 'mcp'>('llm');
    const [llmForm, setLlmForm] = useState({
        type: 'openai',
        model: 'gpt-4o',
        api_key: '',
        base_url: '',
        is_default: true
    });
    const [mcpForm, setMcpForm] = useState({
        name: '',
        url: '',
        api_key: ''
    });

    const handleLlmSubmit = async () => {
        try {
            await createGlobalLLMConfig(llmForm);
            toast.success("Global LLM Configuration set successfully");
            setLlmForm({ ...llmForm, api_key: '' }); // Clear sensitive data
        } catch (error: any) {
            toast.error("Failed to set global LLM config");
        }
    };

    const handleMcpSubmit = async () => {
        try {
            await createGlobalMCPServer(mcpForm);
            toast.success("Global MCP Server added");
            setMcpForm({ name: '', url: '', api_key: '' });
        } catch (error: any) {
            toast.error("Failed to add global MCP server");
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                    <Globe className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white">System Configuration</h2>
                    <p className="text-zinc-400 text-sm">Manage global settings applied to all users by default.</p>
                </div>
            </div>

            <div className="flex gap-4 border-b border-white/5 pb-4">
                <button
                    onClick={() => setActiveTab('llm')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'llm' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                >
                    Default LLM
                </button>
                <button
                    onClick={() => setActiveTab('mcp')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'mcp' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                >
                    Global MCP Servers
                </button>
            </div>

            <div className="max-w-4xl">
                {activeTab === 'llm' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-3xl p-8 space-y-6"
                    >
                        <div className="flex items-start gap-4 p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl mb-6">
                            <ShieldAlert className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-200">
                                <strong>System Default Model:</strong> This configuration will be used for users who haven't set their own keys.
                                Ensure you have sufficient quota/credits.
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-300">Provider</label>
                                <select
                                    value={llmForm.type}
                                    onChange={e => setLlmForm({ ...llmForm, type: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500/50 text-white"
                                >
                                    <option value="openai">OpenAI</option>
                                    <option value="deepseek">DeepSeek</option>
                                    <option value="anthropic">Anthropic</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-300">Model Name</label>
                                <input
                                    type="text"
                                    value={llmForm.model}
                                    onChange={e => setLlmForm({ ...llmForm, model: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500/50 text-white"
                                />
                            </div>
                            <div className="col-span-2 space-y-2">
                                <label className="text-sm font-medium text-zinc-300">API Key</label>
                                <input
                                    type="password"
                                    value={llmForm.api_key}
                                    onChange={e => setLlmForm({ ...llmForm, api_key: e.target.value })}
                                    placeholder="sk-..."
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500/50 text-white"
                                />
                            </div>
                            <div className="col-span-2 space-y-2">
                                <label className="text-sm font-medium text-zinc-300">Base URL (Optional)</label>
                                <input
                                    type="text"
                                    value={llmForm.base_url}
                                    onChange={e => setLlmForm({ ...llmForm, base_url: e.target.value })}
                                    placeholder="https://api.openai.com/v1"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500/50 text-white"
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button
                                onClick={handleLlmSubmit}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                Save Default Configuration
                            </button>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'mcp' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="bg-zinc-900/50 backdrop-blur-sm border border-white/5 rounded-3xl p-8">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <Plus className="w-5 h-5 text-green-400" />
                                Add Global Server
                            </h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-300">Server Name</label>
                                    <input
                                        type="text"
                                        value={mcpForm.name}
                                        onChange={e => setMcpForm({ ...mcpForm, name: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-green-500/50 text-white"
                                        placeholder="e.g. Weather Service"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-300">Server URL</label>
                                    <input
                                        type="text"
                                        value={mcpForm.url}
                                        onChange={e => setMcpForm({ ...mcpForm, url: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-green-500/50 text-white"
                                        placeholder="http://localhost:8000/sse"
                                    />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="text-sm font-medium text-zinc-300">API Key (Optional)</label>
                                    <input
                                        type="password"
                                        value={mcpForm.api_key}
                                        onChange={e => setMcpForm({ ...mcpForm, api_key: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-green-500/50 text-white"
                                    />
                                </div>
                            </div>
                            <div className="pt-6 flex justify-end">
                                <button
                                    onClick={handleMcpSubmit}
                                    className="px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                                >
                                    <Server className="w-4 h-4" />
                                    Deploy Global Server
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
