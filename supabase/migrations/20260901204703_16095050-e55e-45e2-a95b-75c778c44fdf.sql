-- Helper: superadmin check
CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'superadmin');
$$;

-- Helper: admin-or-superadmin check (management privileges)
CREATE OR REPLACE FUNCTION public.is_manager(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('superadmin', 'admin')
  );
$$;

REVOKE ALL ON FUNCTION public.is_superadmin(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_manager(uuid) FROM PUBLIC, anon, authenticated;

-- Bootstrap: superadmin for the owner account (now, and on future signup)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'superadmin'::public.app_role FROM auth.users WHERE lower(email) = 'automatizacion.ods@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF lower(NEW.email) = 'automatizacion.ods@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'superadmin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSIF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role IN ('superadmin','admin')) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'usuario')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;

-- user_roles policies
DROP POLICY IF EXISTS "admins manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "users read own roles" ON public.user_roles;

CREATE POLICY "roles read own" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "managers read roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.is_manager(auth.uid()));

CREATE POLICY "superadmin manages roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

-- Admins may only manage non-superadmin rows, and never a superadmin's row
CREATE POLICY "admin manages basic roles insert" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_manager(auth.uid()) AND role IN ('admin','usuario','staff')
    AND NOT public.is_superadmin(user_id)
  );
CREATE POLICY "admin manages basic roles update" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.is_manager(auth.uid()) AND role IN ('admin','usuario','staff') AND NOT public.is_superadmin(user_id))
  WITH CHECK (public.is_manager(auth.uid()) AND role IN ('admin','usuario','staff') AND NOT public.is_superadmin(user_id));
CREATE POLICY "admin manages basic roles delete" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.is_manager(auth.uid()) AND role IN ('admin','usuario','staff') AND NOT public.is_superadmin(user_id));

-- Existing app tables: managers (admin + superadmin) keep write access
DROP POLICY IF EXISTS "products admin write" ON public.products;
CREATE POLICY "products manager write" ON public.products
  FOR ALL TO authenticated USING (public.is_manager(auth.uid())) WITH CHECK (public.is_manager(auth.uid()));

DROP POLICY IF EXISTS "promotions admin write" ON public.promotions;
CREATE POLICY "promotions manager write" ON public.promotions
  FOR ALL TO authenticated USING (public.is_manager(auth.uid())) WITH CHECK (public.is_manager(auth.uid()));

DROP POLICY IF EXISTS "settings admin write" ON public.settings;
CREATE POLICY "settings manager write" ON public.settings
  FOR ALL TO authenticated USING (public.is_manager(auth.uid())) WITH CHECK (public.is_manager(auth.uid()));

DROP POLICY IF EXISTS "sales admin all" ON public.sales;
CREATE POLICY "sales manager all" ON public.sales
  FOR ALL TO authenticated USING (public.is_manager(auth.uid())) WITH CHECK (public.is_manager(auth.uid()));

DROP POLICY IF EXISTS "candles admin insert" ON public.candles;
CREATE POLICY "candles manager insert" ON public.candles
  FOR INSERT TO authenticated WITH CHECK (public.is_manager(auth.uid()));
DROP POLICY IF EXISTS "candles admin delete" ON public.candles;
CREATE POLICY "candles manager delete" ON public.candles
  FOR DELETE TO authenticated USING (public.is_manager(auth.uid()));

DROP POLICY IF EXISTS "history admin insert" ON public.price_history;
CREATE POLICY "history manager insert" ON public.price_history
  FOR INSERT TO authenticated WITH CHECK (public.is_manager(auth.uid()));