import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Rocket, Square } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { CircularCountdown } from "@/components/trading/CircularCountdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCountdown } from "@/hooks/useCountdown";
import { useProducts, usePromotions } from "@/hooks/useTradingData";
import { supabase } from "@/integrations/supabase/client";
import {
  PROMO_LABEL,
  PROMO_TYPES,
  formatPrice,
  isPromoLive,
  promoPriceFor,
  type Promotion,
} from "@/lib/trading";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/promociones")({
  head: () => ({
    meta: [
      { title: "Promociones inteligentes | CavaBar Trading" },
      { name: "description", content: "Lanza flash sales y happy hours con cuenta regresiva en menos de 10 segundos." },
      { property: "og:title", content: "Promociones inteligentes | CavaBar Trading" },
      { property: "og:description", content: "Motor de ofertas con cronómetro en vivo." },
    ],
  }),
  component: PromocionesAdminPage,
});

const DURATIONS = [5, 10, 15, 30, 60];

function PromocionesAdminPage() {
  const products = useProducts(false);
  const promotions = usePromotions();
  const queryClient = useQueryClient();

  const [productId, setProductId] = useState<string>("");
  const [type, setType] = useState<string>("flash_sale");
  const [value, setValue] = useState<number>(25);
  const [minutes, setMinutes] = useState<number>(15);
  const [custom, setCustom] = useState<number>(20);
  const [useCustom, setUseCustom] = useState(false);

  const list = products.data ?? [];
  const selected = list.find((p) => p.id === productId) ?? null;
  const duration = useCustom ? custom : minutes;
  const preview = selected
    ? promoPriceFor(type, value, Number(selected.current_price), Number(selected.min_price))
    : 0;

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["promotions"] });

  const launch = useMutation({
    mutationFn: async () => {
      if (!selected) throw new Error("Selecciona un producto");
      const now = new Date();
      const ends = new Date(now.getTime() + duration * 60_000);
      const { error } = await supabase.from("promotions").insert({
        product_id: selected.id,
        promo_type: type,
        value,
        promo_price: preview,
        original_price: Number(selected.current_price),
        starts_at: now.toISOString(),
        ends_at: ends.toISOString(),
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("¡Oferta activada en el tablero!");
      void refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const stop = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("promotions")
        .update({ is_active: false, ends_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Promoción detenida");
      void refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const active = (promotions.data ?? []).filter((p) => isPromoLive(p));
  const history = (promotions.data ?? []).filter((p) => !isPromoLive(p)).slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold">Promociones inteligentes</h1>
        <p className="text-sm text-muted-foreground">
          Configura y lanza una oferta en segundos. Se refleja al instante en el tablero y las TV.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="glass space-y-4 rounded-2xl p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Producto</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un producto" />
                </SelectTrigger>
                <SelectContent>
                  {list.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} — {formatPrice(Number(p.current_price))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Tipo de promoción</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROMO_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{type === "fixed" ? "Descuento en pesos" : "Descuento %"}</Label>
              <Input
                type="number"
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Duración</Label>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setUseCustom(false);
                    setMinutes(m);
                  }}
                  className={cn(
                    "rounded-xl border border-border px-4 py-2 text-sm font-semibold transition-colors",
                    !useCustom && minutes === m
                      ? "bg-primary text-primary-foreground"
                      : "bg-panel/60 text-muted-foreground hover:text-foreground",
                  )}
                >
                  {m >= 60 ? "1 hora" : `${m} min`}
                </button>
              ))}
              <button
                onClick={() => setUseCustom(true)}
                className={cn(
                  "rounded-xl border border-border px-4 py-2 text-sm font-semibold transition-colors",
                  useCustom
                    ? "bg-primary text-primary-foreground"
                    : "bg-panel/60 text-muted-foreground hover:text-foreground",
                )}
              >
                Personalizado
              </button>
              {useCustom ? (
                <Input
                  type="number"
                  className="w-28"
                  value={custom}
                  onChange={(e) => setCustom(Number(e.target.value))}
                />
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border p-4">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Precio promocional
              </p>
              <p className="num text-3xl font-bold" style={{ color: "var(--promo)" }}>
                {selected ? formatPrice(preview) : "—"}
              </p>
              {selected ? (
                <p className="num text-xs text-muted-foreground line-through">
                  {formatPrice(Number(selected.current_price))} · {duration} min
                </p>
              ) : null}
            </div>
            <Button
              size="lg"
              onClick={() => launch.mutate()}
              disabled={!selected || launch.isPending}
            >
              <Rocket className="size-4" /> Activar oferta
            </Button>
          </div>
        </div>

        <div className="glass space-y-4 rounded-2xl p-5">
          <h2 className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Ofertas activas
          </h2>
          {active.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Ninguna oferta corriendo ahora.
            </p>
          ) : (
            active.map((p) => (
              <ActivePromoRow
                key={p.id}
                promo={p}
                name={list.find((x) => x.id === p.product_id)?.name ?? "Producto"}
                onStop={() => stop.mutate(p.id)}
              />
            ))
          )}
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <h2 className="font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Historial de promociones
        </h2>
        <div className="mt-3 divide-y divide-border">
          {history.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
              <span className="w-40 truncate font-semibold">
                {list.find((x) => x.id === p.product_id)?.name ?? "Producto"}
              </span>
              <span className="text-muted-foreground">{PROMO_LABEL[p.promo_type] ?? p.promo_type}</span>
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

function ActivePromoRow({
  promo,
  name,
  onStop,
}: {
  promo: Promotion;
  name: string;
  onStop: () => void;
}) {
  const msLeft = useCountdown(promo.ends_at);
  const totalMs = new Date(promo.ends_at).getTime() - new Date(promo.starts_at).getTime();

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border p-3">
      <CircularCountdown msLeft={msLeft} totalMs={totalMs} size={84} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-display font-bold uppercase">{name}</p>
        <p className="num text-sm" style={{ color: "var(--promo)" }}>
          {formatPrice(Number(promo.promo_price))}
        </p>
      </div>
      <Button variant="secondary" size="sm" onClick={onStop}>
        <Square className="size-3.5" /> Detener
      </Button>
    </div>
  );
}
