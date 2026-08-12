import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

import { CircularCountdown } from "@/components/trading/CircularCountdown";
import { MainChart } from "@/components/trading/MainChart";
import { PublicNav } from "@/components/trading/PublicNav";
import { Ticker } from "@/components/trading/Ticker";
import { Watchlist } from "@/components/trading/Watchlist";
import { useCandles, useChartConfig } from "@/hooks/useCandles";
import { useCountdown } from "@/hooks/useCountdown";
import { usePriceHistory, useProducts, usePromotions, useRealtimeSync } from "@/hooks/useTradingData";
import { useSettings } from "@/hooks/useAdminData";
import { categoryEmoji, productImage } from "@/lib/product-images";
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
          "Terminal bursátil del bar: velas japonesas en tiempo real, watchlist de bebidas y flash sales con cuenta regresiva.",
      },
      { property: "og:title", content: "Trading Board en vivo | CavaBar Trading" },
      {
        property: "og:description",
        content: "La bolsa de valores de tu bar: gráfico candlestick en vivo y promociones relámpago.",
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
  const { products, livePromos } = useBoard();
  const settings = useSettings();
  const config = useChartConfig();

  const list = products.data ?? [];
  const [category, setCategory] = useState("todas");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [livePrice, setLivePrice] = useState<number | null>(null);

  const categories = useMemo(
    () => ["todas", ...Array.from(new Set(list.map((p) => p.category)))],
    [list],
  );
  const filtered = category === "todas" ? list : list.filter((p) => p.category === category);

  useEffect(() => {
    if (!selectedId && list.length > 0) setSelectedId(list[0]!.id);
  }, [list, selectedId]);
  useEffect(() => setLivePrice(null), [selectedId]);

  const selected = list.find((p) => p.id === selectedId) ?? null;
  const candles = useCandles(selectedId);
  const promo = selected ? (livePromos.get(selected.id) ?? null) : null;

  const avgChange =
    list.length > 0 ? list.reduce((acc, p) => acc + changePct(p), 0) / list.length : 0;

  const bounds = selected
    ? { min: Number(selected.min_price), max: Number(selected.max_price) }
    : { min: 0, max: 1 };

  return (
    <div className="min-h-screen">
      <PublicNav />
      <Ticker products={list} />

      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
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

        <div className="grid gap-4 lg:grid-cols-10">
          <div className="relative lg:col-span-7">
            {selected ? (
              <>
                <ChartHeader product={selected} promo={promo} livePrice={livePrice} />
                <MainChart
                  candles={candles.data ?? []}
                  config={config}
                  bounds={bounds}
                  volatility={Number(settings.data?.volatility ?? 3)}
                  onPrice={setLivePrice}
                />
                {promo ? <PromoOverlay product={selected} promo={promo} /> : null}
              </>
            ) : (
              <div className="glass grid h-[420px] place-items-center rounded-2xl text-muted-foreground">
                Cargando mercado…
              </div>
            )}
          </div>

          <div className="lg:col-span-3">
            {selected ? <DetailPanel product={selected} promo={promo} /> : null}
          </div>
        </div>

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

        <Watchlist
          products={filtered}
          selectedId={selectedId}
          onSelect={setSelectedId}
          promos={livePromos}
        />
      </main>
    </div>
  );
}

function ChartHeader({
  product,
  promo,
  livePrice,
}: {
  product: Product;
  promo: Promotion | null;
  livePrice: number | null;
}) {
  const base = promo ? Number(promo.promo_price) : (livePrice ?? Number(product.current_price));
  const pct = changePct(product);
  const up = pct >= 0;
  return (
    <div className="mb-3 flex flex-wrap items-end gap-4">
      <div>
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
          {product.category}
        </p>
        <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight sm:text-3xl">
          {product.name}
        </h2>
      </div>
      <motion.span
        key={Math.round(base)}
        initial={{ scale: 0.96, opacity: 0.5 }}
        animate={{ scale: 1, opacity: 1 }}
        className="num text-3xl font-bold sm:text-4xl"
        style={{ color: promo ? "var(--promo)" : up ? "var(--up)" : "var(--down)" }}
      >
        {formatPrice(base)}
      </motion.span>
      <span
        className="num rounded-lg px-2 py-1 text-sm font-semibold"
        style={{
          color: up ? "var(--up)" : "var(--down)",
          background: `color-mix(in oklab, ${up ? "var(--up)" : "var(--down)"} 14%, transparent)`,
        }}
      >
        {up ? "▲ +" : "▼ "}
        {pct.toFixed(2)}%
      </span>
    </div>
  );
}

function PromoOverlay({ product, promo }: { product: Product; promo: Promotion }) {
  const msLeft = useCountdown(promo.ends_at);
  const totalMs = new Date(promo.ends_at).getTime() - new Date(promo.starts_at).getTime();
  if (msLeft <= 0) return null;
  return (
    <div className="glass promo-pulse pointer-events-none absolute right-6 top-20 flex items-center gap-4 rounded-2xl p-4">
      <div>
        <p className="num text-xs font-bold tracking-[0.25em]" style={{ color: "var(--promo)" }}>
          ⚡ {PROMO_LABEL[promo.promo_type] ?? "PROMO"}
        </p>
        <p className="font-display text-xl font-extrabold uppercase">{product.name}</p>
        <p className="num text-2xl font-bold" style={{ color: "var(--promo)" }}>
          {formatPrice(Number(promo.promo_price))}
        </p>
      </div>
      <CircularCountdown msLeft={msLeft} totalMs={totalMs} size={92} />
    </div>
  );
}

function DetailPanel({ product, promo }: { product: Product; promo: Promotion | null }) {
  const img = productImage(product.name, product.image_url);
  const rows: [string, string][] = [
    ["Precio base", formatPrice(Number(product.base_price))],
    ["Mínimo", formatPrice(Number(product.min_price))],
    ["Máximo", formatPrice(Number(product.max_price))],
    ["Anterior", formatPrice(Number(product.previous_price))],
    ["Stock", String(product.stock)],
    ["Vendidos", String(product.sold_count)],
  ];
  return (
    <aside className="glass h-full rounded-2xl p-5">
      <div className="flex items-center gap-3">
        <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-panel-2/70">
          {img ? (
            <img src={img} alt={product.name} className="size-full object-contain p-1" />
          ) : (
            <span className="text-3xl">{categoryEmoji(product.category)}</span>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="truncate font-display text-lg font-bold uppercase">{product.name}</h3>
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {product.description || "Sin descripción"}
          </p>
        </div>
      </div>

      {promo ? (
        <p
          className="num mt-4 rounded-xl px-3 py-2 text-sm font-bold"
          style={{
            color: "var(--promo)",
            background: "color-mix(in oklab, var(--promo) 14%, transparent)",
          }}
        >
          Promoción activa · {formatPrice(Number(promo.promo_price))}
        </p>
      ) : null}

      <dl className="mt-4 space-y-2 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="num font-semibold">{v}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
