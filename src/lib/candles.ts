export type Candle = {
  time: number; // unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type ChartType = "candlestick" | "line" | "area" | "bars" | "heikin" | "baseline";

export const CHART_TYPES: { value: ChartType; label: string }[] = [
  { value: "candlestick", label: "Candlestick" },
  { value: "line", label: "Línea" },
  { value: "area", label: "Área" },
  { value: "bars", label: "Barras OHLC" },
  { value: "heikin", label: "Heikin Ashi" },
  { value: "baseline", label: "Baseline" },
];

export const INTERVALS = [1, 3, 5, 10] as const;

export const ANIMATION_SPEEDS: { value: string; label: string }[] = [
  { value: "smooth", label: "Suave" },
  { value: "normal", label: "Normal" },
  { value: "fast", label: "Rápida" },
];

export type ChartConfig = {
  chart_type: ChartType;
  chart_interval_seconds: number;
  animation_speed: string;
  color_up: string;
  color_down: string;
  color_bg: string;
  color_grid: string;
};

export const DEFAULT_CHART_CONFIG: ChartConfig = {
  chart_type: "candlestick",
  chart_interval_seconds: 3,
  animation_speed: "normal",
  color_up: "#00E676",
  color_down: "#FF4D6D",
  color_bg: "#050816",
  color_grid: "#1B2436",
};

/** Converts standard candles to Heikin Ashi candles. */
export function toHeikinAshi(candles: Candle[]): Candle[] {
  const out: Candle[] = [];
  for (let i = 0; i < candles.length; i += 1) {
    const c = candles[i]!;
    const close = (c.open + c.high + c.low + c.close) / 4;
    const prev = out[i - 1];
    const open = prev ? (prev.open + prev.close) / 2 : (c.open + c.close) / 2;
    out.push({
      time: c.time,
      open,
      close,
      high: Math.max(c.high, open, close),
      low: Math.min(c.low, open, close),
      volume: c.volume,
    });
  }
  return out;
}

/** Simulates the next tick for a product, bounded by its min/max price. */
export function simulateTick(
  last: Candle,
  bounds: { min: number; max: number },
  volatility = 3,
): Candle {
  const drift = (Math.random() - 0.5) * (volatility / 100) * last.close;
  const pullback = ((bounds.min + bounds.max) / 2 - last.close) * 0.03;
  const close = Math.max(bounds.min, Math.min(bounds.max, last.close + drift + pullback));
  return {
    time: last.time + 3,
    open: last.close,
    close,
    high: Math.max(last.close, close) * (1 + Math.random() * 0.004),
    low: Math.min(last.close, close) * (1 - Math.random() * 0.004),
    volume: Math.round(Math.random() * 40 + 5),
  };
}
