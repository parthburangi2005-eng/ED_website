import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Wrench,
  Bell,
  Building2,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/inventory", icon: Package, label: "Inventory" },
  { to: "/equipment", icon: Wrench, label: "Equipment" },
  { to: "/labs", icon: Building2, label: "Labs" },
  { to: "/alerts", icon: Bell, label: "Alerts" },
];

const AppSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 flex flex-col ${
        collapsed ? "w-[68px]" : "w-[240px]"
      }`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-4 border-b border-sidebar-border">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
          SM
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-semibold text-sidebar-primary-foreground truncate">
              SmartLab
            </h1>
            <p className="text-[10px] text-sidebar-foreground/60 truncate">
              Management System
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        <NavLink
          to="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          <Settings className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Settings</span>}
        </NavLink>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-[18px] w-[18px] shrink-0" />
          ) : (
            <>
              <ChevronLeft className="h-[18px] w-[18px] shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
