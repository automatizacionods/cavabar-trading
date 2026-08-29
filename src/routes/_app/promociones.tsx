import { createFileRoute } from "@tanstack/react-router";

import { CircularCountdown } from "@/components/trading/CircularCountdown";
import { ProductCard } from "@/components/trading/ProductCard";
import { PublicNav } from "@/components/trading/PublicNav";
import { useCountdown } from "@/hooks/useCountdown";
import { PROMO_LABEL, formatPrice, isPromoLive, type Promotion } from "@/lib/trading";
import { useBoard } from "@/routes/_app/trading";

   export const Route = createFileRoute("/_app/promociones")({
  head: () => ({
    meta: [
      { title: "Promociones activas | CavaBar Trading" },
      {
        name: "description",
        content:
          "Flash sales, happy hours y descuentos del bar con cuenta regresiva en vivo. Aprovecha antes de que se acabe el tiempo.",
      },
      { property: "og:title", content: "Promociones activas | CavaBar Trading" },
      {
        property: "og:description",
        content: "Ofertas relámpago del bar con cronómetro en vivo.",
      },
    ],
  }),
  component: PromocionesPage,
});

function PromocionesPage() {
  const { products, history, promotions, livePromos } = useBoard();
  const list = products.data ?? [];
  const active = list.filter((p) => livePromos.has(p.id));
  const past = (promotions.data ?? []).filter((p) => !isPromoLive(p)).slice(0, 8);

  return (
    <div className="min-h-screen">
      <PublicNav />
      <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Promociones inteligentes
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ofertas con tiempo limitado. Cuando el cronómetro llega a cero, el precio vuelve a subir.
        </p>

        {active.length === 0 ? (
          <div className="glass mt-8 rounded-2xl p-10 text-center">
            <p className="text-lg font-semibold">No hay promociones activas ahora mismo</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Quédate atento al tablero: en cualquier momento cae un flash sale.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {active.map((p) => (
              <PromoBlock key={p.id} promo={livePromos.get(p.id)!} name={p.name}>
                <ProductCard
                  product={p}
                  history={history.data?.get(p.id) ?? [Number(p.current_price)]}
                  promo={livePromos.get(p.id)!}
                />
              </PromoBlock>
            ))}
          </div>
        )}

        {past.length > 0 ? (
          <section className="mt-12">
            <h2 className="font-display text-xl font-bold">Historial reciente</h2>
            <div className="glass mt-4 divide-y divide-border overflow-hidden rounded-2xl">
              {past.map((p) => {
                const product = list.find((x) => x.id === p.product_id);
                return (
                  <div key={p.id} className="flex items-center gap-4 px-4 py-3 text-sm">
                    <span className="w-32 shrink-0 truncate font-semibold">
                      {product?.name ?? "Producto"}
                    </span>
                    <span className="num text-muted-foreground">
                      {PROMO_LABEL[p.promo_type] ?? p.promo_type}
                    </span>
                    <span className="num ml-auto" style={{ color: "var(--promo)" }}>
                      {formatPrice(Number(p.promo_price))}
                    </span>
                    <span className="num hidden text-xs text-muted-foreground sm:block">
                      {new Date(p.ends_at).toLocaleString("es-CO")}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}

function PromoBlock({
  promo,
  name,
  children,
}: {
  promo: Promotion;
  name: string;
  children: React.ReactNode;
}) {
  const msLeft = useCountdown(promo.ends_at);
  const totalMs = new Date(promo.ends_at).getTime() - new Date(promo.starts_at).getTime();

  return (
    <div className="glass flex flex-col gap-4 rounded-3xl p-5 sm:flex-row sm:items-center">
      <div className="flex-1">{children}</div>
      <div className="flex flex-col items-center gap-2">
        <CircularCountdown msLeft={msLeft} totalMs={totalMs} size={128} />
        <p className="num text-[11px] uppercase tracking-widest text-muted-foreground">
          {name} · {PROMO_LABEL[promo.promo_type] ?? "PROMO"}
        </p>
      </div>
    </div>
  );
}
