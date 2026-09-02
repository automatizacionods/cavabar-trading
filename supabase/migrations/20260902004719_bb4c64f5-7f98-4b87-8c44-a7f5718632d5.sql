CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.is_superadmin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'superadmin');
$$;

CREATE OR REPLACE FUNCTION private.is_manager(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('superadmin','admin'));
$$;

REVOKE ALL ON FUNCTION private.is_superadmin(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_manager(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.is_superadmin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_manager(uuid) TO authenticated, service_role;

-- user_roles
DROP POLICY IF EXISTS "managers read roles" ON public.user_roles;
DROP POLICY IF EXISTS "superadmin manages roles" ON public.user_roles;
DROP POLICY IF EXISTS "admin manages basic roles insert" ON public.user_roles;
DROP POLICY IF EXISTS "admin manages basic roles update" ON public.user_roles;
DROP POLICY IF EXISTS "admin manages basic roles delete" ON public.user_roles;

CREATE POLICY "managers read roles" ON public.user_roles
  FOR SELECT TO authenticated USING (private.is_manager(auth.uid()));
CREATE POLICY "superadmin manages roles" ON public.user_roles
  FOR ALL TO authenticated USING (private.is_superadmin(auth.uid())) WITH CHECK (private.is_superadmin(auth.uid()));
CREATE POLICY "admin manages basic roles insert" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (private.is_manager(auth.uid()) AND role IN ('admin','usuario','staff') AND NOT private.is_superadmin(user_id));
CREATE POLICY "admin manages basic roles update" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (private.is_manager(auth.uid()) AND role IN ('admin','usuario','staff') AND NOT private.is_superadmin(user_id))
  WITH CHECK (private.is_manager(auth.uid()) AND role IN ('admin','usuario','staff') AND NOT private.is_superadmin(user_id));
CREATE POLICY "admin manages basic roles delete" ON public.user_roles
  FOR DELETE TO authenticated
  USING (private.is_manager(auth.uid()) AND role IN ('admin','usuario','staff') AND NOT private.is_superadmin(user_id));

-- app tables
DROP POLICY IF EXISTS "products manager write" ON public.products;
CREATE POLICY "products manager write" ON public.products
  FOR ALL TO authenticated USING (private.is_manager(auth.uid())) WITH CHECK (private.is_manager(auth.uid()));
DROP POLICY IF EXISTS "promotions manager write" ON public.promotions;
CREATE POLICY "promotions manager write" ON public.promotions
  FOR ALL TO authenticated USING (private.is_manager(auth.uid())) WITH CHECK (private.is_manager(auth.uid()));
DROP POLICY IF EXISTS "settings manager write" ON public.settings;
CREATE POLICY "settings manager write" ON public.settings
  FOR ALL TO authenticated USING (private.is_manager(auth.uid())) WITH CHECK (private.is_manager(auth.uid()));
DROP POLICY IF EXISTS "sales manager all" ON public.sales;
CREATE POLICY "sales manager all" ON public.sales
  FOR ALL TO authenticated USING (private.is_manager(auth.uid())) WITH CHECK (private.is_manager(auth.uid()));
DROP POLICY IF EXISTS "candles manager insert" ON public.candles;
CREATE POLICY "candles manager insert" ON public.candles
  FOR INSERT TO authenticated WITH CHECK (private.is_manager(auth.uid()));
DROP POLICY IF EXISTS "candles manager delete" ON public.candles;
CREATE POLICY "candles manager delete" ON public.candles
  FOR DELETE TO authenticated USING (private.is_manager(auth.uid()));
DROP POLICY IF EXISTS "history manager insert" ON public.price_history;
CREATE POLICY "history manager insert" ON public.price_history
  FOR INSERT TO authenticated WITH CHECK (private.is_manager(auth.uid()));

-- storage
DROP POLICY IF EXISTS "product images admin insert" ON storage.objects;
DROP POLICY IF EXISTS "product images admin update" ON storage.objects;
DROP POLICY IF EXISTS "product images admin delete" ON storage.objects;
CREATE POLICY "product images manager insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images' AND private.is_manager(auth.uid()));
CREATE POLICY "product images manager update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'product-images' AND private.is_manager(auth.uid()));
CREATE POLICY "product images manager delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'product-images' AND private.is_manager(auth.uid()));

DROP FUNCTION IF EXISTS public.is_manager(uuid);
DROP FUNCTION IF EXISTS public.is_superadmin(uuid);
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);