import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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
import { supabase } from "@/integrations/supabase/client";
import { useChartConfig } from "@/hooks/useCandles";
import { useProducts } from "@/hooks/useTradingData";
import { useCandles } from "@/hooks/useCandles";
import { MainChart } from "@/components/trading/MainChart";
import {
  ANIMATION_SPEEDS,
  CHART_TYPES,
  INTERVALS,
  type ChartConfig,
  type ChartType,
} from "@/lib/candles";

export const Route = createFileRoute("/_authenticated/admin/graficos")({
  head: () => ({
    meta: [
      { title: "Configuración de gráficos | CavaBar Trading" },
      {
        name: "description",
        content:
          "Define el tipo de gráfico por defecto, el intervalo de actualización y los colores de las velas del tablero público.",
      },
      { property: "og:title", content: "Configuración de gráficos | CavaBar Trading" },
      { property: "og:description", content: "Apariencia y ritmo del gráfico bursátil." },
    ],
  }),
  component: GraficosPage,
});

function GraficosPage() {
  const saved = useChartConfig();
  const queryClient = useQueryClient();
  const products = useProducts();
  const [draft, setDraft] = useState<ChartConfig>(saved);

  useEffect(() => setDraft(saved), [saved.chart_type, saved.color_up, saved.color_down, saved.color_bg, saved.color_grid, saved.chart_interval_seconds, saved.animation_speed]); // eslint-disable-line react-hooks/exhaustive-deps

  const preview = products.data?.[0] ?? null;
  const candles = useCandles(preview?.id ?? null);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("settings").update(draft as never).eq("id", 1);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Configuración de gráficos guardada");
      void queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold">Gráficos</h1>
        <p className="text-sm text-muted-foreground">
          Controla cómo se ve y se mueve el gráfico principal del tablero público.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass space-y-4 rounded-2xl p-5">
          <div className="space-y-1.5">
            <Label>Tipo de gráfico por defecto</Label>
            <Select
              value={draft.chart_type}
              onValueChange={(v) => setDraft({ ...draft, chart_type: v as ChartType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHART_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Intervalo de actualización</Label>
            <Select
              value={String(draft.chart_interval_seconds)}
              onValueChange={(v) => setDraft({ ...draft, chart_interval_seconds: Number(v) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTERVALS.map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    {s} s
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Velocidad de animación</Label>
            <Select
              value={draft.animation_speed}
              onValueChange={(v) => setDraft({ ...draft, animation_speed: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ANIMATION_SPEEDS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <ColorField
              label="Color alcista"
              value={draft.color_up}
              onChange={(v) => setDraft({ ...draft, color_up: v })}
            />
            <ColorField
              label="Color bajista"
              value={draft.color_down}
              onChange={(v) => setDraft({ ...draft, color_down: v })}
            />
            <ColorField
              label="Fondo"
              value={draft.color_bg}
              onChange={(v) => setDraft({ ...draft, color_bg: v })}
            />
            <ColorField
              label="Cuadrícula"
              value={draft.color_grid}
              onChange={(v) => setDraft({ ...draft, color_grid: v })}
            />
          </div>

          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            Guardar configuración
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Vista previa {preview ? `· ${preview.name}` : ""}
          </p>
          <div style={{ background: draft.color_bg, borderRadius: 18 }}>
            <MainChart
              key={`${draft.color_up}-${draft.color_down}-${draft.color_grid}-${draft.chart_type}`}
              candles={candles.data ?? []}
              config={draft}
              bounds={{
                min: Number(preview?.min_price ?? 0),
                max: Number(preview?.max_price ?? 1),
              }}
              height={340}
              compact
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="size-9 cursor-pointer rounded-lg border border-border bg-transparent"
          aria-label={label}
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono" />
      </div>
    </div>
  );
}
