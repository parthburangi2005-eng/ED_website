import { Bell, CheckCircle2 } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch } from "@/lib/api";
import type { Alert } from "@/types/domain";

const Alerts = () => {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const { data: items = [] } = useQuery({
    queryKey: ["alerts"],
    queryFn: () => apiGet<Alert[]>("/api/alerts", getToken),
    enabled: isLoaded && isSignedIn,
  });
  const markReadMutation = useMutation({
    mutationFn: (id: string) => apiPatch(`/api/alerts/${id}/read`, {}, getToken),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }),
  });
  const markAllReadMutation = useMutation({
    mutationFn: () => apiPatch("/api/alerts/read-all", {}, getToken),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }),
  });

  const markRead = (id: string) => {
    markReadMutation.mutate(id);
  };

  const markAllRead = () => {
    markAllReadMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Alerts Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {items.filter((a) => !a.read).length} unread alerts
          </p>
        </div>
        <button
          onClick={markAllRead}
          className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
        >
          <CheckCircle2 className="h-3.5 w-3.5" /> Mark all read
        </button>
      </div>

      <div className="space-y-2">
        {items.map((alert) => (
          <div
            key={alert.id}
            onClick={() => markRead(alert.id)}
            className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
              !alert.read
                ? "bg-card border-border shadow-sm"
                : "bg-transparent border-transparent opacity-70"
            }`}
          >
            <div
              className={`mt-1 h-2.5 w-2.5 rounded-full shrink-0 ${
                alert.severity === "critical"
                  ? "bg-destructive animate-pulse-slow"
                  : "bg-warning"
              }`}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider ${
                    alert.type === "inventory" ? "text-primary" : "text-accent"
                  }`}
                >
                  {alert.type}
                </span>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider ${
                    alert.severity === "critical" ? "text-destructive" : "text-warning"
                  }`}
                >
                  {alert.severity}
                </span>
              </div>
              <p className="text-sm text-card-foreground">{alert.message}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[11px] text-muted-foreground">{alert.labName}</span>
                <span className="text-[11px] text-muted-foreground">·</span>
                <span className="text-[11px] text-muted-foreground">
                  {new Date(alert.timestamp).toLocaleString()}
                </span>
              </div>
            </div>
            {!alert.read && (
              <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Alerts;
