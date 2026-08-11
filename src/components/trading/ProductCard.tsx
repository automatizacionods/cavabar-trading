import { motion } from "motion/react";
import { ArrowDownRight, ArrowUpRight, Flame, Rocket, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Sparkline } from "@/components/trading/Sparkline";
import { categoryEmoji, productImage } from "@/lib/product-images";
import { changePct, formatClock, formatPrice, type Product, type Promotion } from "@/lib/trading";
import { cn } from "@/lib/utils";

type Props = {
  product: Product;
  history: number[];
  promo?: Promotion | null;
  msLeft?: number;
  large?: boolean;
};

export function ProductCard({ product, history, promo, msLeft = 0, large = false }: Props) {
  const pct = changePct(product);
  const isUp = pct >= 0;
  const price = promo ? Number(promo.promo_price) : Number(product.current_price);
  const tone: "up" | "down" | "promo" = promo ? "promo" : isUp ? "up" : "down";

  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  const prev = useRef(price);
  useEffect(() => {
    if (prev.current === price) return undefined;
    setFlash(price > prev.current ? "up" : "down");
    prev.current = price;
    const id = window.setTimeout(() => setFlash(null), 1100);
    return () => window.clearTimeout(id);
  }, [price]);

  const img = productImage(product.name, product.image_url);
  const hot = product.sold_count > 100;
  const trending = pct > 5;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className={cn(
        "glass relative overflow-hidden rounded-2xl p-4",
        large && "p-6",
        promo && "promo-pulse",
      )}
      style={{
        boxShadow: promo
          ? "var(--shadow-glow-promo)"
          : isUp
            ? "var(--shadow-glow-up)"
            : "var(--shadow-glow-down)",
      }}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0",
          flash === "up" && "flash-up",
          flash === "down" && "flash-down",
        )}
      />

      <div className="flex items-start gap-3">
        <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-panel-2/70">
          {img ? (
            <img
              src={img}
              alt={product.name}
              loading="lazy"
              width={512}
              height={512}
              className="size-full object-contain p-1"
            />
          ) : (
            <span className={cn("text-2xl", large && "text-3xl")}>
              {categoryEmoji(product.category)}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3
              className={cn(
                "truncate font-display font-bold uppercase tracking-wide",
                large ? "text-2xl" : "text-base",
              )}
            >
              {product.name}
            </h3>
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {product.category} · stock {product.stock}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          {promo ? (
            <Badge tone="promo">
              <Zap className="size-3" /> SALE
            </Badge>
          ) : null}
          {hot ? (
            <Badge tone="down">
              <Flame className="size-3" /> HOT
            </Badge>
          ) : null}
          {trending ? (
            <Badge tone="up">
              <Rocket className="size-3" /> TRENDING
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          {promo ? (
            <span className="num block text-xs text-muted-foreground line-through">
              {formatPrice(Number(promo.original_price))}
            </span>
          ) : null}
          <motion.span
            key={price}
            initial={{ scale: 0.94, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn("num block font-bold leading-none", large ? "text-5xl" : "text-3xl")}
            style={{ color: promo ? "var(--promo)" : undefined }}
          >
            {formatPrice(price)}
          </motion.span>
        </div>

        <div className="text-right">
          <span
            className={cn(
              "num inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold",
              isUp ? "text-up" : "text-down",
            )}
            style={{
              background: `color-mix(in oklab, ${isUp ? "var(--up)" : "var(--down)"} 14%, transparent)`,
            }}
          >
            {isUp ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
            {isUp ? "+" : ""}
            {pct.toFixed(1)}%
          </span>
          {promo && msLeft > 0 ? (
            <div
              className="num mt-1 text-sm font-bold"
              style={{ color: msLeft <= 60_000 ? "var(--down)" : "var(--promo)" }}
            >
              ⏱️ {formatClock(msLeft)}
            </div>
          ) : null}
        </div>
      </div>

      <Sparkline
        data={history}
        tone={tone}
        className={cn("mt-3 w-full", large ? "h-16" : "h-9")}
      />
    </motion.article>
  );
}

function Badge({ tone, children }: { tone: "up" | "down" | "promo"; children: React.ReactNode }) {
  const color = tone === "up" ? "var(--up)" : tone === "down" ? "var(--down)" : "var(--promo)";
  return (
    <span
      className="num inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-widest"
      style={{
        color,
        background: `color-mix(in oklab, ${color} 16%, transparent)`,
        border: `1px solid color-mix(in oklab, ${color} 40%, transparent)`,
      }}
    >
      {children}
    </span>
  );
}
