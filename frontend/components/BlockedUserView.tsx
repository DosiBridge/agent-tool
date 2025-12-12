"use client";

import React, { useState } from 'react';
import { AlertTriangle, Send, LogOut, Mail, CheckCircle, X, Loader2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useAuth0 } from '@auth0/auth0-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function BlockedUserView() {
    const user = useStore(state => state.user);
    const handleLogout = useStore(state => state.handleLogout);
    const { logout: auth0Logout } = useAuth0();
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSendAppeal = async () => {
        // Appeals feature removed - users should contact support directly
        toast.error("Please contact support directly for account issues");
    };

    const handleLogoutClick = async () => {
        try {
            await handleLogout();
            auth0Logout({
                logoutParams: {
                    returnTo: window.location.origin
                }
            });
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-950 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-zinc-900/50 backdrop-blur-sm border border-red-500/20 rounded-3xl p-8 shadow-2xl">
                <div className="flex items-start gap-4 mb-6">
                    <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20 flex-shrink-0">
                        <AlertTriangle className="w-8 h-8 text-red-400" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-white mb-2">Account Blocked</h1>
                        <p className="text-zinc-400">
                            Your account has been blocked. You cannot use any features including chat, RAG, MCP, or LLM configurations.
                        </p>
                    </div>
                </div>

                <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 mb-6">
                    <p className="text-sm text-zinc-300">
                        <strong className="text-red-400">What you can do:</strong>
                    </p>
                    <ul className="list-disc list-inside text-sm text-zinc-400 mt-2 space-y-1">
                        <li>Contact support for account unblocking</li>
                        <li>Logout from your account</li>
                    </ul>
                </div>

                {!sent ? (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300 mb-2">
                                Contact Support
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Please explain why you believe your account should be unblocked..."
                                rows={6}
                                className="w-full bg-zinc-950/50 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 resize-none"
                            />
                            <p className="text-xs text-zinc-500 mt-1">
                                Please contact support directly for account issues.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleSendAppeal}
                                disabled={sending || !message.trim()}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                                    sent && "bg-green-500/10 border-green-500/20"
                                )}
                            >
                                {sending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : sent ? (
                                    <>
                                        <CheckCircle className="w-4 h-4" />
                                        Message Sent
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        Send Message
                                    </>
                                )}
                            </button>

                            <button
                                onClick={handleLogoutClick}
                                className="flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 rounded-lg text-white font-medium transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-center">
                        <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-white mb-2">Message Sent Successfully</h3>
                        <p className="text-zinc-400 mb-4">
                            Please contact support directly for account issues.
                        </p>
                        <div className="flex items-center justify-center gap-3">
                            <button
                                onClick={() => setSent(false)}
                                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-white text-sm transition-colors"
                            >
                                Send Another Message
                            </button>
                            <button
                                onClick={handleLogoutClick}
                                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-white text-sm transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>
                    </div>
                )}

                {user && (
                    <div className="mt-6 pt-6 border-t border-zinc-800">
                        <div className="flex items-center gap-3 text-sm text-zinc-500">
                            <Mail className="w-4 h-4" />
                            <span>Account: {user.email}</span>
                            {user.role && (
                                <>
                                    <span className="text-zinc-600">•</span>
                                    <span>Role: {user.role}</span>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

