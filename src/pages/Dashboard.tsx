import {
  Building2,
  Package,
  Wrench,
  AlertTriangle,
  Bell,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import { Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { Alert, DashboardStats, Equipment, InventoryItem, Lab } from "@/types/domain";

const Dashboard = () => {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { data: dashboardStats } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiGet<DashboardStats>("/api/dashboard", getToken),
    enabled: isLoaded && isSignedIn,
  });
  const { data: alerts = [] } = useQuery({
    queryKey: ["alerts", "dashboard"],
    queryFn: () => apiGet<Alert[]>("/api/alerts", getToken),
    enabled: isLoaded && isSignedIn,
  });
  const { data: labs = [] } = useQuery({
    queryKey: ["labs", "dashboard"],
    queryFn: () => apiGet<Lab[]>("/api/labs", getToken),
    enabled: isLoaded && isSignedIn,
  });
  const { data: equipmentList = [] } = useQuery({
    queryKey: ["equipment", "dashboard"],
    queryFn: () => apiGet<Equipment[]>("/api/equipment", getToken),
    enabled: isLoaded && isSignedIn,
  });
  const { data: inventoryItems = [] } = useQuery({
    queryKey: ["inventory", "dashboard"],
    queryFn: () => apiGet<InventoryItem[]>("/api/inventory", getToken),
    enabled: isLoaded && isSignedIn,
  });

  if (!dashboardStats) {
    return <div className="text-sm text-muted-foreground">Loading dashboard...</div>;
  }

  const recentAlerts = alerts.slice(0, 5);
  const criticalEquipment = equipmentList.filter((e) => e.status === "critical").slice(0, 5);
  const lowStockItems = inventoryItems.filter((i) => i.status === "critical" || i.status === "low").slice(0, 5);
  const cityStats = labs.reduce((acc, lab) => {
    if (!acc[lab.city]) acc[lab.city] = { total: 0, operational: 0, warning: 0, critical: 0 };
    acc[lab.city].total++;
    acc[lab.city][lab.status]++;
    return acc;
  }, {} as Record<string, { total: number; operational: number; warning: number; critical: number }>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">HQ Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Real-time overview of all lab operations across {dashboardStats.totalLabs} facilities
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Labs"
          value={dashboardStats.totalLabs}
          subtitle={`${dashboardStats.operationalLabs} operational`}
          icon={Building2}
        />
        <StatCard
          title="Low Stock Items"
          value={dashboardStats.lowStockItems + dashboardStats.criticalStockItems}
          subtitle={`${dashboardStats.criticalStockItems} critical`}
          icon={Package}
          variant={dashboardStats.criticalStockItems > 0 ? "warning" : "default"}
        />
        <StatCard
          title="Equipment Alerts"
          value={dashboardStats.dueEquipment + dashboardStats.criticalEquipment}
          subtitle={`${dashboardStats.criticalEquipment} overdue`}
          icon={Wrench}
          variant={dashboardStats.criticalEquipment > 0 ? "critical" : "default"}
        />
        <StatCard
          title="Active Alerts"
          value={dashboardStats.unreadAlerts}
          subtitle="Require attention"
          icon={Bell}
          variant={dashboardStats.unreadAlerts > 3 ? "critical" : "warning"}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Recent Alerts
            </h2>
            <Link to="/alerts" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                  !alert.read
                    ? "bg-muted/50 border-border"
                    : "border-transparent"
                }`}
              >
                <div
                  className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                    alert.severity === "critical" ? "bg-destructive animate-pulse-slow" : "bg-warning"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-card-foreground">{alert.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-muted-foreground">{alert.labName}</span>
                    <span className="text-[11px] text-muted-foreground">·</span>
                    <span className="text-[11px] text-muted-foreground">
                      {formatTimeAgo(alert.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lab Overview by City */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Labs by City
            </h2>
            <Link to="/labs" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2.5">
            {Object.entries(cityStats).map(([city, stats]) => (
              <div key={city} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-card-foreground">{city}</p>
                  <p className="text-[11px] text-muted-foreground">{stats.total} labs</p>
                </div>
                <div className="flex items-center gap-2">
                  {stats.critical > 0 && (
                    <span className="text-[11px] font-medium text-destructive">{stats.critical} critical</span>
                  )}
                  {stats.warning > 0 && (
                    <span className="text-[11px] font-medium text-warning">{stats.warning} warning</span>
                  )}
                  <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-success rounded-full"
                      style={{ width: `${(stats.operational / stats.total) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical Equipment */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
              <Wrench className="h-4 w-4 text-destructive" />
              Critical Equipment
            </h2>
            <Link to="/equipment" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {criticalEquipment.length > 0 ? (
            <div className="space-y-3">
              {criticalEquipment.map((eq) => (
                <div key={eq.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{eq.name}</p>
                    <p className="text-[11px] text-muted-foreground">{eq.labName}</p>
                  </div>
                  <StatusBadge status="critical" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">All equipment in good condition</p>
          )}
        </div>

        {/* Low Stock Items */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
              <Package className="h-4 w-4 text-warning" />
              Low Stock Items
            </h2>
            <Link to="/inventory" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {lowStockItems.length > 0 ? (
            <div className="space-y-3">
              {lowStockItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{item.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {item.labName} · {item.currentStock} {item.unit} remaining
                    </p>
                  </div>
                  <StatusBadge status={item.status === "critical" ? "critical" : "low"} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">All inventory levels sufficient</p>
          )}
        </div>
      </div>
    </div>
  );
};

function formatTimeAgo(timestamp: string) {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default Dashboard;
