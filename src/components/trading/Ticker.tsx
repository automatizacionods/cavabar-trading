import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { changePct, formatPrice, type Product } from "@/lib/trading";

export function Ticker({ products }: { products: Product[] }) {
  if (products.length === 0) return null;
  const row = [...products, ...products];

  return (
    <div className="relative overflow-hidden border-y border-border bg-panel/60 py-2 backdrop-blur">
      <div className="ticker-track flex w-max gap-8 pr-8">
        {row.map((p, i) => {
          const pct = changePct(p);
          const up = pct >= 0;
          return (
            <span key={`${p.id}-${i}`} className="num flex items-center gap-2 text-sm">
              <span className="font-semibold uppercase tracking-wider text-muted-foreground">
                {p.name}
              </span>
              <span className="font-bold">{formatPrice(Number(p.current_price))}</span>
              <span
                className="inline-flex items-center gap-0.5 font-semibold"
                style={{ color: up ? "var(--up)" : "var(--down)" }}
              >
                {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                {up ? "+" : ""}
                {pct.toFixed(1)}%
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
