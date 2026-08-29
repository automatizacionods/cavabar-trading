import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Activity, BarChart3, Home, Rocket } from "lucide-react";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/app" className="flex items-center gap-2">
            <span
              className="grid size-9 place-items-center rounded-xl"
              style={{ background: "color-mix(in oklab, var(--primary) 22%, transparent)" }}
            >
              <Activity className="size-5 text-primary" />
            </span>
            <span className="font-display text-lg font-extrabold">
              CavaBar <span className="text-primary">Trading</span>
            </span>
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              to="/app"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              activeProps={{ className: "bg-accent text-foreground" }}
            >
              <Home className="size-4" />
              <span className="hidden sm:inline">Inicio</span>
            </Link>
            <Link
              to="/app/promociones"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              activeProps={{ className: "bg-accent text-foreground" }}
            >
              <Rocket className="size-4" />
              <span className="hidden sm:inline">Promociones</span>
            </Link>
            <Link
              to="/app/trading"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              activeProps={{ className: "bg-accent text-foreground" }}
            >
              <BarChart3 className="size-4" />
              <span className="hidden sm:inline">Tablero</span>
            </Link>
          </nav>
        </div>
      </header>
      <Outlet />
    </div>
  );
}