import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Activity, KeyRound, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Acceso administrador | CavaBar Trading" },
      {
        name: "description",
        content: "Ingresa al panel de administración de CavaBar Trading para gestionar productos y promociones.",
      },
      { property: "og:title", content: "Acceso administrador | CavaBar Trading" },
      { property: "og:description", content: "Panel de control del bar." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup" | "recover">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: "/admin/dashboard" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "recover") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/admin/login`,
        });
        if (error) throw error;
        toast.success("Te enviamos un correo para restablecer la contraseña");
        setMode("login");
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/admin/dashboard` },
        });
        if (error) throw error;
        toast.success("Cuenta creada. Ya puedes entrar.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        void navigate({ to: "/admin/dashboard" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No fue posible completar la acción");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("No se pudo iniciar sesión con Google");
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/admin/dashboard" });
  };

  return (
    <div className="grid-lines flex min-h-screen items-center justify-center px-4">
      <div className="glass w-full max-w-md rounded-3xl p-8">
        <div className="flex items-center gap-2">
          <span
            className="grid size-10 place-items-center rounded-xl"
            style={{ background: "color-mix(in oklab, var(--primary) 22%, transparent)" }}
          >
            <Activity className="size-5 text-primary" />
          </span>
          <span className="font-display text-xl font-extrabold">
            CavaBar<span className="text-primary"> Trading</span>
          </span>
        </div>

        <h1 className="mt-6 font-display text-2xl font-bold">
          {mode === "recover"
            ? "Recuperar contraseña"
            : mode === "signup"
              ? "Crear cuenta de administrador"
              : "Panel de administración"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "recover"
            ? "Te enviaremos un enlace a tu correo."
            : "Gestiona precios, stock y promociones del bar."}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Correo</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@cavabar.co"
            />
          </div>
          {mode !== "recover" ? (
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          ) : null}

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
            {mode === "recover" ? "Enviar enlace" : mode === "signup" ? "Crear cuenta" : "Entrar"}
          </Button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> o <span className="h-px flex-1 bg-border" />
        </div>

        <Button variant="secondary" className="w-full" onClick={google}>
          Continuar con Google
        </Button>

        <div className="mt-6 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
          {mode !== "login" ? (
            <button onClick={() => setMode("login")} className="hover:text-foreground">
              Volver a iniciar sesión
            </button>
          ) : (
            <>
              <button onClick={() => setMode("recover")} className="hover:text-foreground">
                Olvidé mi contraseña
              </button>
              <button onClick={() => setMode("signup")} className="hover:text-foreground">
                Crear cuenta
              </button>
            </>
          )}
        </div>

        <Link
          to="/trading"
          className="mt-6 block text-center text-xs text-muted-foreground hover:text-foreground"
        >
          ← Ver el tablero público
        </Link>
      </div>
    </div>
  );
}
