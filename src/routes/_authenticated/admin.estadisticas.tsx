import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useSales } from "@/hooks/useAdminData";
import { usePriceHistory, useProducts, usePromotions } from "@/hooks/useTradingData";
import { PROMO_LABEL, changePct, formatPrice } from "@/lib/trading";

export const Route = createFileRoute("/_authenticated/admin/estadisticas")({
  head: () => ({
    meta: [
      { title: "Estadísticas | CavaBar Trading" },
      { name: "description", content: "Analiza ventas, evolución de precios y desempeño de promociones del bar." },
      { property: "og:title", content: "Estadísticas | CavaBar Trading" },
      { property: "og:description", content: "Analítica del mercado de tu bar." },
    ],
  }),
  component: EstadisticasPage,
});

function EstadisticasPage() {
  const products = useProducts(false);
  const history = usePriceHistory();
  const promotions = usePromotions();
  const sales = useSales();

  const list = products.data ?? [];
  const revenueByProduct = list
    .map((p) => ({
      name: p.name.slice(0, 12),
      ingresos: (sales.data ?? [])
        .filter((s) => s.product_id === p.id)
        .reduce((acc, s) => acc + Number(s.total), 0),
    }))
    .sort((a, b) => b.ingresos - a.ingresos)
    .slice(0, 8);

  const top = list[0];
  const series = (history.data?.get(top?.id ?? "") ?? []).map((price, i) => ({
    i: `${i}`,
    precio: price,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold">Estadísticas</h1>
        <p className="text-sm text-muted-foreground">Desempeño del mercado y de tus ofertas.</p>
      </div>

      <div className="glass rounded-2xl p-4">
        <h2 className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Ingresos por producto
        </h2>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueByProduct}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} width={70} />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                }}
                formatter={(v: number) => formatPrice(v)}
              />
              <Bar dataKey="ingresos" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass rounded-2xl p-4">
          <h2 className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Evolución de precio · {top?.name ?? "—"}
          </h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="i" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} width={70} domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                  }}
                  formatter={(v: number) => formatPrice(v)}
                />
                <Line
                  type="monotone"
                  dataKey="precio"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-2xl p-4">
          <h2 className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Ranking de variación
          </h2>
          <div className="mt-3 divide-y divide-border">
            {[...list]
              .sort((a, b) => changePct(b) - changePct(a))
              .slice(0, 10)
              .map((p) => {
                const pct = changePct(p);
                return (
                  <div key={p.id} className="flex items-center gap-3 py-2 text-sm">
                    <span className="min-w-0 flex-1 truncate font-semibold">{p.name}</span>
                    <span className="num text-muted-foreground">
                      {formatPrice(Number(p.current_price))}
                    </span>
                    <span
                      className="num w-20 text-right font-bold"
                      style={{ color: pct >= 0 ? "var(--up)" : "var(--down)" }}
                    >
                      {pct >= 0 ? "+" : ""}
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-4">
        <h2 className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Historial de promociones
        </h2>
        <div className="mt-3 divide-y divide-border">
          {(promotions.data ?? []).slice(0, 12).map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
              <span className="w-40 truncate font-semibold">
                {list.find((x) => x.id === p.product_id)?.name ?? "Producto"}
              </span>
              <span className="text-muted-foreground">
                {PROMO_LABEL[p.promo_type] ?? p.promo_type}
              </span>
              <span className="num" style={{ color: "var(--promo)" }}>
                {formatPrice(Number(p.promo_price))}
              </span>
              <span className="num ml-auto text-xs text-muted-foreground">
                {new Date(p.starts_at).toLocaleString("es-CO")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
