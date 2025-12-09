"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import {
  listUsers,
  blockUser,
  unblockUser,
  getSystemStats,
  type AdminUser,
  type SystemStats,
} from "@/lib/api/admin";
import { Shield, Users, Lock, Unlock, Search, TrendingUp, FileText, Server, MessageSquare, Brain, Edit2, Power, Trash2, Check, X } from "lucide-react";
import {
  listLLMConfigs,
  deleteLLMConfig,
  switchLLMConfig,
  updateLLMConfig,
  type LLMConfigListItem,
} from "@/lib/api/llm";
import toast from "react-hot-toast";

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isSuperadmin } = useStore();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [llmConfigs, setLlmConfigs] = useState<LLMConfigListItem[]>([]);
  const [editingLLMConfig, setEditingLLMConfig] = useState<LLMConfigListItem | null>(null);
  const [llmEditForm, setLlmEditForm] = useState<{
    type: string;
    model: string;
    api_key: string;
    api_base: string;
  }>({
    type: "openai",
    model: "gpt-4o",
    api_key: "",
    api_base: "",
  });
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    // Check if user is authenticated and is superadmin
    if (!isAuthenticated || !isSuperadmin()) {
      router.push("/");
      return;
    }

    loadData();
  }, [isAuthenticated, isSuperadmin, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, statsData, configs] = await Promise.all([
        listUsers(),
        getSystemStats(),
        listLLMConfigs().catch(() => ({ configs: [] })),
      ]);
      setUsers(usersData);
      setStats(statsData);
      setLlmConfigs(configs.configs || []);
    } catch (error: any) {
      console.error("Failed to load admin data:", error);
      if (error.status === 403) {
        router.push("/");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId: number) => {
    try {
      setActionLoading(userId);
      await blockUser(userId);
      await loadData();
    } catch (error) {
      console.error("Failed to block user:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnblockUser = async (userId: number) => {
    try {
      setActionLoading(userId);
      await unblockUser(userId);
      await loadData();
    } catch (error) {
      console.error("Failed to unblock user:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteConfig = async (configId: number) => {
    if (!confirm("Are you sure you want to delete this LLM configuration?")) {
      return;
    }
    try {
      await deleteLLMConfig(configId);
      toast.success("LLM configuration deleted successfully");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete LLM configuration");
    }
  };

  const handleSwitchConfig = async (configId: number) => {
    try {
      await switchLLMConfig(configId);
      toast.success("Switched LLM configuration successfully");
      loadData();
      // Reload LLM config in store
      useStore.getState().loadLLMConfig();
    } catch (error: any) {
      toast.error(error.message || "Failed to switch LLM configuration");
    }
  };

  const handleEditConfig = (config: LLMConfigListItem) => {
    setEditingLLMConfig(config);
    setLlmEditForm({
      type: config.type,
      model: config.model,
      api_key: "", // Security: Don't populate API key back
      api_base: config.api_base || "",
    });
    setShowApiKey(false);
  };

  const handleUpdateLLMConfig = async () => {
    if (!editingLLMConfig) return;
    try {
      await updateLLMConfig(editingLLMConfig.id, llmEditForm as any);
      toast.success("LLM configuration updated successfully");
      setEditingLLMConfig(null);
      loadData();
      // Reload LLM config in store
      useStore.getState().loadLLMConfig();
    } catch (error: any) {
      toast.error(error.message || "Failed to update LLM configuration");
    }
  };

  const cancelEditConfig = () => {
    setEditingLLMConfig(null);
    setLlmEditForm({
      type: "openai",
      model: "gpt-4o",
      api_key: "",
      api_base: "",
    });
    setShowApiKey(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Superadmin Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">Manage users and system settings</p>
          </div>
        </div>

        {/* System Statistics */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Users</p>
                  <p className="text-2xl font-bold">{stats.total_users}</p>
                </div>
                <Users className="h-8 w-8 text-primary/50" />
              </div>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Active Users</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active_users}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600/50" />
              </div>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Blocked Users</p>
                  <p className="text-2xl font-bold text-red-600">{stats.blocked_users}</p>
                </div>
                <Lock className="h-8 w-8 text-red-600/50" />
              </div>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Conversations</p>
                  <p className="text-2xl font-bold">{stats.total_conversations}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-primary/50" />
              </div>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Documents</p>
                  <p className="text-2xl font-bold">{stats.total_documents}</p>
                </div>
                <FileText className="h-8 w-8 text-primary/50" />
              </div>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">MCP Servers</p>
                  <p className="text-2xl font-bold">{stats.total_mcp_servers}</p>
                </div>
                <Server className="h-8 w-8 text-primary/50" />
              </div>
            </div>
          </div>
        )}

        {/* User Management */}
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg shadow-sm">
          <div className="p-4 sm:p-6 border-b border-border/50">
            <h2 className="text-xl font-semibold mb-4">User Management</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search users by email or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background/50 border border-border/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Role</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-sm">{user.id}</td>
                      <td className="px-4 py-3 text-sm font-medium">{user.email}</td>
                      <td className="px-4 py-3 text-sm">{user.name}</td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === "superadmin"
                              ? "bg-purple-500/20 text-purple-600 dark:text-purple-400"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {user.role || "user"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            user.is_active
                              ? "bg-green-500/20 text-green-600 dark:text-green-400"
                              : "bg-red-500/20 text-red-600 dark:text-red-400"
                          }`}
                        >
                          {user.is_active ? "Active" : "Blocked"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          {user.role === "superadmin" ? (
                            <span className="text-xs text-muted-foreground">Protected</span>
                          ) : user.is_active ? (
                            <button
                              onClick={() => handleBlockUser(user.id)}
                              disabled={actionLoading === user.id}
                              className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              <Lock className="h-3 w-3" />
                              {actionLoading === user.id ? "Blocking..." : "Block"}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUnblockUser(user.id)}
                              disabled={actionLoading === user.id}
                              className="px-3 py-1 bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              <Unlock className="h-3 w-3" />
                              {actionLoading === user.id ? "Unblocking..." : "Unblock"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* LLM Configurations Management */}
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg shadow-sm p-4 sm:p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            LLM Configurations
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Manage system LLM configurations - switch, update, or delete saved configurations
          </p>
          {llmConfigs.length > 0 ? (
            <div className="space-y-3">
              {llmConfigs.map((config) => (
                <div
                  key={config.id}
                  className={`p-4 rounded-lg border ${
                    config.active
                      ? "bg-green-500/10 border-green-500"
                      : "bg-background/50 border-border/50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold text-foreground capitalize">
                          {config.type}
                        </span>
                        {config.active && (
                          <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full flex items-center gap-1">
                            <Power className="w-3 h-3" />
                            Active
                          </span>
                        )}
                        {config.is_default && (
                          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-500 text-xs rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-foreground mb-1">
                        Model: <span className="font-medium">{config.model}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          API Key:{" "}
                          {config.has_api_key ? (
                            <span className="text-green-500">✓ Set</span>
                          ) : (
                            <span className="text-red-500">✗ Not set</span>
                          )}
                        </span>
                        {config.base_url && (
                          <span>Base URL: {config.base_url}</span>
                        )}
                        {config.api_base && (
                          <span>API Base: {config.api_base}</span>
                        )}
                        {config.created_at && (
                          <span>
                            Created:{" "}
                            {new Date(config.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {!config.is_default && (
                        <button
                          onClick={() => handleEditConfig(config)}
                          className="p-2 bg-background/50 hover:bg-background border border-border/50 rounded-lg transition-colors"
                          title="Edit this LLM configuration"
                        >
                          <Edit2 className="w-4 h-4 text-primary" />
                        </button>
                      )}
                      {!config.active && (
                        <button
                          onClick={() => handleSwitchConfig(config.id)}
                          className="p-2 bg-background/50 hover:bg-background border border-border/50 rounded-lg transition-colors"
                          title="Switch to this LLM"
                        >
                          <Power className="w-4 h-4 text-green-500" />
                        </button>
                      )}
                      {!config.active && !config.is_default && (
                        <button
                          onClick={() => handleDeleteConfig(config.id)}
                          className="p-2 bg-background/50 hover:bg-red-500/10 border border-border/50 rounded-lg transition-colors"
                          title="Delete this LLM configuration"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No LLM configurations found. Add one in Settings.</p>
            </div>
          )}
        </div>

        {/* System Settings Placeholder */}
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg shadow-sm p-4 sm:p-6">
          <h2 className="text-xl font-semibold mb-4">System Settings</h2>
          <p className="text-muted-foreground text-sm">
            Additional system settings management will be available here.
          </p>
        </div>

        {/* Edit LLM Config Modal */}
        {editingLLMConfig && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-card border border-border rounded-xl w-full max-w-lg p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-primary" />
                  Edit LLM Configuration
                </h2>
                <button
                  onClick={cancelEditConfig}
                  className="p-2 hover:bg-background rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Provider Type
                  </label>
                  <select
                    value={llmEditForm.type}
                    onChange={(e) =>
                      setLlmEditForm({ ...llmEditForm, type: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    disabled={editingLLMConfig.is_default}
                  >
                    <option value="openai">OpenAI</option>
                    <option value="deepseek">DeepSeek</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="google">Google</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Model
                  </label>
                  <input
                    type="text"
                    value={llmEditForm.model}
                    onChange={(e) =>
                      setLlmEditForm({ ...llmEditForm, model: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="gpt-4o"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={llmEditForm.api_key}
                      onChange={(e) =>
                        setLlmEditForm({
                          ...llmEditForm,
                          api_key: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 pr-10"
                      placeholder="Enter new API key (leave empty to keep current)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                    >
                      {showApiKey ? (
                        <Lock className="w-4 h-4" />
                      ) : (
                        <Unlock className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave empty to keep the current API key
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    API Base URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={llmEditForm.api_base}
                    onChange={(e) =>
                      setLlmEditForm({
                        ...llmEditForm,
                        api_base: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="https://api.openai.com/v1"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={cancelEditConfig}
                  className="flex-1 bg-background hover:bg-muted border border-border text-foreground font-medium py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateLLMConfig}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Update Configuration
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
