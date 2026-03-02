import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import { Bell, Search, User } from "lucide-react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { Alert } from "@/types/domain";

const AppLayout = () => {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { data: alerts = [] } = useQuery({
    queryKey: ["alerts", "header"],
    queryFn: () => apiGet<Alert[]>("/api/alerts", getToken),
    enabled: isLoaded && isSignedIn,
  });
  const unreadCount = alerts.filter((a) => !a.read).length;

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <div className="pl-[240px] transition-all duration-300">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-6">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search labs, equipment, inventory..."
              className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
              <Bell className="h-[18px] w-[18px] text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  {unreadCount}
                </span>
              )}
            </button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-foreground">{user?.fullName ?? "Admin"}</p>
                <p className="text-[11px] text-muted-foreground">HQ Manager</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
