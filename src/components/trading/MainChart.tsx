import { useEffect, useRef, useState } from "react";

import {
  CHART_TYPES,
  simulateTick,
  toHeikinAshi,
  type Candle,
  type ChartConfig,
  type ChartType,
} from "@/lib/candles";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  candles: Candle[];
  config: ChartConfig;
  bounds: { min: number; max: number };
  volatility?: number;
  height?: number;
  onPrice?: (price: number) => void;
  compact?: boolean;
};

export function MainChart({
  candles,
  config,
  bounds,
  volatility = 3,
  height = 420,
  onPrice,
  compact = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const seriesRef = useRef<any>(null);
  const chartRef = useRef<any>(null);
  const dataRef = useRef<Candle[]>([]);
  const onPriceRef = useRef(onPrice);
  onPriceRef.current = onPrice;

  const [type, setType] = useState<ChartType>(config.chart_type);
  useEffect(() => setType(config.chart_type), [config.chart_type]);

  // Create / recreate chart when type or theme changes.
  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};

    void (async () => {
      const lc = await import("lightweight-charts");
      const el = containerRef.current;
      if (disposed || !el) return;

      const chart = lc.createChart(el, {
        height,
        layout: {
          background: { color: "transparent" },
          textColor: "#94A3B8",
          fontFamily: "inherit",
          attributionLogo: false,
        },
        grid: {
          vertLines: { color: config.color_grid },
          horzLines: { color: config.color_grid },
        },
        rightPriceScale: { borderColor: config.color_grid },
        timeScale: { borderColor: config.color_grid, timeVisible: true, secondsVisible: false },
        crosshair: { mode: lc.CrosshairMode.Normal },
        localization: {
          locale: "es-CO",
          priceFormatter: (p: number) =>
            new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(p),
        },
      });

      const upDown = { upColor: config.color_up, downColor: config.color_down };
      let series: any;
      if (type === "line") {
        series = chart.addSeries(lc.LineSeries, { color: config.color_up, lineWidth: 2 });
      } else if (type === "area") {
        series = chart.addSeries(lc.AreaSeries, {
          lineColor: config.color_up,
          topColor: `${config.color_up}55`,
          bottomColor: `${config.color_up}05`,
          lineWidth: 2,
        });
      } else if (type === "baseline") {
        series = chart.addSeries(lc.BaselineSeries, {
          baseValue: { type: "price", price: (bounds.min + bounds.max) / 2 },
          topLineColor: config.color_up,
          topFillColor1: `${config.color_up}55`,
          topFillColor2: `${config.color_up}05`,
          bottomLineColor: config.color_down,
          bottomFillColor1: `${config.color_down}05`,
          bottomFillColor2: `${config.color_down}55`,
        });
      } else if (type === "bars") {
        series = chart.addSeries(lc.BarSeries, { ...upDown, thinBars: false });
      } else {
        series = chart.addSeries(lc.CandlestickSeries, {
          ...upDown,
          borderUpColor: config.color_up,
          borderDownColor: config.color_down,
          wickUpColor: config.color_up,
          wickDownColor: config.color_down,
        });
      }

      chartRef.current = chart;
      seriesRef.current = series;
      (window as any).__cavaDebug = { n: dataRef.current.length, first: dataRef.current[0], last: dataRef.current.at(-1) };
      applyData(series, dataRef.current, type);
      chart.timeScale().fitContent();

      const ro = new ResizeObserver(() => chart.applyOptions({ width: el.clientWidth }));
      ro.observe(el);
      chart.applyOptions({ width: el.clientWidth });

      cleanup = () => {
        ro.disconnect();
        chart.remove();
        chartRef.current = null;
        seriesRef.current = null;
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, config.color_up, config.color_down, config.color_grid, height]);

  // Load candle history for the selected product.
  useEffect(() => {
    dataRef.current = candles.slice();
    if (seriesRef.current) {
      applyData(seriesRef.current, dataRef.current, type);
      chartRef.current?.timeScale().fitContent();
    }
  }, [candles, type]);

  // Live ticks.
  useEffect(() => {
    const ms = Math.max(1, config.chart_interval_seconds) * 1000;
    const id = window.setInterval(() => {
      const last = dataRef.current[dataRef.current.length - 1];
      if (!last) return;
      const next = simulateTick(last, bounds, volatility);
      dataRef.current = [...dataRef.current, next].slice(-400);
      if (seriesRef.current) applyData(seriesRef.current, dataRef.current, type);
      chartRef.current?.timeScale().scrollToRealTime();
      onPriceRef.current?.(next.close);
    }, ms);
    return () => window.clearInterval(id);
  }, [config.chart_interval_seconds, bounds, volatility, type]);

  return (
    <div className="glass relative overflow-hidden rounded-2xl p-3 sm:p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
          Gráfico en vivo
        </span>
        {!compact ? (
          <Select value={type} onValueChange={(v) => setType(v as ChartType)}>
            <SelectTrigger className="h-8 w-[170px] text-xs">
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
        ) : null}
      </div>
      <div ref={containerRef} className="w-full" style={{ height }} />
    </div>
  );
}

function applyData(series: any, candles: Candle[], type: ChartType) {
  try { (window as any).__cavaApply = { n: candles.length, sample: candles.slice(-2) }; } catch { /* noop */ }
  const data = type === "heikin" ? toHeikinAshi(candles) : candles;
  if (type === "line" || type === "area" || type === "baseline") {
    series.setData(data.map((c) => ({ time: c.time as any, value: c.close })));
  } else {
    series.setData(
      data.map((c) => ({
        time: c.time as any,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
    );
  }
}
