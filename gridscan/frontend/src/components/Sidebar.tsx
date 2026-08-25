import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  FileBox,
  LayoutDashboard,
  Map,
  TowerControl,
  Zap,
  Zap as ZapIcon,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Home / Data Import", icon: LayoutDashboard, to: "/" },
  { label: "Point Cloud Viewer", icon: Map, to: "/viewer" },
  { label: "Asset Inventory", icon: TowerControl, to: "/assets" },
  { label: "Span Analytics", icon: Activity, to: "/spans" },
  { label: "Energy Loss Analysis", icon: ZapIcon, to: "/energy" },
  { label: "Reports", icon: FileBox, to: "/reports" },
];

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden lg:flex w-64 shrink-0 sticky top-0 h-screen flex-col border-r border-border bg-sidebar/80 backdrop-blur-xl">
      {/* Logo */}
      <div className="px-6 py-6 flex items-center gap-3 border-b border-border">
        <div
          className="size-10 rounded-xl grid place-items-center glow-ring"
          style={{ backgroundImage: "var(--gradient-electric)" }}
        >
          <Zap className="size-5 text-primary-foreground" strokeWidth={2.5} style={{ color: "oklch(12% 0.03 250)" }} />
        </div>
        <div>
          <div className="font-semibold leading-tight" style={{ color: "var(--foreground)" }}>
            GridScan
          </div>
          <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            Powerline Analytics
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.to === pathname;
          return (
            <Link
              key={item.label}
              to={item.to}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-accent text-foreground shadow-[inset_0_0_0_1px_var(--border)]"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              }`}
            >
              <Icon className="size-4" />
              <span className="truncate">{item.label}</span>
              {isActive && (
                <span className="ml-auto size-1.5 rounded-full bg-primary animate-pulse-glow" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Status */}
      <div className="p-4 border-t border-border">
        <div className="rounded-xl border border-border bg-card/60 p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            Classifier online
          </div>
          <div className="mt-1 text-sm font-medium">Engine v3.2 · LAS 1.4</div>
        </div>
      </div>
    </aside>
  );
}
