import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { ProductCard } from "@/components/trading/ProductCard";
import { PublicNav } from "@/components/trading/PublicNav";
import { Ticker } from "@/components/trading/Ticker";
import { CircularCountdown } from "@/components/trading/CircularCountdown";
import { useCountdown } from "@/hooks/useCountdown";
import { usePriceHistory, useProducts, usePromotions, useRealtimeSync } from "@/hooks/useTradingData";
import {
  PROMO_LABEL,
  changePct,
  formatPrice,
  isPromoLive,
  type Product,
  type Promotion,
} from "@/lib/trading";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/trading")({
  head: () => ({
    meta: [
      { title: "Trading Board en vivo | CavaBar Trading" },
      {
        name: "description",
        content:
          "Precios de bebidas que suben y bajan en tiempo real como una bolsa de valores. Mira las ofertas flash del bar antes de que expiren.",
      },
      { property: "og:title", content: "Trading Board en vivo | CavaBar Trading" },
      {
        property: "og:description",
        content: "La bolsa de valores de tu bar: precios dinámicos y flash sales en vivo.",
      },
    ],
  }),
  component: TradingPage,
});

export function useBoard() {
  useRealtimeSync();
  const products = useProducts();
  const history = usePriceHistory();
  const promotions = usePromotions();

  const livePromos = useMemo(() => {
    const map = new Map<string, Promotion>();
    for (const p of promotions.data ?? []) {
      if (isPromoLive(p) && !map.has(p.product_id)) map.set(p.product_id, p);
    }
    return map;
  }, [promotions.data]);

  return { products, history, promotions, livePromos };
}

function TradingPage() {
  const { products, history, livePromos } = useBoard();
  const [category, setCategory] = useState<string>("todas");

  const list = products.data ?? [];
  const categories = useMemo(
    () => ["todas", ...Array.from(new Set(list.map((p) => p.category)))],
    [list],
  );
  const filtered = category === "todas" ? list : list.filter((p) => p.category === category);

  const featured = list.find((p) => livePromos.has(p.id)) ?? null;
  const featuredPromo = featured ? (livePromos.get(featured.id) ?? null) : null;

  const avgChange =
    list.length > 0 ? list.reduce((acc, p) => acc + changePct(p), 0) / list.length : 0;

  return (
    <div className="min-h-screen">
      <PublicNav />
      <Ticker products={list} />

      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Mercado de barra en vivo
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Los precios se mueven con la demanda. Compra cuando bajen.
            </p>
          </div>
          <div className="glass rounded-xl px-4 py-2">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Índice CavaBar
            </p>
            <p
              className="num text-2xl font-bold"
              style={{ color: avgChange >= 0 ? "var(--up)" : "var(--down)" }}
            >
              {avgChange >= 0 ? "+" : ""}
              {avgChange.toFixed(2)}%
            </p>
          </div>
        </div>

        {featured && featuredPromo ? (
          <FeaturedPromo product={featured} promo={featuredPromo} />
        ) : null}

        <div className="mb-4 mt-6 flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "rounded-full border border-border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors",
                category === c
                  ? "bg-primary text-primary-foreground"
                  : "bg-panel/60 text-muted-foreground hover:text-foreground",
              )}
            >
              {c}
            </button>
          ))}
        </div>

        {products.isLoading ? (
          <p className="py-20 text-center text-muted-foreground">Cargando mercado…</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {filtered.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                history={history.data?.get(p.id) ?? [Number(p.current_price)]}
                promo={livePromos.get(p.id) ?? null}
                msLeft={
                  livePromos.has(p.id)
                    ? new Date(livePromos.get(p.id)!.ends_at).getTime() - Date.now()
                    : 0
                }
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function FeaturedPromo({ product, promo }: { product: Product; promo: Promotion }) {
  const msLeft = useCountdown(promo.ends_at);
  const totalMs = new Date(promo.ends_at).getTime() - new Date(promo.starts_at).getTime();
  if (msLeft <= 0) return null;

  return (
    <section className="glass promo-pulse relative flex flex-wrap items-center gap-6 overflow-hidden rounded-3xl p-6 sm:p-8">
      <div className="grid-lines pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative">
        <p
          className="num text-sm font-bold tracking-[0.3em]"
          style={{ color: "var(--promo)" }}
        >
          🔥 {PROMO_LABEL[promo.promo_type] ?? "PROMO"}
        </p>
        <h2 className="font-display text-4xl font-extrabold uppercase tracking-tight sm:text-6xl">
          {product.name}
        </h2>
        <div className="mt-2 flex items-end gap-3">
          <span className="num text-4xl font-bold sm:text-5xl" style={{ color: "var(--promo)" }}>
            {formatPrice(Number(promo.promo_price))}
          </span>
          <span className="num pb-1 text-lg text-muted-foreground line-through">
            {formatPrice(Number(promo.original_price))}
          </span>
        </div>
      </div>
      <div className="relative ml-auto">
        <CircularCountdown msLeft={msLeft} totalMs={totalMs} size={150} />
      </div>
    </section>
  );
}
