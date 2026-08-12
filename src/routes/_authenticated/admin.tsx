import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  CandlestickChart,
  LayoutDashboard,
  LogOut,
  Monitor,
  Package,
  Settings,
  Zap,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useRealtimeSync } from "@/hooks/useTradingData";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const NAV = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/productos", label: "Productos", icon: Package },
  { to: "/admin/promociones", label: "Promociones", icon: Zap },
  { to: "/admin/graficos", label: "Gráficos", icon: CandlestickChart },
  { to: "/admin/estadisticas", label: "Estadísticas", icon: BarChart3 },
  { to: "/admin/configuracion", label: "Configuración", icon: Settings },
] as const;

function AdminLayout() {
  useRealtimeSync();
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    void navigate({ to: "/admin/login" });
  };

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4 lg:flex">
        <Link to="/admin/dashboard" className="flex items-center gap-2 px-2 py-3">
          <span
            className="grid size-9 place-items-center rounded-xl"
            style={{ background: "color-mix(in oklab, var(--primary) 22%, transparent)" }}
          >
            <Activity className="size-5 text-primary" />
          </span>
          <span className="font-display text-base font-extrabold">
            CavaBar<span className="text-primary"> Admin</span>
          </span>
        </Link>

        <nav className="mt-4 flex flex-1 flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
              activeProps={{ className: "bg-sidebar-accent text-foreground font-semibold" }}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>

        <Link
          to="/tv"
          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
        >
          <Monitor className="size-4" /> Modo TV
        </Link>
        <button
          onClick={signOut}
          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
        >
          <LogOut className="size-4" /> Salir
        </button>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="flex gap-1 overflow-x-auto border-b border-border bg-sidebar/60 px-3 py-2 lg:hidden">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-muted-foreground"
              activeProps={{ className: "bg-sidebar-accent text-foreground" }}
            >
              <Icon className="size-3.5" />
              {label}
            </Link>
          ))}
        </div>
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
