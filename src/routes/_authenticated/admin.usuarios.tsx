import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROLE_LABEL, useMyRoles } from "@/hooks/useRoles";
import { createUser, deleteUser, listUsers, setUserRole, type AppRole } from "@/lib/users.functions";

export const Route = createFileRoute("/_authenticated/admin/usuarios")({
  component: UsersPage,
});

const ASSIGNABLE: AppRole[] = ["superadmin", "admin", "usuario"];

function UsersPage() {
  const qc = useQueryClient();
  const me = useMyRoles();
  const fetchUsers = useServerFn(listUsers);
  const create = useServerFn(createUser);
  const update = useServerFn(setUserRole);
  const remove = useServerFn(deleteUser);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AppRole>("usuario");

  const users = useQuery({
    queryKey: ["managed-users"],
    queryFn: () => fetchUsers(),
    enabled: me.data?.isManager === true,
  });

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["managed-users"] });

  const createMut = useMutation({
    mutationFn: () => create({ data: { email, password, role } }),
    onSuccess: () => {
      toast.success("Usuario creado");
      setEmail("");
      setPassword("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const roleMut = useMutation({
    mutationFn: (v: { userId: string; role: AppRole }) => update({ data: v }),
    onSuccess: () => {
      toast.success("Rol actualizado");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (userId: string) => remove({ data: { userId } }),
    onSuccess: () => {
      toast.success("Usuario eliminado");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (me.isLoading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!me.data?.isManager) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <ShieldCheck className="mx-auto size-8 text-muted-foreground" />
        <h1 className="mt-3 font-display text-xl font-bold">Acceso restringido</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Solo los administradores y superadministradores pueden gestionar usuarios.
        </p>
      </div>
    );
  }

  const isSuper = me.data.isSuperadmin;
  const options = ASSIGNABLE.filter((r) => isSuper || r !== "superadmin");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold">Usuarios y roles</h1>
        <p className="text-sm text-muted-foreground">
          {isSuper
            ? "Como superadmin puedes crear y administrar cualquier cuenta."
            : "Como administrador puedes gestionar cuentas de administrador y usuario."}
        </p>
      </header>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 flex items-center gap-2 font-semibold">
          <UserPlus className="size-4 text-primary" /> Crear usuario
        </h2>
        <form
          className="grid gap-3 sm:grid-cols-[1fr_1fr_160px_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            createMut.mutate();
          }}
        >
          <div>
            <Label htmlFor="new-email">Correo</Label>
            <Input id="new-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="new-pass">Contraseña</Label>
            <Input
              id="new-pass"
              type="password"
              value={password}
              minLength={6}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="new-role">Rol</Label>
            <select
              id="new-role"
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={role}
              onChange={(e) => setRole(e.target.value as AppRole)}
            >
              {options.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={createMut.isPending}>
              {createMut.isPending ? <Loader2 className="size-4 animate-spin" /> : "Crear"}
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-4 font-semibold">Cuentas registradas</h2>
        {users.isLoading ? (
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        ) : users.error ? (
          <p className="text-sm text-destructive">{(users.error as Error).message}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2">Correo</th>
                  <th className="py-2">Rol</th>
                  <th className="py-2">Último acceso</th>
                  <th className="py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {(users.data ?? []).map((u) => {
                  const locked = u.role === "superadmin" && !isSuper;
                  return (
                    <tr key={u.id} className="border-t border-border/60">
                      <td className="py-2.5">{u.email}</td>
                      <td className="py-2.5">
                        <select
                          className="h-8 rounded-md border border-input bg-background px-2 text-xs disabled:opacity-50"
                          value={u.role}
                          disabled={locked || roleMut.isPending}
                          onChange={(e) => roleMut.mutate({ userId: u.id, role: e.target.value as AppRole })}
                        >
                          {(locked ? [u.role] : options).map((r) => (
                            <option key={r} value={r}>
                              {ROLE_LABEL[r]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2.5 text-muted-foreground">
                        {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString("es-CO") : "—"}
                      </td>
                      <td className="py-2.5 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={locked || u.id === me.data.userId || deleteMut.isPending}
                          onClick={() => deleteMut.mutate(u.id)}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
