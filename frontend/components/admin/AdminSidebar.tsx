import React from 'react';
import {
    LayoutDashboard,
    Activity,
    Users,
    Settings,
    Sliders,
    LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type AdminView = 'analytics' | 'activity' | 'users' | 'configure' | 'settings';

interface AdminSidebarProps {
    currentView: AdminView;
    onChangeView: (view: AdminView) => void;
}

const MENU_ITEMS: { id: AdminView; label: string; icon: React.ElementType }[] = [
    { id: 'analytics', label: 'Analytics', icon: LayoutDashboard },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'configure', label: 'Configure', icon: Sliders },
    { id: 'settings', label: 'Settings', icon: Settings },
];

export default function AdminSidebar({ currentView, onChangeView }: AdminSidebarProps) {
    return (
        <aside className="w-64 bg-card/50 backdrop-blur-xl border-r border-border/50 flex flex-col h-screen sticky top-0">
            <div className="p-6">
                <div className="flex items-center gap-3 px-2 mb-8">
                    <div className="h-8 w-8 bg-primary/20 rounded-lg flex items-center justify-center">
                        <LayoutDashboard className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-bold text-lg bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        SuperAdmin
                    </span>
                </div>

                <nav className="space-y-1">
                    {MENU_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentView === item.id;

                        return (
                            <button
                                key={item.id}
                                onClick={() => onChangeView(item.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                                    isActive
                                        ? "bg-primary/10 text-primary shadow-sm"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                )}
                            >
                                <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            <div className="mt-auto p-6 border-t border-border/50">
                <a
                    href="/"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    Exit Dashboard
                </a>
            </div>
        </aside>
    );
}
