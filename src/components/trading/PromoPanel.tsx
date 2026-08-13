import { ArrowDown } from "lucide-react";

import { CircularCountdown } from "@/components/trading/CircularCountdown";
import { useCountdown } from "@/hooks/useCountdown";
import { categoryEmoji, productImage } from "@/lib/product-images";
import { PROMO_LABEL, formatPrice, type Product, type Promotion } from "@/lib/trading";

type Props = {
  promos: { promo: Promotion; product: Product | undefined }[];
};

export function PromoPanel({ promos }: Props) {
  return (
    <aside className="glass h-full rounded-2xl p-4">
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
        Promociones activas
      </p>

      {promos.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No hay promociones activas ahora mismo. En cualquier momento cae un flash sale ⚡
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {promos.map(({ promo, product }) => (
            <PromoRow key={promo.id} promo={promo} product={product} />
          ))}
        </div>
      )}
    </aside>
  );
}

function PromoRow({ promo, product }: { promo: Promotion; product: Product | undefined }) {
  const msLeft = useCountdown(promo.ends_at);
  const totalMs = new Date(promo.ends_at).getTime() - new Date(promo.starts_at).getTime();
  usePromoAlarm(msLeft, promo.id);
  if (msLeft <= 0) return null;

  const original = Number(promo.original_price);
  const price = Number(promo.promo_price);
  const drop = original > 0 ? ((price - original) / original) * 100 : 0;
  const img = product ? productImage(product.name, product.image_url) : null;

  return (
    <div
      className="promo-pulse flex items-center gap-3 rounded-2xl p-3"
      style={{
        background: "color-mix(in oklab, var(--promo) 10%, transparent)",
        border: "1px solid color-mix(in oklab, var(--promo) 35%, transparent)",
      }}
    >
      <div className="min-w-0 flex-1">
        <p className="num text-[10px] font-bold tracking-[0.2em]" style={{ color: "var(--promo)" }}>
          ⚡ {PROMO_LABEL[promo.promo_type] ?? "PROMO"}
        </p>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-panel-2/70">
            {img ? (
              <img src={img} alt={product?.name ?? ""} className="size-full object-contain p-0.5" />
            ) : (
              <span className="text-base">{categoryEmoji(product?.category ?? "")}</span>
            )}
          </span>
          <h3 className="truncate font-display text-base font-extrabold uppercase">
            {product?.name ?? "Producto"}
          </h3>
        </div>
        <p className="num mt-1 text-xl font-bold" style={{ color: "var(--promo)" }}>
          {formatPrice(price)}
        </p>
        <p className="num flex items-center gap-1.5 text-xs" style={{ color: "var(--down)" }}>
          <ArrowDown className="size-3.5" />
          {drop.toFixed(1)}%
          <span className="text-muted-foreground line-through">{formatPrice(original)}</span>
        </p>
      </div>
      <CircularCountdown msLeft={msLeft} totalMs={totalMs} size={78} />
    </div>
  );
}
