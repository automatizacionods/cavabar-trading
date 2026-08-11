import { createFileRoute } from "@tanstack/react-router";
import { Clock, DollarSign, Flame, TrendingUp, Trophy } from "lucide-react";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { KpiCard } from "@/components/admin/KpiCard";
import { CircularCountdown } from "@/components/trading/CircularCountdown";
import { useCountdown } from "@/hooks/useCountdown";
import { useSales } from "@/hooks/useAdminData";
import { usePriceHistory, useProducts, usePromotions } from "@/hooks/useTradingData";
import { PROMO_LABEL, changePct, formatPrice, isPromoLive } from "@/lib/trading";

export const Route = createFileRoute("/_authenticated/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard | CavaBar Trading" },
      { name: "description", content: "KPIs de ventas, promociones activas y variación de precios del bar." },
      { property: "og:title", content: "Dashboard | CavaBar Trading" },
      { property: "og:description", content: "Panel de control en tiempo real del bar." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const products = useProducts(false);
  const sales = useSales();
  const promotions = usePromotions();
  const history = usePriceHistory();

  const list = products.data ?? [];
  const today = (sales.data ?? []).filter(
    (s) => new Date(s.created_at).toDateString() === new Date().toDateString(),
  );
  const revenue = today.reduce((acc, s) => acc + Number(s.total), 0);

  const topProduct = useMemo(() => {
    const totals = new Map<string, number>();
    for (const s of today) {
      if (!s.product_id) continue;
      totals.set(s.product_id, (totals.get(s.product_id) ?? 0) + s.quantity);
    }
    const best = [...totals.entries()].sort((a, b) => b[1] - a[1])[0];
    if (!best) return null;
    return { product: list.find((p) => p.id === best[0]), qty: best[1] };
  }, [today, list]);

  const activePromo = (promotions.data ?? []).find((p) => isPromoLive(p)) ?? null;
  const promoProduct = activePromo ? list.find((p) => p.id === activePromo.product_id) : null;
  const msLeft = useCountdown(activePromo?.ends_at ?? null);
  const totalMs = activePromo
    ? new Date(activePromo.ends_at).getTime() - new Date(activePromo.starts_at).getTime()
    : 0;

  const avgChange =
    list.length > 0 ? list.reduce((acc, p) => acc + changePct(p), 0) / list.length : 0;

  const byHour = useMemo(() => {
    const buckets = new Map<number, number>();
    for (const s of today) buckets.set(new Date(s.created_at).getHours(), (buckets.get(new Date(s.created_at).getHours()) ?? 0) + Number(s.total));
    return [...Array(24).keys()]
      .filter((h) => h >= 10)
      .map((h) => ({ hora: `${h}:00`, ventas: Math.round(buckets.get(h) ?? 0) }));
  }, [today]);

  const mostViewed = [...list]
    .sort((a, b) => b.views_count - a.views_count)
    .slice(0, 6)
    .map((p) => ({ name: p.name.slice(0, 12), consultas: p.views_count }));

  const topGainers = [...list].sort((a, b) => changePct(b) - changePct(a)).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Estado del mercado de tu bar en tiempo real.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Ventas del día"
          value={formatPrice(revenue)}
          hint={`${today.length} transacciones`}
          tone="up"
          icon={<DollarSign className="size-4" />}
        />
        <KpiCard
          label="Producto más vendido"
          value={topProduct?.product?.name ?? "—"}
          hint={topProduct ? `${topProduct.qty} unidades` : "sin datos"}
          icon={<Trophy className="size-4" />}
        />
        <KpiCard
          label="Promoción activa"
          value={promoProduct?.name ?? "Ninguna"}
          hint={activePromo ? (PROMO_LABEL[activePromo.promo_type] ?? "") : "sin promociones"}
          tone="promo"
          icon={<Flame className="size-4" />}
        />
        <KpiCard
          label="Tiempo restante"
          value={activePromo && msLeft > 0 ? `${Math.floor(msLeft / 60000)} min` : "—"}
          hint={activePromo ? new Date(activePromo.ends_at).toLocaleTimeString("es-CO") : ""}
          tone={msLeft > 0 && msLeft <= 60_000 ? "down" : "promo"}
          icon={<Clock className="size-4" />}
        />
        <KpiCard
          label="Variación promedio"
          value={`${avgChange >= 0 ? "+" : ""}${avgChange.toFixed(2)}%`}
          hint={`${list.length} productos listados`}
          tone={avgChange >= 0 ? "up" : "down"}
          icon={<TrendingUp className="size-4" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="glass rounded-2xl p-4">
          <h2 className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Ventas por hora
          </h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={byHour}>
                <defs>
                  <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="hora" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} width={70} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    color: "var(--foreground)",
                  }}
                  formatter={(v: number) => formatPrice(v)}
                />
                <Area
                  type="monotone"
                  dataKey="ventas"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fill="url(#salesFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass flex flex-col items-center justify-center gap-4 rounded-2xl p-6">
          <h2 className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Oferta en curso
          </h2>
          {activePromo && msLeft > 0 ? (
            <>
              <CircularCountdown msLeft={msLeft} totalMs={totalMs} size={150} />
              <p className="font-display text-xl font-bold uppercase">{promoProduct?.name}</p>
              <p className="num text-2xl font-bold" style={{ color: "var(--promo)" }}>
                {formatPrice(Number(activePromo.promo_price))}
              </p>
            </>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No hay promoción activa. Lanza una desde Promociones.
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-2xl p-4">
          <h2 className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Productos más consultados
          </h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mostViewed}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} width={40} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                  }}
                />
                <Bar dataKey="consultas" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-2xl p-4">
          <h2 className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Mayor incremento de precio
          </h2>
          <div className="mt-4 divide-y divide-border">
            {topGainers.map((p) => {
              const pct = changePct(p);
              const spark = history.data?.get(p.id) ?? [];
              return (
                <div key={p.id} className="flex items-center gap-3 py-2.5">
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">{p.name}</span>
                  <span className="num text-sm text-muted-foreground">
                    {formatPrice(Number(p.current_price))}
                  </span>
                  <span
                    className="num w-20 text-right text-sm font-bold"
                    style={{ color: pct >= 0 ? "var(--up)" : "var(--down)" }}
                  >
                    {pct >= 0 ? "+" : ""}
                    {pct.toFixed(1)}%
                  </span>
                  <span className="hidden text-xs text-muted-foreground sm:block">
                    {spark.length} pts
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
