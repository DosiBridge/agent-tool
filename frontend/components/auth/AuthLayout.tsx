"use client";

import { BackgroundBeams } from "@/components/ui/background-beams";
import { Bot, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface AuthLayoutProps {
    children: React.ReactNode;
    headerTitle: string;
    headerSubtitle: string;
}

export default function AuthLayout({ children, headerTitle, headerSubtitle }: AuthLayoutProps) {
    const pathname = usePathname();
    const showBackToHome = pathname !== "/";

    return (
        <div className="min-h-screen w-full bg-zinc-950 relative flex flex-col items-center justify-center p-4 overflow-hidden antialiased">
            <BackgroundBeams className="opacity-40" />

            <div className="relative z-10 w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8 space-y-2">
                    <Link href="/" className="inline-flex items-center gap-2 group mb-6">
                        <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">
                            <Bot className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                            DosiBridge Agent
                        </span>
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight text-white/90">
                        {headerTitle}
                    </h1>
                    <p className="text-zinc-400 text-sm">
                        {headerSubtitle}
                    </p>
                </div>

                {/* Card */}
                <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative z-10">
                        {children}
                    </div>
                </div>

                {/* Footer */}
                {showBackToHome && (
                    <div className="mt-8 text-center">
                        <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center justify-center gap-1 transition-colors">
                            <ArrowLeft className="w-3 h-3" />
                            Back to home
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
