"use client";

import React, { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { LogIn, LogOut, Shield } from "lucide-react";
import { getCurrentUser } from "@/lib/api/auth";
import type { User } from "@/types/api";

export default function ImpersonationBanner() {
    const impersonatedUserId = useStore((state) => state.impersonatedUserId);
    const setImpersonatedUserId = useStore((state) => state.setImpersonatedUserId);
    const originalSuperadminId = useStore((state) => state.originalSuperadminId);
    const user = useStore((state) => state.user);
    const [impersonatedUser, setImpersonatedUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // When impersonating, fetch the impersonated user's info
        if (impersonatedUserId) {
            setLoading(true);
            getCurrentUser()
                .then((currentUser) => {
                    // The API returns the impersonated user when X-Impersonate-User header is set
                    setImpersonatedUser(currentUser);
                })
                .catch((error) => {
                    console.error("Failed to fetch impersonated user:", error);
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setImpersonatedUser(null);
        }
    }, [impersonatedUserId]);

    // Show banner whenever impersonating (regardless of current user role)
    if (!impersonatedUserId) {
        return null;
    }

    const displayUser = impersonatedUser || user;
    
    // Don't render if we don't have user info yet
    if (!displayUser) {
        return null;
    }

    return (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 flex items-center justify-between text-white shadow-lg relative z-[100] border-b border-indigo-500/20">
            <div className="flex items-center gap-3 text-sm font-medium">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white/20 rounded-lg">
                        <Shield className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-semibold">
                            Persistent Access Active
                        </span>
                        <span className="text-xs text-white/80 font-normal">
                            Viewing as <strong>{displayUser.name}</strong> ({displayUser.email})
                        </span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {originalSuperadminId && (
                    <button
                        onClick={() => {
                            // Switch back to superadmin
                            setImpersonatedUserId(originalSuperadminId);
                            // Reload to reset state
                            if (typeof window !== 'undefined') {
                                window.location.reload();
                            }
                        }}
                        className="flex items-center gap-2 px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-semibold transition-all hover:scale-105 active:scale-95"
                        title="Switch back to Superadmin view"
                    >
                        <Shield className="w-3.5 h-3.5" />
                        Back to Superadmin
                    </button>
                )}
                <button
                    onClick={() => {
                        setImpersonatedUserId(null);
                        // Reload to reset state
                        if (typeof window !== 'undefined') {
                            window.location.reload();
                        }
                    }}
                    className="flex items-center gap-2 px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-semibold transition-all hover:scale-105 active:scale-95"
                >
                    <LogOut className="w-3.5 h-3.5" />
                    Exit Persistent Access
                </button>
            </div>
        </div>
    );
}
