import { Settings } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { DashboardStats } from "@/types/domain";

const SettingsPage = () => {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { data } = useQuery({
    queryKey: ["dashboard", "settings"],
    queryFn: () => apiGet<DashboardStats>("/api/dashboard", getToken),
    enabled: isLoaded && isSignedIn,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          System configuration and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-card-foreground mb-4">Alert Preferences</h2>
          <div className="space-y-4">
            {["Low stock alerts", "Equipment maintenance reminders", "Critical status notifications", "Daily summary reports"].map((item) => (
              <label key={item} className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-card-foreground">{item}</span>
                <div className="h-5 w-9 rounded-full bg-primary relative">
                  <div className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-primary-foreground transition-transform" />
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-card-foreground mb-4">System Information</h2>
          <div className="space-y-3">
            {[
              ["Platform Version", "2.4.1"],
              ["Total Labs", String(data?.totalLabs ?? 0)],
              ["Connected Sensors", String((data?.totalInventoryItems ?? 0) + (data?.totalEquipment ?? 0))],
              ["Last Sync", "Just now"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-sm font-medium text-card-foreground">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
