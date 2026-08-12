import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { changePct, formatPrice, type Product, type Promotion } from "@/lib/trading";
import { cn } from "@/lib/utils";

type Props = {
  products: Product[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  promos: Map<string, Promotion>;
};

export function Watchlist({ products, selectedId, onSelect, promos }: Props) {
  return (
    <div className="glass overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between border-b border-border px-4 py-3 text-[11px] uppercase tracking-widest text-muted-foreground">
        <span>Watchlist</span>
        <span>Último / Var.</span>
      </div>
      <ul className="max-h-[520px] divide-y divide-border overflow-y-auto">
        {products.map((p) => {
          const promo = promos.get(p.id) ?? null;
          const pct = changePct(p);
          const up = pct >= 0;
          const price = promo ? Number(promo.promo_price) : Number(p.current_price);
          return (
            <li key={p.id}>
              <button
                onClick={() => onSelect(p.id)}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-accent/60",
                  selectedId === p.id && "bg-accent",
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold uppercase tracking-wide">
                    {p.name}
                  </span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {p.category}
                  </span>
                </span>
                <span className="text-right">
                  <span
                    className="num block text-sm font-bold"
                    style={{ color: promo ? "var(--promo)" : undefined }}
                  >
                    {formatPrice(price)}
                  </span>
                  <span
                    className={cn(
                      "num inline-flex items-center gap-0.5 text-xs font-semibold",
                      up ? "text-up" : "text-down",
                    )}
                  >
                    {up ? (
                      <ArrowUpRight className="size-3" />
                    ) : (
                      <ArrowDownRight className="size-3" />
                    )}
                    {up ? "+" : ""}
                    {pct.toFixed(1)}%
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
