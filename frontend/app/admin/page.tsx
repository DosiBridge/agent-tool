"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import {
  listAllUsers,
  blockUser,
  unblockUser,
  getSystemStats,
  type AdminUser,
  type SystemStats,
} from "@/lib/api/admin";
import { Shield, Users, Lock, Unlock, Search, TrendingUp, FileText, Server, MessageSquare } from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isSuperadmin } = useStore();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

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
      const [usersData, statsData] = await Promise.all([
        listAllUsers(),
        getSystemStats(),
      ]);
      setUsers(usersData);
      setStats(statsData);
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

        {/* System Settings Placeholder */}
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg shadow-sm p-4 sm:p-6">
          <h2 className="text-xl font-semibold mb-4">System Settings</h2>
          <p className="text-muted-foreground text-sm">
            System settings management (LLM default configuration, etc.) will be available here.
          </p>
        </div>
      </div>
    </div>
  );
}
