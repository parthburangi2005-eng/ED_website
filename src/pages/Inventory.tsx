import { useState, useMemo } from "react";
import { Package, Search, Filter } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { InventoryItem } from "@/types/domain";

const categories = ["All", "3D Printing", "Resin", "Raw Material", "Consumable"];
const statusFilters = ["All", "sufficient", "low", "critical"] as const;

const Inventory = () => {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const { data: inventoryItems = [] } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => apiGet<InventoryItem[]>("/api/inventory", getToken),
    enabled: isLoaded && isSignedIn,
  });

  const filtered = useMemo(() => {
    return inventoryItems.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.labName.toLowerCase().includes(search.toLowerCase());
      const matchCategory = category === "All" || item.category === category;
      const matchStatus = statusFilter === "All" || item.status === statusFilter;
      return matchSearch && matchCategory && matchStatus;
    });
  }, [inventoryItems, search, category, statusFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" />
          Inventory Tracking
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor consumable materials across all labs
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-sm bg-card border border-border rounded-lg px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search items or labs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <div className="flex gap-1.5 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  category === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
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

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Material
                </th>
                <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Lab
                </th>
                <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Category
                </th>
                <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Stock Level
                </th>
                <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Status
                </th>
                <th className="text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                  Updated
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 50).map((item) => {
                const stockPercent = (item.currentStock / item.maxCapacity) * 100;
                return (
                  <tr
                    key={item.id}
                    className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-card-foreground">{item.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-muted-foreground">{item.labName}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              stockPercent > 40
                                ? "bg-success"
                                : stockPercent > 20
                                ? "bg-warning"
                                : "bg-destructive"
                            }`}
                            style={{ width: `${stockPercent}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {item.currentStock}/{item.maxCapacity} {item.unit}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={item.status === "sufficient" ? "sufficient" : item.status === "low" ? "low" : "critical"} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.lastUpdated).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border bg-muted/20">
          <p className="text-xs text-muted-foreground">
            Showing {Math.min(filtered.length, 50)} of {filtered.length} items
          </p>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
