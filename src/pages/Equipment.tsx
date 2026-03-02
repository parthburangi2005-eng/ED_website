import { useState, useMemo } from "react";
import { Wrench, Search, Calendar } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { Equipment as EquipmentType } from "@/types/domain";

const typeFilters = ["All", "3D Printer", "CNC", "Laser", "Press", "Testing", "Oven"];
const statusFilters = ["All", "healthy", "due", "critical"] as const;

const Equipment = () => {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const { data: equipmentList = [] } = useQuery({
    queryKey: ["equipment"],
    queryFn: () => apiGet<EquipmentType[]>("/api/equipment", getToken),
    enabled: isLoaded && isSignedIn,
  });

  const filtered = useMemo(() => {
    return equipmentList.filter((eq) => {
      const matchSearch =
        eq.name.toLowerCase().includes(search.toLowerCase()) ||
        eq.labName.toLowerCase().includes(search.toLowerCase()) ||
        eq.manufacturer.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === "All" || eq.type === typeFilter;
      const matchStatus = statusFilter === "All" || eq.status === statusFilter;
      return matchSearch && matchType && matchStatus;
    });
  }, [equipmentList, search, typeFilter, statusFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Wrench className="h-6 w-6 text-primary" />
          Equipment Maintenance
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track maintenance schedules and equipment health
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-sm bg-card border border-border rounded-lg px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search equipment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {typeFilters.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                typeFilter === t
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {statusFilters.map((sf) => (
            <button
              key={sf}
              onClick={() => setStatusFilter(sf)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                statusFilter === sf
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {sf}
            </button>
          ))}
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.slice(0, 30).map((eq) => {
          const daysUntil = Math.ceil(
            (new Date(eq.nextService).getTime() - Date.now()) / 86400000
          );
          return (
            <div
              key={eq.id}
              className="bg-card rounded-xl border border-border p-4 shadow-sm hover:shadow-md transition-shadow animate-slide-in"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-card-foreground">{eq.name}</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {eq.manufacturer} · {eq.model}
                  </p>
                </div>
                <StatusBadge status={eq.status} />
              </div>

              <p className="text-xs text-muted-foreground mb-3">{eq.labName}</p>

              <div className="space-y-2 pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" /> Last Service
                  </span>
                  <span className="text-xs font-medium text-card-foreground">
                    {new Date(eq.lastService).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" /> Next Service
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      daysUntil < 0
                        ? "text-destructive"
                        : daysUntil < 14
                        ? "text-warning"
                        : "text-card-foreground"
                    }`}
                  >
                    {new Date(eq.nextService).toLocaleDateString()}
                    {daysUntil < 0
                      ? ` (${Math.abs(daysUntil)}d overdue)`
                      : daysUntil < 14
                      ? ` (${daysUntil}d left)`
                      : ""}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">Interval</span>
                  <span className="text-xs text-card-foreground">
                    Every {eq.serviceInterval} days
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-xs text-muted-foreground">
        Showing {Math.min(filtered.length, 30)} of {filtered.length} equipment
      </div>
    </div>
  );
};

export default Equipment;
