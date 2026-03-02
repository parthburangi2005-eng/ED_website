import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  variant?: "default" | "success" | "warning" | "critical";
}

const variantStyles = {
  default: "bg-card border-border",
  success: "bg-card border-success/20",
  warning: "bg-card border-warning/20",
  critical: "bg-card border-destructive/20",
};

const iconVariantStyles = {
  default: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  critical: "bg-destructive/10 text-destructive",
};

const StatCard = ({ title, value, subtitle, icon: Icon, variant = "default" }: StatCardProps) => {
  return (
    <div
      className={`rounded-xl border p-5 shadow-sm animate-slide-in ${variantStyles[variant]}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold text-card-foreground">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className={`rounded-lg p-2.5 ${iconVariantStyles[variant]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
