import React, { useEffect, useState } from 'react';
import {
    Brain,
    Edit2,
    Power,
    Trash2,
    Plus,
    Check,
    X,
    Lock,
    Unlock,
    Settings as SettingsIcon,
    Sparkles
} from 'lucide-react';
import {
    listLLMConfigs,
    deleteLLMConfig,
    switchLLMConfig,
    updateLLMConfig,
    setLLMConfig,
    type LLMConfigListItem
} from '@/lib/api/llm';
import type { LLMConfig } from '@/types/api';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConfigureView() {
    const [llmConfigs, setLlmConfigs] = useState<LLMConfigListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [editingConfig, setEditingConfig] = useState<LLMConfigListItem | null>(null);
    const [showApiKey, setShowApiKey] = useState(false);

    const [formState, setFormState] = useState({
        type: 'openai',
        model: 'gpt-4o',
        api_key: '',
        api_base: '',
    });

    const loadConfigs = async () => {
        try {
            const data = await listLLMConfigs();
            setLlmConfigs(data.configs || []);
        } catch (error) {
            console.error("Failed to load configs:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadConfigs();
    }, []);

    const resetForm = () => {
        setFormState({
            type: 'openai',
            model: 'gpt-4o',
            api_key: '',
            api_base: '',
        });
        setIsCreating(false);
        setEditingConfig(null);
        setShowApiKey(false);
    };

    const handleCreate = async () => {
        try {
            const configToCreate: LLMConfig = {
                type: formState.type as LLMConfig['type'],
                model: formState.model,
            };
            if (formState.api_key) {
                configToCreate.api_key = formState.api_key;
            }
            if (formState.api_base) {
                configToCreate.api_base = formState.api_base;
            }
            await setLLMConfig(configToCreate);
            toast.success("LLM configuration created");
            resetForm();
            loadConfigs();
        } catch (error: any) {
            toast.error(error.message || "Failed to create configuration");
        }
    };

    const handleUpdate = async () => {
        if (!editingConfig) return;
        try {
            const configToUpdate: LLMConfig = {
                type: formState.type as LLMConfig['type'],
                model: formState.model,
            };
            if (formState.api_key) {
                configToUpdate.api_key = formState.api_key;
            }
            if (formState.api_base) {
                configToUpdate.api_base = formState.api_base;
            }
            await updateLLMConfig(editingConfig.id, configToUpdate);
            toast.success("LLM configuration updated");
            resetForm();
            loadConfigs();
            useStore.getState().loadLLMConfig();
        } catch (error: any) {
            toast.error(error.message || "Failed to update configuration");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this configuration?")) return;
        try {
            await deleteLLMConfig(id);
            toast.success("Configuration deleted");
            loadConfigs();
        } catch (error: any) {
            toast.error("Failed to delete configuration");
        }
    };

    const handleSwitch = async (id: number) => {
        try {
            await switchLLMConfig(id);
            toast.success("Switched active configuration");
            loadConfigs();
            useStore.getState().loadLLMConfig();
        } catch (error: any) {
            toast.error("Failed to switch configuration");
        }
    };

    const startEdit = (config: LLMConfigListItem) => {
        setEditingConfig(config);
        setFormState({
            type: config.type,
            model: config.model,
            api_key: '',
            api_base: config.api_base || '',
        });
        setIsCreating(false);
    };

    if (loading) return <div className="p-10 text-center text-zinc-500">Loading configurations...</div>;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                            <Brain className="w-6 h-6 text-indigo-400" />
                        </div>
                        LLM Configuration
                    </h2>
                    <p className="text-zinc-400 mt-1 ml-1">Manage your AI model providers and settings</p>
                </div>
                {!isCreating && !editingConfig && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-full flex items-center gap-2 font-medium transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
                    >
                        <Plus className="w-4 h-4" />
                        Add New Model
                    </button>
                )}
            </div>

            <AnimatePresence>
                {(isCreating || editingConfig) && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-zinc-900/50 backdrop-blur-sm border border-indigo-500/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />

                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                {isCreating ? <Sparkles className="w-5 h-5 text-indigo-400" /> : <Edit2 className="w-5 h-5 text-indigo-400" />}
                                {isCreating ? 'Add New Configuration' : 'Edit Configuration'}
                            </h3>
                            <button onClick={resetForm} className="text-zinc-500 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-300">Provider</label>
                                <div className="relative">
                                    <select
                                        value={formState.type}
                                        onChange={e => setFormState({ ...formState, type: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-indigo-500/50 text-white appearance-none transition-colors"
                                        disabled={editingConfig?.is_default}
                                    >
                                        <option value="openai">OpenAI</option>
                                        <option value="deepseek">DeepSeek</option>
                                        <option value="anthropic">Anthropic</option>
                                        <option value="google">Google</option>
                                        <option value="custom">Custom</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                                        <SettingsIcon className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-300">Model Name</label>
                                <input
                                    type="text"
                                    value={formState.model}
                                    onChange={e => setFormState({ ...formState, model: e.target.value })}
                                    placeholder="e.g. gpt-4o"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-indigo-500/50 text-white transition-colors placeholder-zinc-600"
                                />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-sm font-medium text-zinc-300">API Key</label>
                                <div className="relative">
                                    <input
                                        type={showApiKey ? "text" : "password"}
                                        value={formState.api_key}
                                        onChange={e => setFormState({ ...formState, api_key: e.target.value })}
                                        placeholder={editingConfig ? "Leave empty to keep current key" : "Enter API Key"}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-indigo-500/50 text-white pr-12 transition-colors placeholder-zinc-600"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowApiKey(!showApiKey)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                                    >
                                        {showApiKey ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-sm font-medium text-zinc-300">API Base URL (Optional)</label>
                                <input
                                    type="text"
                                    value={formState.api_base}
                                    onChange={e => setFormState({ ...formState, api_base: e.target.value })}
                                    placeholder="https://api.openai.com/v1"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-indigo-500/50 text-white transition-colors placeholder-zinc-600"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-white/5 relative z-10">
                            <button
                                onClick={resetForm}
                                className="px-6 py-2.5 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={isCreating ? handleCreate : handleUpdate}
                                className="px-6 py-2.5 text-sm font-medium bg-white text-black rounded-xl hover:bg-zinc-200 transition-colors shadow-lg shadow-white/10"
                            >
                                {isCreating ? 'Create Configuration' : 'Save Changes'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {llmConfigs.map((config, index) => (
                    <motion.div
                        key={config.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={cn(
                            "group relative bg-zinc-900/50 backdrop-blur-sm border rounded-3xl p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden",
                            config.active ? 'border-green-500/30' : 'border-white/5 hover:border-white/10'
                        )}
                    >
                        {config.active && (
                            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent pointer-events-none" />
                        )}

                        <div className="flex items-start justify-between mb-6 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className={cn("p-3 rounded-2xl", config.active ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-zinc-400')}>
                                    <Brain className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white capitalize">{config.type}</h3>
                                    <p className="text-sm text-zinc-500">{config.model}</p>
                                </div>
                            </div>
                            {config.active && (
                                <span className="px-3 py-1 bg-green-500/10 text-green-400 text-xs font-semibold rounded-full border border-green-500/20 shadow-lg shadow-green-500/10">
                                    Active
                                </span>
                            )}
                        </div>

                        <div className="space-y-3 mb-8 relative z-10">
                            <div className="flex items-center justify-between text-xs font-medium">
                                <span className="text-zinc-500">API Key</span>
                                <span className={config.has_api_key ? "text-green-400" : "text-red-400"}>
                                    {config.has_api_key ? "●●●●●●●" : "Not Set"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs font-medium">
                                <span className="text-zinc-500">Base URL</span>
                                <span className="font-mono text-zinc-300 bg-white/5 px-2 py-0.5 rounded text-[10px]">{config.api_base || 'Default'}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-5 border-t border-white/5 relative z-10">
                            {!config.active && (
                                <button
                                    onClick={() => handleSwitch(config.id)}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium text-green-400 hover:bg-green-500/10 rounded-xl transition-colors border border-transparent hover:border-green-500/20"
                                >
                                    <Power className="w-4 h-4" />
                                    Activate
                                </button>
                            )}
                            <button
                                onClick={() => startEdit(config)}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-xl transition-colors border border-transparent",
                                    config.active ? "text-zinc-300 hover:text-white hover:bg-white/5" : "text-zinc-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <SettingsIcon className="w-4 h-4" />
                                Edit
                            </button>
                            {!config.active && !config.is_default && (
                                <button
                                    onClick={() => handleDelete(config.id)}
                                    className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
