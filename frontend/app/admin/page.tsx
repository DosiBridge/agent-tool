"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import AdminShell from "@/components/admin/AdminShell";
import { AdminView } from "@/components/admin/AdminSidebar";
import AnalyticsView from "@/components/admin/views/AnalyticsView";
import ActivityView from "@/components/admin/views/ActivityView";
import UsersView from "@/components/admin/views/UsersView";
import ConfigureView from "@/components/admin/views/ConfigureView";
import SettingsView from "@/components/admin/views/SettingsView";
import GlobalConfigView from "@/components/admin/views/GlobalConfigView";
import { Loader2 } from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isSuperadmin } = useStore();
  const [currentView, setCurrentView] = useState<AdminView>('analytics');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated and is superadmin
    if (!isAuthenticated) {
      router.push("/");
      return;
    }

    // Allow short delay for hydration
    const timer = setTimeout(() => {
      if (!isSuperadmin()) {
        router.push("/");
      } else {
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [isAuthenticated, isSuperadmin, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'analytics':
        return <AnalyticsView />;
      case 'activity':
        return <ActivityView />;
      case 'users':
        return <UsersView />;
      case 'global':
        return <GlobalConfigView />;
      case 'configure':
        return <ConfigureView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <AnalyticsView />;
    }
  };

  const getTitle = () => {
    switch (currentView) {
      case 'analytics': return 'Dashboard Analytics';
      case 'activity': return 'System Activity';
      case 'users': return 'User Management';
      case 'global': return 'Global Configuration';
      case 'configure': return 'LLM Configuration';
      case 'settings': return 'System Settings';
      default: return 'Dashboard';
    }
  };

  return (
    <AdminShell
      currentView={currentView}
      onChangeView={setCurrentView}
      title={getTitle()}
    >
      {renderView()}
    </AdminShell>
  );
}
