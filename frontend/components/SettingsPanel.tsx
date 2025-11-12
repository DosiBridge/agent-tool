/**
 * Settings panel component for MCP servers and LLM config
 * ChatGPT-like dark theme design
 */

'use client';

import {
    addMCPServer,
    deleteMCPServer,
    getToolsInfo,
    LLMConfig,
    MCPServerRequest,
    resetLLMConfig,
    setLLMConfig,
    toggleMCPServer,
    ToolsInfo,
    updateMCPServer,
} from '@/lib/api';
import { useStore } from '@/lib/store';
import { AlertTriangle, Cpu, Edit2, Loader2, Plus, RotateCcw, Save, Server, Trash2, Wrench, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface SettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
    const mcpServers = useStore((state) => state.mcpServers);
    const llmConfig = useStore((state) => state.llmConfig);
    const loadMCPServers = useStore((state) => state.loadMCPServers);
    const loadLLMConfig = useStore((state) => state.loadLLMConfig);

    const [toolsInfo, setToolsInfo] = useState<ToolsInfo | null>(null);
    const [activeTab, setActiveTab] = useState<'mcp' | 'llm' | 'tools'>('mcp');
    const [editingServer, setEditingServer] = useState<string | null>(null);
    const [deletingServer, setDeletingServer] = useState<string | null>(null);
    const [serverForm, setServerForm] = useState<MCPServerRequest>({ name: '', url: '', api_key: '' });
    const [llmForm, setLlmForm] = useState<LLMConfig>({
        type: 'gemini',
        model: '',
        api_key: '',
        base_url: '',
    });

    const loadToolsInfo = useCallback(async () => {
        try {
            const info = await getToolsInfo();
            setToolsInfo(info);
        } catch (error) {
            console.error('Failed to load tools info:', error);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            (async () => {
                try {
                    await loadMCPServers();
                    await loadLLMConfig();
                    await loadToolsInfo();
                } catch (error) {
                    console.error('Failed to load settings:', error);
                }
            })();
        }
    }, [isOpen, loadMCPServers, loadLLMConfig, loadToolsInfo]);

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e: globalThis.KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEscape);
            return () => window.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen, onClose]);

    useEffect(() => {
        if (llmConfig) {
            const allowedTypes = ['openai', 'groq', 'ollama', 'gemini'] as LLMConfig['type'][];
            const type = allowedTypes.includes(llmConfig.type as LLMConfig['type'])
                ? (llmConfig.type as LLMConfig['type'])
                : 'gemini';

            const t = setTimeout(() => {
                setLlmForm({
                    type,
                    model: llmConfig.model || '',
                    api_key: '',
                    base_url: llmConfig.base_url || '',
                    api_base: llmConfig.api_base || '',
                });
            }, 0);

            return () => clearTimeout(t);
        }
    }, [llmConfig]);

    const handleAddServer = async () => {
        if (!serverForm.name.trim() || !serverForm.url.trim()) {
            toast.error('Name and URL are required');
            return;
        }
        try {
            const serverToAdd: MCPServerRequest = {
                ...serverForm,
                enabled: true  // New servers are enabled by default
            };
            await addMCPServer(serverToAdd);
            toast.success('MCP server added');
            setServerForm({ name: '', url: '', api_key: '' });
            loadMCPServers();
        } catch (error) {
            toast.error(`Failed to add server: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const handleUpdateServer = async (name: string) => {
        if (!name || !name.trim()) {
            toast.error('Server name is required');
            return;
        }
        if (!serverForm.name.trim() || !serverForm.url.trim()) {
            toast.error('Name and URL are required');
            return;
        }
        try {
            const serverToUpdate: MCPServerRequest = {
                ...serverForm,
                enabled: serverForm.enabled !== false  // Ensure enabled is set
            };
            await updateMCPServer(name, serverToUpdate);
            toast.success('MCP server updated');
            setEditingServer(null);
            setServerForm({ name: '', url: '', api_key: '' });
            loadMCPServers();
        } catch (error) {
            toast.error(`Failed to update server: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const handleDeleteServer = async (name: string) => {
        if (!name || !name.trim()) {
            toast.error('Server name is required');
            setDeletingServer(null);
            return;
        }
        try {
            await deleteMCPServer(name);
            toast.success('MCP server deleted');
            setDeletingServer(null);
            loadMCPServers();
        } catch (error) {
            toast.error(`Failed to delete server: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setDeletingServer(null);
        }
    };

    const handleSaveLLMConfig = async () => {
        if (!llmForm.model.trim()) {
            toast.error('Model name is required');
            return;
        }
        if ((llmForm.type === 'openai' || llmForm.type === 'groq' || llmForm.type === 'gemini') && !llmForm.api_key?.trim()) {
            toast.error('API key is required for this LLM type');
            return;
        }
        try {
            await setLLMConfig(llmForm);
            toast.success('LLM configuration saved');
            loadLLMConfig();
        } catch (error) {
            toast.error(`Failed to save config: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const handleResetLLMConfig = async () => {
        if (!confirm('Reset LLM configuration to default Gemini settings? This will replace your current configuration.')) {
            return;
        }
        try {
            await resetLLMConfig();
            toast.success('LLM configuration reset to default Gemini');
            loadLLMConfig();
            // Update form to show default values
            setLlmForm({
                type: 'gemini',
                model: 'gemini-2.0-flash',
                api_key: '',
                base_url: '',
            });
        } catch (error) {
            toast.error(`Failed to reset config: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const startEditServer = (server: typeof mcpServers[0]) => {
        setEditingServer(server.name);
        setServerForm({
            name: server.name,
            url: server.url,
            api_key: '',
            enabled: server.enabled !== false,  // Preserve enabled status
        });
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-2 sm:p-3 md:p-4" onClick={onClose}>
                <div
                    className="bg-[#343541] rounded-xl shadow-2xl w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] flex flex-col border border-gray-700"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 sm:p-5 md:p-6 border-b border-gray-700 shrink-0">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-200">Settings</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-[#40414f] rounded-lg transition-colors touch-manipulation"
                            aria-label="Close settings"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-700 bg-[#2d2d2f] shrink-0 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('mcp')}
                            className={`flex-1 min-w-0 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 font-medium text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 sm:gap-2 touch-manipulation ${activeTab === 'mcp'
                                ? 'border-b-2 border-[#10a37f] text-[#10a37f] bg-[#343541]'
                                : 'text-gray-400 hover:text-gray-200'
                                }`}
                        >
                            <Server className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                            <span className="truncate">MCP Servers</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('llm')}
                            className={`flex-1 min-w-0 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 font-medium text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 sm:gap-2 touch-manipulation ${activeTab === 'llm'
                                ? 'border-b-2 border-[#10a37f] text-[#10a37f] bg-[#343541]'
                                : 'text-gray-400 hover:text-gray-200'
                                }`}
                        >
                            <Cpu className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                            <span className="truncate">LLM Config</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('tools')}
                            className={`flex-1 min-w-0 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 font-medium text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5 sm:gap-2 touch-manipulation ${activeTab === 'tools'
                                ? 'border-b-2 border-[#10a37f] text-[#10a37f] bg-[#343541]'
                                : 'text-gray-400 hover:text-gray-200'
                                }`}
                        >
                            <Wrench className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                            <span className="truncate">Tools</span>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
                        {activeTab === 'mcp' && (
                            <div className="space-y-4 sm:space-y-5 md:space-y-6">
                                {/* Add/Edit Server Form */}
                                <div className="bg-[#40414f] rounded-lg p-4 sm:p-5 border border-gray-700">
                                    <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-200">
                                        {editingServer ? 'Edit MCP Server' : 'Add MCP Server'}
                                    </h3>
                                    <div className="space-y-3 sm:space-y-4">
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 text-gray-300">Name</label>
                                            <input
                                                type="text"
                                                value={serverForm.name}
                                                onChange={(e) => setServerForm({ ...serverForm, name: e.target.value })}
                                                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-600 rounded-lg bg-[#343541] text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#10a37f] focus:border-[#10a37f]"
                                                placeholder="Server name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 text-gray-300">URL</label>
                                            <input
                                                type="text"
                                                value={serverForm.url}
                                                onChange={(e) => setServerForm({ ...serverForm, url: e.target.value })}
                                                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-600 rounded-lg bg-[#343541] text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#10a37f] focus:border-[#10a37f]"
                                                placeholder="http://localhost:8000/mcp"
                                            />
                                            <p className="text-xs text-gray-500 mt-1 sm:mt-1.5">URLs are automatically normalized to /mcp endpoint</p>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 text-gray-300">API Key (optional)</label>
                                            <input
                                                type="password"
                                                value={serverForm.api_key}
                                                onChange={(e) => setServerForm({ ...serverForm, api_key: e.target.value })}
                                                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-600 rounded-lg bg-[#343541] text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#10a37f] focus:border-[#10a37f]"
                                                placeholder="Optional API key"
                                            />
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                            <button
                                                onClick={() => editingServer ? handleUpdateServer(editingServer) : handleAddServer()}
                                                className="flex-1 px-4 py-2.5 bg-[#10a37f] hover:bg-[#0d8f6e] text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium text-sm sm:text-base touch-manipulation"
                                            >
                                                {editingServer ? <Save className="w-4 h-4 shrink-0" /> : <Plus className="w-4 h-4 shrink-0" />}
                                                <span>{editingServer ? 'Update Server' : 'Add Server'}</span>
                                            </button>
                                            {editingServer && (
                                                <button
                                                    onClick={() => {
                                                        setEditingServer(null);
                                                        setServerForm({ name: '', url: '', api_key: '' });
                                                    }}
                                                    className="w-full sm:w-auto px-4 py-2.5 bg-[#40414f] hover:bg-[#2d2d2f] text-gray-300 rounded-lg transition-colors font-medium text-sm sm:text-base touch-manipulation"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Configured Servers List */}
                                <div>
                                    <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-200">Configured Servers</h3>
                                    <div className="space-y-2">
                                        {mcpServers.length === 0 ? (
                                            <div className="text-center py-8 sm:py-12 px-3 sm:px-4 bg-[#40414f] rounded-lg border border-gray-700">
                                                <Server className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-gray-600" />
                                                <p className="text-xs sm:text-sm text-gray-400">No MCP servers configured</p>
                                                <p className="text-xs text-gray-500 mt-1">Add a server above to get started</p>
                                            </div>
                                        ) : (
                                            mcpServers.map((server) => (
                                                <div
                                                    key={server.name}
                                                    className="flex items-center justify-between p-3 sm:p-4 bg-[#40414f] border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
                                                >
                                                    <div className="flex-1 min-w-0 pr-2">
                                                        <div className="font-medium text-sm sm:text-base text-gray-200 mb-1 truncate">{server.name}</div>
                                                        <div className="text-xs sm:text-sm text-gray-400 truncate">{server.url}</div>
                                                        {server.has_api_key && (
                                                            <div className="text-xs text-gray-500 mt-1">🔒 API key configured</div>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-1.5 sm:gap-2 shrink-0">
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                if (!server.name || !server.name.trim()) {
                                                                    toast.error('Server name is missing');
                                                                    return;
                                                                }
                                                                startEditServer(server);
                                                            }}
                                                            className="p-1.5 sm:p-2 hover:bg-[#343541] rounded-lg transition-colors touch-manipulation"
                                                            aria-label={`Edit ${server.name}`}
                                                            type="button"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 hover:text-[#10a37f]" />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                if (!server.name || !server.name.trim()) {
                                                                    toast.error('Server name is missing');
                                                                    return;
                                                                }
                                                                setDeletingServer(server.name);
                                                            }}
                                                            className="p-1.5 sm:p-2 hover:bg-red-500/20 rounded-lg transition-colors touch-manipulation"
                                                            aria-label={`Delete ${server.name}`}
                                                            type="button"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400 hover:text-red-300" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'llm' && (
                            <div className="space-y-4 sm:space-y-5 md:space-y-6">
                                {/* LLM Configuration Form */}
                                <div className="bg-[#40414f] rounded-lg p-4 sm:p-5 border border-gray-700">
                                    <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-200">LLM Configuration</h3>
                                    <div className="space-y-3 sm:space-y-4">
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 text-gray-300">Type</label>
                                            <select
                                                value={llmForm.type}
                                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLlmForm({ ...llmForm, type: e.target.value as LLMConfig['type'] })}
                                                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-600 rounded-lg bg-[#343541] text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#10a37f] focus:border-[#10a37f]"
                                            >
                                                <option value="openai">OpenAI</option>
                                                <option value="groq">Groq</option>
                                                <option value="ollama">Ollama</option>
                                                <option value="gemini">Gemini</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 text-gray-300">Model</label>
                                            <input
                                                type="text"
                                                value={llmForm.model}
                                                onChange={(e) => setLlmForm({ ...llmForm, model: e.target.value })}
                                                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-600 rounded-lg bg-[#343541] text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#10a37f] focus:border-[#10a37f]"
                                                placeholder="gpt-4o, llama3.2, etc."
                                                required
                                            />
                                        </div>
                                        {(llmForm.type === 'openai' || llmForm.type === 'groq' || llmForm.type === 'gemini') && (
                                            <div>
                                                <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 text-gray-300">API Key</label>
                                                <input
                                                    type="password"
                                                    value={llmForm.api_key}
                                                    onChange={(e) => setLlmForm({ ...llmForm, api_key: e.target.value })}
                                                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-600 rounded-lg bg-[#343541] text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#10a37f] focus:border-[#10a37f]"
                                                    placeholder="sk-..."
                                                    required
                                                />
                                            </div>
                                        )}
                                        {llmForm.type === 'ollama' && (
                                            <div>
                                                <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 text-gray-300">Base URL</label>
                                                <input
                                                    type="text"
                                                    value={llmForm.base_url}
                                                    onChange={(e) => setLlmForm({ ...llmForm, base_url: e.target.value })}
                                                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-600 rounded-lg bg-[#343541] text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#10a37f] focus:border-[#10a37f]"
                                                    placeholder="http://localhost:11434"
                                                />
                                            </div>
                                        )}
                                        {llmForm.type === 'openai' && (
                                            <div>
                                                <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 text-gray-300">API Base (optional)</label>
                                                <input
                                                    type="text"
                                                    value={llmForm.api_base || ''}
                                                    onChange={(e) => setLlmForm({ ...llmForm, api_base: e.target.value })}
                                                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-600 rounded-lg bg-[#343541] text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#10a37f] focus:border-[#10a37f]"
                                                    placeholder="https://api.openai.com/v1"
                                                />
                                            </div>
                                        )}
                                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                            <button
                                                onClick={handleSaveLLMConfig}
                                                className="flex-1 px-4 py-2.5 bg-[#10a37f] hover:bg-[#0d8f6e] text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium text-sm sm:text-base touch-manipulation"
                                            >
                                                <Save className="w-4 h-4 shrink-0" />
                                                <span>Save Configuration</span>
                                            </button>
                                            <button
                                                onClick={handleResetLLMConfig}
                                                className="w-full sm:w-auto px-4 py-2.5 bg-[#40414f] hover:bg-[#2d2d2f] text-gray-300 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium border border-gray-600 text-sm sm:text-base touch-manipulation"
                                                title="Reset to default Gemini configuration"
                                            >
                                                <RotateCcw className="w-4 h-4 shrink-0" />
                                                <span>Reset</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Current Configuration */}
                                {llmConfig && (
                                    <div className="bg-[#40414f] rounded-lg p-4 sm:p-5 border border-gray-700">
                                        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-200">Current Configuration</h3>
                                        <div className="space-y-2 sm:space-y-3">
                                            <div className="flex items-center justify-between py-2 border-b border-gray-700">
                                                <span className="text-xs sm:text-sm text-gray-400">Type:</span>
                                                <span className="text-xs sm:text-sm font-medium text-gray-200">{llmConfig.type}</span>
                                            </div>
                                            <div className="flex items-center justify-between py-2 border-b border-gray-700">
                                                <span className="text-xs sm:text-sm text-gray-400">Model:</span>
                                                <span className="text-xs sm:text-sm font-medium text-gray-200 truncate ml-2">{llmConfig.model}</span>
                                            </div>
                                            {llmConfig.base_url && (
                                                <div className="flex items-center justify-between py-2 border-b border-gray-700">
                                                    <span className="text-xs sm:text-sm text-gray-400">Base URL:</span>
                                                    <span className="text-xs sm:text-sm font-medium text-gray-200 truncate ml-2 sm:ml-4 max-w-[60%]">{llmConfig.base_url}</span>
                                                </div>
                                            )}
                                            {llmConfig.has_api_key && (
                                                <div className="flex items-center justify-between py-2">
                                                    <span className="text-xs sm:text-sm text-gray-400">API Key:</span>
                                                    <span className="text-xs sm:text-sm font-medium text-green-400">✓ Configured</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'tools' && (
                            <div className="space-y-4 sm:space-y-5 md:space-y-6">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-200">Available Tools</h3>
                                {toolsInfo ? (
                                    <div className="space-y-4 sm:space-y-5 md:space-y-6">
                                        <div>
                                            <h4 className="font-medium mb-2 sm:mb-3 text-sm sm:text-base text-gray-300 flex items-center gap-2">
                                                <Wrench className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                                                Local Tools
                                            </h4>
                                            <div className="space-y-2">
                                                {toolsInfo.local_tools.length === 0 ? (
                                                    <div className="text-center py-6 sm:py-8 text-gray-500 text-xs sm:text-sm">No local tools available</div>
                                                ) : (
                                                    toolsInfo.local_tools.map((tool) => (
                                                        <div key={tool.name} className="p-3 sm:p-4 bg-[#40414f] border border-gray-700 rounded-lg">
                                                            <div className="font-medium text-sm sm:text-base text-gray-200 mb-1">{tool.name}</div>
                                                            <div className="text-xs sm:text-sm text-gray-400 mb-2">{tool.description}</div>
                                                            <div className="text-xs text-gray-500">Type: {tool.type}</div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-medium mb-2 sm:mb-3 text-sm sm:text-base text-gray-300 flex items-center gap-2">
                                                <Server className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                                                MCP Servers
                                            </h4>
                                            <div className="space-y-2">
                                                {mcpServers.length === 0 ? (
                                                    <div className="text-center py-6 sm:py-8 text-gray-500 text-xs sm:text-sm">No MCP servers configured</div>
                                                ) : (
                                                    mcpServers.map((server) => (
                                                        <div key={server.name} className="p-3 sm:p-4 bg-[#40414f] border border-gray-700 rounded-lg flex items-center justify-between gap-3">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-medium text-sm sm:text-base text-gray-200 mb-1 truncate">{server.name}</div>
                                                                <div className="text-xs sm:text-sm text-gray-400 mb-2 truncate">{server.url}</div>
                                                                <div className="text-xs text-gray-500">
                                                                    Status: <span className={server.enabled !== false ? 'text-green-400' : 'text-red-400'}>
                                                                        {server.enabled !== false ? 'Enabled' : 'Disabled'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={server.enabled !== false}
                                                                    onChange={async (e) => {
                                                                        e.preventDefault();
                                                                        if (!server.name || !server.name.trim()) {
                                                                            toast.error('Server name is missing');
                                                                            return;
                                                                        }
                                                                        try {
                                                                            const result = await toggleMCPServer(server.name);
                                                                            // Backend returns {status, server, message}, TypeScript expects {server, message}
                                                                            const serverData = result.server;
                                                                            const newStatus = serverData?.enabled ? 'enabled' : 'disabled';
                                                                            toast.success(`MCP server ${newStatus}`);
                                                                            loadMCPServers();
                                                                        } catch (error) {
                                                                            toast.error(`Failed to toggle server: ${error instanceof Error ? error.message : 'Unknown error'}`);
                                                                        }
                                                                    }}
                                                                    className="sr-only peer"
                                                                />
                                                                <div className="w-10 h-5 sm:w-11 sm:h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#10a37f] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 sm:after:h-5 sm:after:w-5 after:transition-all peer-checked:bg-[#10a37f] touch-manipulation"></div>
                                                            </label>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 sm:py-12 text-gray-500">
                                        <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin mx-auto mb-2 text-[#10a37f]" />
                                        <p className="text-xs sm:text-sm">Loading tools information...</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Server Confirmation Modal */}
            {deletingServer && (
                <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-3 sm:p-4">
                    <div className="bg-[#343541] rounded-xl shadow-2xl max-w-md w-full border border-gray-700">
                        <div className="p-4 sm:p-5 md:p-6">
                            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                                </div>
                                <h3 className="text-base sm:text-lg font-semibold text-gray-200">Delete MCP Server</h3>
                            </div>
                            <p className="text-sm sm:text-base text-gray-300 mb-4 sm:mb-6">
                                Are you sure you want to delete <span className="font-medium text-white">{deletingServer}</span>? This action cannot be undone.
                            </p>
                            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end">
                                <button
                                    onClick={() => setDeletingServer(null)}
                                    className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-[#40414f] rounded-lg transition-colors touch-manipulation"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDeleteServer(deletingServer)}
                                    className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-sm font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors touch-manipulation"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
