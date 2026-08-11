-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin','staff');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- first user becomes admin
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'staff');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created_role
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- PRODUCTS
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'cervezas',
  description text DEFAULT '',
  image_url text,
  base_price numeric(12,2) NOT NULL DEFAULT 0,
  min_price numeric(12,2) NOT NULL DEFAULT 0,
  max_price numeric(12,2) NOT NULL DEFAULT 0,
  current_price numeric(12,2) NOT NULL DEFAULT 0,
  previous_price numeric(12,2) NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  sold_count integer NOT NULL DEFAULT 0,
  views_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products public read" ON public.products FOR SELECT USING (true);
CREATE POLICY "products admin write" ON public.products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PRICE HISTORY
CREATE TABLE public.price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  price numeric(12,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX price_history_product_idx ON public.price_history (product_id, created_at DESC);
GRANT SELECT ON public.price_history TO anon;
GRANT SELECT, INSERT ON public.price_history TO authenticated;
GRANT ALL ON public.price_history TO service_role;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "history public read" ON public.price_history FOR SELECT USING (true);
CREATE POLICY "history admin insert" ON public.price_history FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- PROMOTIONS
CREATE TABLE public.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  promo_type text NOT NULL DEFAULT 'flash_sale',
  value numeric(12,2) NOT NULL DEFAULT 0,
  promo_price numeric(12,2) NOT NULL DEFAULT 0,
  original_price numeric(12,2) NOT NULL DEFAULT 0,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX promotions_active_idx ON public.promotions (is_active, ends_at DESC);
GRANT SELECT ON public.promotions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.promotions TO authenticated;
GRANT ALL ON public.promotions TO service_role;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "promotions public read" ON public.promotions FOR SELECT USING (true);
CREATE POLICY "promotions admin write" ON public.promotions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- SALES
CREATE TABLE public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sales_created_idx ON public.sales (created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO authenticated;
GRANT ALL ON public.sales TO service_role;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sales admin all" ON public.sales FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- SETTINGS
CREATE TABLE public.settings (
  id integer PRIMARY KEY DEFAULT 1,
  bar_name text NOT NULL DEFAULT 'CavaBar',
  currency text NOT NULL DEFAULT 'COP',
  auto_pricing boolean NOT NULL DEFAULT true,
  volatility numeric(5,2) NOT NULL DEFAULT 3.0,
  tick_seconds integer NOT NULL DEFAULT 15,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT settings_single_row CHECK (id = 1)
);
GRANT SELECT ON public.settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings public read" ON public.settings FOR SELECT USING (true);
CREATE POLICY "settings admin write" ON public.settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.settings (id) VALUES (1);

-- REALTIME
ALTER TABLE public.products REPLICA IDENTITY FULL;
ALTER TABLE public.promotions REPLICA IDENTITY FULL;
ALTER TABLE public.price_history REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.promotions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.price_history;

-- SEED PRODUCTS
INSERT INTO public.products (name, category, description, base_price, min_price, max_price, current_price, previous_price, stock, sold_count, views_count) VALUES
('Mojito','cocteles','Ron, hierbabuena y lima',18000,14000,24000,19200,18000,40,52,320),
('Corona Extra','cervezas','Cerveza clara 330ml',8000,6500,10500,9200,8180,120,140,510),
('Jack Daniels','licores','Whiskey Tennessee 750ml',22000,20000,30000,21500,23000,18,22,275),
('Aguardiente Antioqueno','licores','Botella 750ml',65000,55000,85000,68000,64000,25,31,410),
('Margarita','cocteles','Tequila, triple sec y limon',20000,16000,26000,17800,19500,35,44,298),
('Tequila Shot','shots','Jose Cuervo 1 oz',7000,5000,11000,6200,7100,200,180,362),
('Club Colombia Dorada','cervezas','Cerveza premium 330ml',9000,7000,12000,10100,9400,150,132,288),
('Gin Tonic','cocteles','Gin premium con tonica',24000,19000,32000,25600,24200,30,38,244),
('Old Fashioned','cocteles','Bourbon, angostura y azucar',26000,22000,34000,24800,26300,22,19,190),
('Baby Shot','shots','Shot de crema irlandesa',6000,4500,9000,5400,6100,180,205,331),
('Buchanans 12',  'licores','Whisky escoces 750ml',180000,150000,230000,192000,183000,8,6,158),
('Red Bull','promociones','Bebida energizante 250ml',10000,8000,14000,8800,10000,90,77,201);

-- SEED PRICE HISTORY (24 points per product)
INSERT INTO public.price_history (product_id, price, created_at)
SELECT p.id,
       ROUND(GREATEST(p.min_price, LEAST(p.max_price,
         p.base_price * (1 + 0.09 * sin(g::numeric / 2.4) + 0.05 * ((random() - 0.5)))))::numeric, 2),
       now() - ((24 - g) * interval '7 minutes')
FROM public.products p CROSS JOIN generate_series(1, 24) g;

-- ACTIVE FLASH SALE ON MOJITO
INSERT INTO public.promotions (product_id, promo_type, value, promo_price, original_price, starts_at, ends_at, is_active)
SELECT id, 'flash_sale', 25, ROUND(current_price * 0.75, 2), current_price, now(), now() + interval '15 minutes', true
FROM public.products WHERE name = 'Mojito';

-- SEED SALES FOR TODAY
INSERT INTO public.sales (product_id, quantity, unit_price, total, created_at)
SELECT p.id, q.qty, p.current_price, p.current_price * q.qty,
       date_trunc('day', now()) + (interval '1 hour' * (12 + (random() * 11)::int)) + (interval '1 minute' * (random()*59)::int)
FROM public.products p
CROSS JOIN LATERAL (SELECT (1 + (random()*4)::int) AS qty, generate_series(1, 6)) q;