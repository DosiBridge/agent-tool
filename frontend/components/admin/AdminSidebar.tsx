import React from 'react';
import {
    LayoutDashboard,
    Activity,
    Users,
    Settings,
    Sliders,
    LogOut,
    Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export type AdminView = 'analytics' | 'activity' | 'users' | 'configure' | 'settings' | 'global';

interface AdminSidebarProps {
    currentView: AdminView;
    onChangeView: (view: AdminView) => void;
}

const MENU_ITEMS: { id: AdminView; label: string; icon: React.ElementType }[] = [
    { id: 'analytics', label: 'Analytics', icon: LayoutDashboard },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'global', label: 'Global', icon: Globe },
    { id: 'configure', label: 'Configure', icon: Sliders },
    { id: 'settings', label: 'Settings', icon: Settings },
];

export default function AdminSidebar({ currentView, onChangeView }: AdminSidebarProps) {
    return (
        <aside className="w-64 bg-zinc-900/50 backdrop-blur-xl border-r border-white/10 flex flex-col h-screen sticky top-0 bg-grid-white/[0.02] relative z-20">
            <div className="absolute inset-0 bg-zinc-900/80 pointer-events-none" />

            <div className="p-6 relative z-10">
                <div className="flex items-center gap-3 px-2 mb-10">
                    <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <LayoutDashboard className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <span className="font-bold text-lg text-white block">
                            SuperAdmin
                        </span>
                        <span className="text-xs text-zinc-500 font-medium">Dashboard</span>
                    </div>
                </div>

                <nav className="space-y-2">
                    {MENU_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentView === item.id;

                        return (
                            <button
                                key={item.id}
                                onClick={() => onChangeView(item.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 relative group overflow-hidden",
                                    isActive
                                        ? "text-white"
                                        : "text-zinc-400 hover:text-white"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-white/10 rounded-xl border border-white/10"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}

                                <span className="relative z-10 flex items-center gap-3">
                                    <Icon className={cn("w-5 h-5 transition-colors", isActive ? "text-indigo-400" : "text-zinc-500 group-hover:text-indigo-400")} />
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            <div className="mt-auto p-6 border-t border-white/5 relative z-10">
                <a
                    href="/"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-red-500/10 transition-colors group"
                >
                    <LogOut className="w-5 h-5 group-hover:text-red-400 transition-colors" />
                    Exit Dashboard
                </a>
            </div>
        </aside>
    );
}
