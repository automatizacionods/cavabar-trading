import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_CHART_CONFIG, type Candle, type ChartConfig } from "@/lib/candles";
import { useSettings } from "@/hooks/useAdminData";

type Row = {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  bucket_at: string;
};

export function useCandles(productId: string | null) {
  return useQuery({
    queryKey: ["candles", productId],
    enabled: Boolean(productId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("candles")
        .select("open, high, low, close, volume, bucket_at")
        .eq("product_id", productId!)
        .order("bucket_at", { ascending: true })
        .limit(240);
      if (error) throw error;
      const seen = new Set<number>();
      const out: Candle[] = [];
      for (const r of (data ?? []) as unknown as Row[]) {
        const time = Math.floor(new Date(r.bucket_at).getTime() / 1000);
        if (seen.has(time)) continue;
        seen.add(time);
        out.push({
          time,
          open: Number(r.open),
          high: Number(r.high),
          low: Number(r.low),
          close: Number(r.close),
          volume: Number(r.volume),
        });
      }
      return out;
    },
  });
}

export function useChartConfig(): ChartConfig {
  const settings = useSettings();
  const s = settings.data as unknown as Partial<ChartConfig> | null | undefined;
  return { ...DEFAULT_CHART_CONFIG, ...(s ?? {}) };
}
