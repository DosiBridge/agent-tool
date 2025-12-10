"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import {
  IconSettings,
  IconBell,
  IconDatabase,
  IconUser,
  IconShield,
  IconInfoCircle,
} from "@tabler/icons-react";
import { useStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProfileSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: string;
}

type TabId = "general" | "notification" | "data" | "account" | "security" | "help" | "about";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "general", label: "General", icon: IconSettings },
  { id: "notification", label: "Notification", icon: IconBell },
  { id: "data", label: "Data Control", icon: IconDatabase },
  { id: "account", label: "Account", icon: IconUser },
  { id: "security", label: "Security", icon: IconShield },
  { id: "help", label: "Help & Support", icon: IconInfoCircle },
  { id: "about", label: "About", icon: IconInfoCircle },
];

export default function ProfileSettingsDialog({
  isOpen,
  onClose,
  initialTab = "general",
}: ProfileSettingsDialogProps) {
  const [activeTab, setActiveTab] = useState<TabId>(initialTab as TabId);
  const [mounted, setMounted] = useState(false);
  const user = useStore((state) => state.user);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab as TabId);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    const handleTabChange = (event: CustomEvent) => {
      if (event.detail && TABS.find(t => t.id === event.detail)) {
        setActiveTab(event.detail as TabId);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener('profileSettingsTab', handleTabChange as EventListener);
      return () => {
        window.removeEventListener('profileSettingsTab', handleTabChange as EventListener);
      };
    }
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">General Settings</h3>
              <p className="text-sm text-neutral-400 mb-6">Manage your application preferences and display options.</p>
              
              <div className="space-y-6">
                <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-white mb-3">Display Preferences</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">Compact Mode</p>
                        <p className="text-xs text-neutral-400">Use a more compact interface layout</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">Show Timestamps</p>
                        <p className="text-xs text-neutral-400">Display message timestamps in chat</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-white mb-3">Chat Preferences</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Default Chat Mode
                      </label>
                      <select className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option>Agent Mode</option>
                        <option>RAG Mode</option>
                      </select>
                      <p className="text-xs text-neutral-400 mt-1">Choose your default mode when starting a new chat</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">Auto-save Sessions</p>
                        <p className="text-xs text-neutral-400">Automatically save chat sessions</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case "notification":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Notification Settings</h3>
              <p className="text-sm text-neutral-400 mb-6">Configure how and when you receive notifications.</p>
              
              <div className="space-y-6">
                <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-white mb-4">Notification Types</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">System Notifications</p>
                        <p className="text-xs text-neutral-400">Receive system alerts and updates</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">Error Notifications</p>
                        <p className="text-xs text-neutral-400">Get notified about errors and issues</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">Success Messages</p>
                        <p className="text-xs text-neutral-400">Show success notifications</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case "data":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Data Control</h3>
              <p className="text-sm text-neutral-400 mb-6">Manage your data, privacy, and account information.</p>
              
              <div className="space-y-6">
                <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-white mb-3">Data Management</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-neutral-300 mb-2">
                        Export all your data including conversations, documents, and settings.
                      </p>
                      <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/30 rounded-lg text-sm text-white transition-colors">
                        Export All Data
                      </button>
                    </div>
                    <div className="border-t border-neutral-700 pt-3">
                      <p className="text-sm text-neutral-300 mb-2">
                        Clear all your chat sessions and conversation history.
                      </p>
                      <button className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-sm text-white transition-colors">
                        Clear Chat History
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-red-400 mb-3">Danger Zone</h4>
                  <div className="space-y-3">
                    <p className="text-sm text-neutral-300 mb-2">
                      Permanently delete all your data. This action cannot be undone.
                    </p>
                    <button className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-sm text-red-400 transition-colors">
                      Delete All Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case "account":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Account Information</h3>
              <p className="text-sm text-neutral-400 mb-6">View and manage your account details.</p>
              
              <div className="space-y-6">
                <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-white mb-4">Profile Details</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        defaultValue={user?.name || ""}
                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-neutral-500"
                        placeholder="Enter your name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        defaultValue={user?.email || ""}
                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-neutral-500"
                        placeholder="your.email@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-2">
                        Account Role
                      </label>
                      <input
                        type="text"
                        value={user?.role === "superadmin" ? "Super Admin" : user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || "User"}
                        disabled
                        className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-400 cursor-not-allowed"
                      />
                    </div>
                    <div className="pt-2">
                      <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium text-white transition-colors">
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case "security":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Security Settings</h3>
              <p className="text-sm text-neutral-400 mb-6">Manage your account security and authentication.</p>
              
              <div className="space-y-6">
                <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-white mb-4">Password & Authentication</h4>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-neutral-300 mb-3">
                        Change your account password to keep your account secure.
                      </p>
                      <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/30 rounded-lg text-sm font-medium text-white transition-colors">
                        Change Password
                      </button>
                    </div>
                    <div className="border-t border-neutral-700 pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-white">Two-Factor Authentication</p>
                          <p className="text-xs text-neutral-400">Add an extra layer of security to your account</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-white mb-4">Active Sessions</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-neutral-900/50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-white">Current Session</p>
                        <p className="text-xs text-neutral-400">This device • Active now</p>
                      </div>
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case "help":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Help & Support</h3>
              <p className="text-sm text-neutral-400 mb-6">Get help and learn how to use DosiBridge Agent.</p>
              
              <div className="space-y-4">
                <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-white mb-3">Documentation</h4>
                  <div className="space-y-2">
                    <a
                      href="/docs"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-4 py-3 bg-neutral-900/50 hover:bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-white transition-colors"
                    >
                      <div className="font-medium">View Documentation</div>
                      <div className="text-xs text-neutral-400 mt-1">Complete guide and API reference</div>
                    </a>
                    <a
                      href="https://github.com/dosibridge/agent-tool"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-4 py-3 bg-neutral-900/50 hover:bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-white transition-colors"
                    >
                      <div className="font-medium">GitHub Repository</div>
                      <div className="text-xs text-neutral-400 mt-1">Source code and issues</div>
                    </a>
                  </div>
                </div>
                
                <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-white mb-3">Quick Links</h4>
                  <div className="space-y-2">
                    <div className="px-4 py-3 bg-neutral-900/50 border border-neutral-700 rounded-lg">
                      <div className="text-sm font-medium text-white mb-1">Getting Started</div>
                      <div className="text-xs text-neutral-400">Learn how to use Agent and RAG modes</div>
                    </div>
                    <div className="px-4 py-3 bg-neutral-900/50 border border-neutral-700 rounded-lg">
                      <div className="text-sm font-medium text-white mb-1">MCP Servers</div>
                      <div className="text-xs text-neutral-400">Configure and connect MCP tools</div>
                    </div>
                    <div className="px-4 py-3 bg-neutral-900/50 border border-neutral-700 rounded-lg">
                      <div className="text-sm font-medium text-white mb-1">Document Management</div>
                      <div className="text-xs text-neutral-400">Upload and manage documents for RAG</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case "about":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">About</h3>
              <p className="text-sm text-neutral-400 mb-6">Information about DosiBridge Agent and your account.</p>
              
              <div className="space-y-6">
                <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-white mb-4">Application</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-white mb-1">DosiBridge Agent</p>
                      <p className="text-xs text-neutral-400">Version 1.0.0</p>
                    </div>
                    <div className="border-t border-neutral-700 pt-3">
                      <p className="text-sm font-medium text-white mb-1">User ID</p>
                      <p className="text-xs text-neutral-400 font-mono">
                        {user?.id || "N/A"}
                      </p>
                    </div>
                    <div className="border-t border-neutral-700 pt-3">
                      <p className="text-sm font-medium text-white mb-1">Account Role</p>
                      <p className="text-xs text-neutral-400 capitalize">
                        {user?.role === "superadmin" ? "Super Admin" : user?.role || "User"}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-neutral-800/50 border border-neutral-700 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-white mb-4">Resources</h4>
                  <div className="space-y-2">
                    <a
                      href="/docs"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Documentation →
                    </a>
                    <a
                      href="https://github.com/dosibridge/agent-tool"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      GitHub Repository →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Don't render if not mounted, window is undefined, or dialog is closed
  if (!mounted || typeof window === "undefined" || !isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl w-full max-w-4xl min-h-[500px] max-h-[85vh] flex flex-col overflow-hidden relative pointer-events-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-neutral-800">
                <h2 className="text-2xl font-bold text-white">Profile Settings</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-400" />
                </button>
              </div>

              {/* Content */}
              <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Tabs */}
                <div className="w-64 border-r border-neutral-800 p-4 overflow-y-auto">
                  <nav className="space-y-1">
                    {TABS.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors",
                            activeTab === tab.id
                              ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                              : "text-neutral-400 hover:bg-neutral-800 hover:text-white"
                          )}
                        >
                          <Icon className="w-5 h-5" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="flex-1 p-6 overflow-y-auto min-h-0">
                  {renderTabContent()}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

