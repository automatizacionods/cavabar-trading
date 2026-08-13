import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useAdminData";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/configuracion")({
  head: () => ({
    meta: [
      { title: "Configuración | CavaBar Trading" },
      { name: "description", content: "Ajusta el nombre del bar, la volatilidad del mercado y el ritmo de actualización de precios." },
      { property: "og:title", content: "Configuración | CavaBar Trading" },
      { property: "og:description", content: "Parámetros del motor de precios." },
    ],
  }),
  component: ConfiguracionPage,
});

function ConfiguracionPage() {
  const settings = useSettings();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [barName, setBarName] = useState("CavaBar");
  const [autoPricing, setAutoPricing] = useState(true);
  const [volatility, setVolatility] = useState(3);
  const [tick, setTick] = useState(15);
  const [publicView, setPublicView] = useState("trading");

  useEffect(() => {
    if (!settings.data) return;
    setBarName(settings.data.bar_name);
    setAutoPricing(settings.data.auto_pricing);
    setVolatility(Number(settings.data.volatility));
    setTick(settings.data.tick_seconds);
    setPublicView(settings.data.public_view ?? "trading");
  }, [settings.data]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("settings")
        .update({
          bar_name: barName,
          auto_pricing: autoPricing,
          volatility,
          tick_seconds: tick,
          public_view: publicView,
        })
        .eq("id", 1);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Configuración guardada");
      void queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold">Configuración</h1>
        <p className="text-sm text-muted-foreground">
          Ajusta cómo se comporta el mercado de tu bar.
        </p>
      </div>

      <div className="glass space-y-4 rounded-2xl p-5">
        <div className="space-y-1.5">
          <Label>Nombre del bar</Label>
          <Input value={barName} onChange={(e) => setBarName(e.target.value)} />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border p-3">
          <div>
            <Label>Motor de precios automático</Label>
            <p className="text-xs text-muted-foreground">
              Los precios se mueven solos según la demanda dentro del rango de cada producto.
            </p>
          </div>
          <Switch checked={autoPricing} onCheckedChange={setAutoPricing} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Volatilidad (%)</Label>
            <Input
              type="number"
              step="0.5"
              value={volatility}
              onChange={(e) => setVolatility(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Intervalo de actualización (seg)</Label>
            <Input type="number" value={tick} onChange={(e) => setTick(Number(e.target.value))} />
          </div>
        </div>

        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          Guardar cambios
        </Button>
      </div>

      <div className="glass space-y-3 rounded-2xl p-5">
        <div>
          <Label>Pantalla pública activa</Label>
          <p className="text-xs text-muted-foreground">
            Elige qué ve el cliente. Las pantallas se redirigen solas al modo seleccionado.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { v: "trading", t: "Mercado de barra en vivo", d: "Gráfico de velas, watchlist y promociones." },
            { v: "tv", t: "Modo TV", d: "Productos con fotos y precios en rotación." },
          ].map((o) => (
            <button
              key={o.v}
              type="button"
              onClick={() => setPublicView(o.v)}
              className={`rounded-xl border p-3 text-left transition-colors ${
                publicView === o.v
                  ? "border-primary bg-primary/10"
                  : "border-border hover:bg-muted/40"
              }`}
            >
              <p className="text-sm font-semibold">{o.t}</p>
              <p className="mt-1 text-xs text-muted-foreground">{o.d}</p>
            </button>
          ))}
        </div>
        <Button onClick={() => save.mutate()} disabled={save.isPending} variant="secondary">
          Aplicar pantalla
        </Button>
      </div>

      <div className="glass rounded-2xl p-5 text-sm">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Sesión</p>
        <p className="mt-1">{user?.email ?? "—"}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          La primera cuenta registrada queda como administradora del bar.
        </p>
      </div>
    </div>
  );
}
