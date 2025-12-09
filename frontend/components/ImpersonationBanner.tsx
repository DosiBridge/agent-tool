"use client";

import React from "react";
import { useStore } from "@/lib/store";
import { LogIn, LogOut } from "lucide-react";

export default function ImpersonationBanner() {
    const impersonatedUserId = useStore((state) => state.impersonatedUserId);
    const setImpersonatedUserId = useStore((state) => state.setImpersonatedUserId);
    const user = useStore((state) => state.user);

    if (!impersonatedUserId || !user) {
        return null;
    }

    return (
        <div className="bg-indigo-600 px-4 py-2 flex items-center justify-between text-white shadow-md relative z-[100]">
            <div className="flex items-center gap-2 text-sm font-medium">
                <LogIn className="w-4 h-4" />
                <span>
                    Impersonating <strong>{user.name}</strong> ({user.email})
                </span>
            </div>
            <button
                onClick={() => {
                    setImpersonatedUserId(null);
                    // Optionally redirect to admin page or reload
                    if (typeof window !== 'undefined') {
                        window.location.reload();
                    }
                }}
                className="flex items-center gap-1.5 px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-semibold transition-colors"
            >
                <LogOut className="w-3.5 h-3.5" />
                Exit View
            </button>
        </div>
    );
}
