import { Link } from "@tanstack/react-router";
import { Activity, CandlestickChart, Flame, Monitor, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

const LINKS = [
  { to: "/app/trading", label: "Trading Board", icon: CandlestickChart },
  { to: "/app/promociones", label: "Promociones", icon: Flame },
  { to: "/tv", label: "Modo TV", icon: Monitor },
] as const;

export function PublicNav() {
  const [now, setNow] = useState<string>("");
  useEffect(() => {
    const tick = () => setNow(new Date().toLocaleTimeString("es-CO"));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-4 px-4 py-3 sm:px-6">
        <Link to="/app/trading" className="flex items-center gap-2">
          <span
            className="grid size-9 place-items-center rounded-xl"
            style={{ background: "color-mix(in oklab, var(--primary) 22%, transparent)" }}
          >
            <Activity className="size-5 text-primary" />
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight">
            CavaBar<span className="text-primary"> Trading</span>
          </span>
        </Link>

        <nav className="order-3 flex w-full gap-1 sm:order-none sm:w-auto">
          {LINKS.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              activeProps={{ className: "bg-accent text-foreground" }}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <span
              className="size-2 animate-pulse rounded-full"
              style={{ background: "var(--up)" }}
            />
            MERCADO ABIERTO
          </span>
          <span className="num hidden text-sm text-foreground sm:block">{now}</span>
          <Link
            to="/admin/dashboard"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ShieldCheck className="size-3.5" /> Administración
          </Link>
        </div>
      </div>
    </header>
  );
}
