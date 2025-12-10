import React from 'react';
import { useStore } from '@/lib/store';
import { Bell, Search } from 'lucide-react';

interface AdminHeaderProps {
    title: string;
}

export default function AdminHeader({ title }: AdminHeaderProps) {
    const user = useStore(state => state.user);

    return (
        <header className="h-16 border-b border-border/50 bg-card/30 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold text-foreground">{title}</h1>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="h-9 pl-9 pr-4 rounded-full bg-muted/50 border-none text-sm focus:ring-1 focus:ring-primary/50 w-64"
                    />
                </div>

                <div className="w-px h-6 bg-border/50" />

                <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors hover:bg-muted/50 rounded-full">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-background" />
                </button>

                <div className="flex items-center gap-3 pl-2">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-foreground">{user?.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                    </div>
                    <div className="h-9 w-9 bg-gradient-to-br from-primary to-purple-500 rounded-full flex items-center justify-center text-white font-medium shadow-lg shadow-primary/20">
                        {user?.name?.[0]?.toUpperCase()}
                    </div>
                </div>
            </div>
        </header>
    );
}
