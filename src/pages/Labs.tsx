import { useState, useMemo } from "react";
import { Building2, Search, MapPin } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { Lab } from "@/types/domain";

const Labs = () => {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const { data: labs = [] } = useQuery({
    queryKey: ["labs"],
    queryFn: () => apiGet<Lab[]>("/api/labs", getToken),
    enabled: isLoaded && isSignedIn,
  });

  const filtered = useMemo(() => {
    return labs.filter((lab) => {
      const matchSearch =
        lab.name.toLowerCase().includes(search.toLowerCase()) ||
        lab.city.toLowerCase().includes(search.toLowerCase()) ||
        lab.code.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "All" || lab.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [labs, search, statusFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          Lab Management
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Overview of all {labs.length} lab facilities
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-sm bg-card border border-border rounded-lg px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search labs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex gap-1.5">
          {["All", "operational", "warning", "critical"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((lab) => (
          <div
            key={lab.id}
            className="bg-card rounded-xl border border-border p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-[11px] font-mono text-muted-foreground">{lab.code}</p>
                <h3 className="text-sm font-semibold text-card-foreground mt-0.5">{lab.name}</h3>
              </div>
              <StatusBadge status={lab.status} />
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
              <MapPin className="h-3 w-3" /> {lab.city}
            </p>
            <div className="flex gap-3 pt-3 border-t border-border">
              {lab.inventoryAlerts > 0 && (
                <span className="text-[11px] font-medium text-warning">
                  {lab.inventoryAlerts} stock alert{lab.inventoryAlerts > 1 ? "s" : ""}
                </span>
              )}
              {lab.equipmentAlerts > 0 && (
                <span className="text-[11px] font-medium text-destructive">
                  {lab.equipmentAlerts} equip. alert{lab.equipmentAlerts > 1 ? "s" : ""}
                </span>
              )}
              {lab.inventoryAlerts === 0 && lab.equipmentAlerts === 0 && (
                <span className="text-[11px] text-muted-foreground">No active alerts</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Labs;
