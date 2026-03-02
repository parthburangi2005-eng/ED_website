interface StatusBadgeProps {
  status: "healthy" | "due" | "critical" | "operational" | "warning" | "sufficient" | "low";
  size?: "sm" | "md";
}

const statusConfig = {
  healthy: { label: "Healthy", className: "status-healthy" },
  sufficient: { label: "Sufficient", className: "status-healthy" },
  operational: { label: "Operational", className: "status-healthy" },
  due: { label: "Due", className: "status-due" },
  warning: { label: "Warning", className: "status-due" },
  low: { label: "Low", className: "status-due" },
  critical: { label: "Critical", className: "status-critical" },
};

const StatusBadge = ({ status, size = "sm" }: StatusBadgeProps) => {
  const config = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.className} ${
        size === "sm" ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-xs"
      }`}
    >
      <span
        className={`rounded-full ${size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2"} ${
          status === "healthy" || status === "sufficient" || status === "operational"
            ? "bg-success"
            : status === "due" || status === "warning" || status === "low"
            ? "bg-warning"
            : "bg-destructive"
        } ${status === "critical" ? "animate-pulse-slow" : ""}`}
      />
      {config.label}
    </span>
  );
};

export default StatusBadge;
