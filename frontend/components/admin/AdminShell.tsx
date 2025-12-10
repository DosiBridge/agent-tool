import React from 'react';
import AdminSidebar, { AdminView } from './AdminSidebar';
import AdminHeader from './AdminHeader';

interface AdminShellProps {
    children: React.ReactNode;
    currentView: AdminView;
    onChangeView: (view: AdminView) => void;
    title: string;
}

export default function AdminShell({ children, currentView, onChangeView, title }: AdminShellProps) {
    return (
        <div className="flex min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
            <AdminSidebar currentView={currentView} onChangeView={onChangeView} />

            <div className="flex-1 flex flex-col min-w-0">
                <AdminHeader title={title} />
                <main className="flex-1 p-6 overflow-y-auto">
                    <div className="max-w-7xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
