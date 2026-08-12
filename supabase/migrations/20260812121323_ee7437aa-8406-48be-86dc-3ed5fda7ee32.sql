CREATE TABLE public.candles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  open numeric NOT NULL,
  high numeric NOT NULL,
  low numeric NOT NULL,
  close numeric NOT NULL,
  volume integer NOT NULL DEFAULT 0,
  bucket_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX candles_product_time_idx ON public.candles (product_id, bucket_at);
GRANT SELECT ON public.candles TO anon;
GRANT SELECT, INSERT, DELETE ON public.candles TO authenticated;
GRANT ALL ON public.candles TO service_role;
ALTER TABLE public.candles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "candles public read" ON public.candles FOR SELECT USING (true);
CREATE POLICY "candles admin insert" ON public.candles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "candles admin delete" ON public.candles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

ALTER TABLE public.settings
  ADD COLUMN IF NOT EXISTS chart_type text NOT NULL DEFAULT 'candlestick',
  ADD COLUMN IF NOT EXISTS chart_interval_seconds integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS animation_speed text NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS color_up text NOT NULL DEFAULT '#00E676',
  ADD COLUMN IF NOT EXISTS color_down text NOT NULL DEFAULT '#FF4D6D',
  ADD COLUMN IF NOT EXISTS color_bg text NOT NULL DEFAULT '#050816',
  ADD COLUMN IF NOT EXISTS color_grid text NOT NULL DEFAULT '#1B2436';

INSERT INTO public.candles (product_id, open, high, low, close, volume, bucket_at)
SELECT p.id,
       o.open_v,
       GREATEST(o.open_v, o.close_v) * (1 + random() * 0.02),
       LEAST(o.open_v, o.close_v) * (1 - random() * 0.02),
       o.close_v,
       (random() * 40 + 5)::int,
       now() - (g.i * interval '3 minutes')
FROM public.products p
CROSS JOIN generate_series(90, 1, -1) AS g(i)
CROSS JOIN LATERAL (
  SELECT p.base_price * (1 + sin(g.i / 7.0) * 0.06 + (random() - 0.5) * 0.03) AS open_v,
         p.base_price * (1 + sin((g.i - 1) / 7.0) * 0.06 + (random() - 0.5) * 0.03) AS close_v
) AS o;