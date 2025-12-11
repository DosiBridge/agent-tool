"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import AdminShell from "@/components/admin/AdminShell";
import { AdminView } from "@/components/admin/AdminSidebar";
import AnalyticsView from "@/components/admin/views/AnalyticsView";
import ActivityView from "@/components/admin/views/ActivityView";
import UsersView from "@/components/admin/views/UsersView";
import AppealsView from "@/components/admin/views/AppealsView";
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
    // Check if user is authenticated and is admin or superadmin
    if (!isAuthenticated) {
      router.push("/");
      return;
    }

    // Allow short delay for hydration
    const timer = setTimeout(() => {
      const userRole = user?.role;
      const isActive = user?.is_active;
      
      // Blocked users cannot access admin dashboard
      if (!isActive) {
        router.push("/chat"); // Redirect to chat page which will show BlockedUserView
        return;
      }
      
      if (userRole !== 'admin' && userRole !== 'superadmin') {
        router.push("/");
      } else {
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderView = () => {
    // Admin can only access: analytics, activity, users
    // Superadmin can access everything
    const userRole = user?.role;
    if (userRole === 'admin' && !['analytics', 'activity', 'users'].includes(currentView)) {
      return <AnalyticsView />; // Redirect admin to analytics if they try to access restricted views
    }

    switch (currentView) {
      case 'analytics':
        return <AnalyticsView />;
      case 'activity':
        return <ActivityView />;
      case 'users':
        return <UsersView />;
      case 'appeals':
        return userRole === 'superadmin' ? <AppealsView /> : <AnalyticsView />;
      case 'global':
        return userRole === 'superadmin' ? <GlobalConfigView /> : <AnalyticsView />;
      case 'configure':
        return userRole === 'superadmin' ? <ConfigureView /> : <AnalyticsView />;
      case 'settings':
        return userRole === 'superadmin' ? <SettingsView /> : <AnalyticsView />;
      default:
        return <AnalyticsView />;
    }
  };

  const getTitle = () => {
    switch (currentView) {
      case 'analytics': return 'Dashboard Analytics';
      case 'activity': return 'System Activity';
      case 'users': return 'User Management';
      case 'appeals': return 'User Appeals';
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
