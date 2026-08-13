import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDownRight, ArrowUpRight, Maximize2 } from "lucide-react";
import { useEffect, useState } from "react";

import { CircularCountdown } from "@/components/trading/CircularCountdown";
import { Sparkline } from "@/components/trading/Sparkline";
import { useEnforcePublicView } from "@/hooks/useAdminData";
import { useCountdown } from "@/hooks/useCountdown";
import { categoryEmoji, productImage } from "@/lib/product-images";
import { PROMO_LABEL, changePct, formatPrice } from "@/lib/trading";
import { useBoard } from "@/routes/trading";

export const Route = createFileRoute("/tv")({
  head: () => ({
    meta: [
      { title: "Modo TV | CavaBar Trading" },
      {
        name: "description",
        content:
          "Pantalla para televisores del bar: rotación automática de productos destacados con precios en vivo y cuenta regresiva de ofertas.",
      },
      { property: "og:title", content: "Modo TV | CavaBar Trading" },
      {
        property: "og:description",
        content: "Tablero a pantalla completa para las TV del bar.",
      },
    ],
  }),
  component: TvPage,
});

function TvPage() {
  const { products, history, livePromos } = useBoard();
  useEnforcePublicView("tv");
  const list = products.data ?? [];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (list.length === 0) return undefined;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % list.length), 7000);
    return () => window.clearInterval(id);
  }, [list.length]);

  const hero = list[index % Math.max(1, list.length)];
  const promo = hero ? (livePromos.get(hero.id) ?? null) : null;
  const msLeft = useCountdown(promo?.ends_at ?? null);
  const totalMs = promo
    ? new Date(promo.ends_at).getTime() - new Date(promo.starts_at).getTime()
    : 0;

  const side = list.filter((_, i) => i !== index % Math.max(1, list.length)).slice(0, 6);

  return (
    <div className="grid-lines relative min-h-screen overflow-hidden">
      <button
        onClick={() => void document.documentElement.requestFullscreen().catch(() => {})}
        className="glass absolute right-6 top-6 z-20 flex items-center gap-2 rounded-xl px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
      >
        <Maximize2 className="size-4" /> Pantalla completa
      </button>

      <div className="mx-auto grid min-h-screen max-w-[1920px] grid-cols-1 gap-8 p-8 lg:grid-cols-[1.4fr_1fr]">
        <section className="flex flex-col justify-center">
          <div className="flex items-center gap-3">
            <span
              className="size-3 animate-pulse rounded-full"
              style={{ background: "var(--up)" }}
            />
            <span className="num text-lg tracking-[0.4em] text-muted-foreground">
              CAVABAR TRADING · EN VIVO
            </span>
          </div>

          <AnimatePresence mode="wait">
            {hero ? (
              <motion.div
                key={hero.id}
                initial={{ opacity: 0, y: 40, filter: "blur(12px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -40, filter: "blur(12px)" }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="mt-6"
              >
                <div className="flex items-center gap-8">
                  <div className="grid size-44 shrink-0 place-items-center overflow-hidden rounded-3xl bg-panel-2/60 xl:size-56">
                    {productImage(hero.name, hero.image_url) ? (
                      <img
                        src={productImage(hero.name, hero.image_url)!}
                        alt={hero.name}
                        width={512}
                        height={512}
                        className="size-full object-contain p-3"
                      />
                    ) : (
                      <span className="text-7xl">{categoryEmoji(hero.category)}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    {promo ? (
                      <p
                        className="num text-2xl font-bold tracking-[0.3em]"
                        style={{ color: "var(--promo)" }}
                      >
                        🔥 {PROMO_LABEL[promo.promo_type] ?? "PROMO"}
                      </p>
                    ) : null}
                    <h1 className="font-display text-6xl font-extrabold uppercase leading-none tracking-tight xl:text-8xl">
                      {hero.name}
                    </h1>
                    <p className="mt-2 text-xl text-muted-foreground xl:text-2xl">
                      {hero.description}
                    </p>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap items-end gap-10">
                  <div>
                    <p className="num text-8xl font-extrabold leading-none xl:text-9xl"
                      style={{ color: promo ? "var(--promo)" : undefined }}
                    >
                      {formatPrice(promo ? Number(promo.promo_price) : Number(hero.current_price))}
                    </p>
                    <p
                      className="num mt-3 flex items-center gap-2 text-3xl font-bold"
                      style={{ color: changePct(hero) >= 0 ? "var(--up)" : "var(--down)" }}
                    >
                      {changePct(hero) >= 0 ? (
                        <ArrowUpRight className="size-8" />
                      ) : (
                        <ArrowDownRight className="size-8" />
                      )}
                      {changePct(hero) >= 0 ? "+" : ""}
                      {changePct(hero).toFixed(1)}%
                    </p>
                  </div>
                  {promo && msLeft > 0 ? (
                    <CircularCountdown msLeft={msLeft} totalMs={totalMs} size={190} />
                  ) : null}
                </div>

                <Sparkline
                  data={history.data?.get(hero.id) ?? [1, 1]}
                  tone={promo ? "promo" : changePct(hero) >= 0 ? "up" : "down"}
                  className="mt-8 h-28 w-full"
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </section>

        <section className="glass flex flex-col justify-center gap-3 rounded-3xl p-6">
          <p className="num text-sm tracking-[0.3em] text-muted-foreground">MERCADO</p>
          {side.map((p) => {
            const pct = changePct(p);
            const up = pct >= 0;
            const sale = livePromos.get(p.id);
            return (
              <motion.div
                layout
                key={p.id}
                className="flex items-center gap-4 border-b border-border pb-3 last:border-0"
              >
                <span className="text-3xl">{categoryEmoji(p.category)}</span>
                <span className="min-w-0 flex-1 truncate font-display text-2xl font-bold uppercase xl:text-3xl">
                  {p.name}
                </span>
                <span
                  className="num text-3xl font-bold xl:text-4xl"
                  style={{ color: sale ? "var(--promo)" : undefined }}
                >
                  {formatPrice(sale ? Number(sale.promo_price) : Number(p.current_price))}
                </span>
                <span
                  className="num flex w-28 justify-end gap-1 text-2xl font-semibold"
                  style={{ color: up ? "var(--up)" : "var(--down)" }}
                >
                  {up ? "▲" : "▼"} {Math.abs(pct).toFixed(1)}%
                </span>
              </motion.div>
            );
          })}
        </section>
      </div>
    </div>
  );
}
