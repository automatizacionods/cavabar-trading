import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AppRole = "superadmin" | "admin" | "usuario" | "staff";

export type ManagedUser = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  role: AppRole;
};

const MANAGER_ROLES: AppRole[] = ["superadmin", "admin"];

/** Reads the caller's own roles through RLS (no admin client involved). */
async function callerRoles(supabase: NonNullable<unknown>, userId: string): Promise<AppRole[]> {
  const client = supabase as {
    from: (t: string) => {
      select: (c: string) => { eq: (k: string, v: string) => Promise<{ data: { role: AppRole }[] | null; error: unknown }> };
    };
  };
  const { data } = await client.from("user_roles").select("role").eq("user_id", userId);
  return (data ?? []).map((r) => r.role);
}

export const getMyRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const roles = await callerRoles(context.supabase, context.userId);
    return {
      roles,
      isSuperadmin: roles.includes("superadmin"),
      isManager: roles.some((r) => MANAGER_ROLES.includes(r)),
    };
  });

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ManagedUser[]> => {
    const roles = await callerRoles(context.supabase, context.userId);
    if (!roles.some((r) => MANAGER_ROLES.includes(r))) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (error) throw error;

    const { data: roleRows } = await supabaseAdmin.from("user_roles").select("user_id, role");
    const byUser = new Map<string, AppRole>();
    for (const row of roleRows ?? []) {
      const current = byUser.get(row.user_id);
      const rank = (r: AppRole) => (r === "superadmin" ? 3 : r === "admin" ? 2 : 1);
      if (!current || rank(row.role as AppRole) > rank(current)) byUser.set(row.user_id, row.role as AppRole);
    }

    return data.users.map((u) => ({
      id: u.id,
      email: u.email ?? "",
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      role: byUser.get(u.id) ?? "usuario",
    }));
  });

function assertCanAssign(callerRolesList: AppRole[], target: AppRole) {
  const isSuper = callerRolesList.includes("superadmin");
  if (isSuper) return;
  if (!callerRolesList.includes("admin")) throw new Error("Forbidden");
  if (target === "superadmin") throw new Error("Solo un superadmin puede asignar el rol superadmin");
}

export const createUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string; password: string; role: AppRole }) => {
    if (!input.email?.includes("@")) throw new Error("Correo inválido");
    if (!input.password || input.password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres");
    if (!["superadmin", "admin", "usuario"].includes(input.role)) throw new Error("Rol inválido");
    return input;
  })
  .handler(async ({ data, context }) => {
    const roles = await callerRoles(context.supabase, context.userId);
    assertCanAssign(roles, data.role);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (error) throw error;

    await supabaseAdmin.from("user_roles").delete().eq("user_id", created.user.id);
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: created.user.id, role: data.role });
    if (roleError) throw roleError;
    return { id: created.user.id };
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; role: AppRole }) => input)
  .handler(async ({ data, context }) => {
    const roles = await callerRoles(context.supabase, context.userId);
    assertCanAssign(roles, data.role);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: targetRoles } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", data.userId);
    const targetIsSuper = (targetRoles ?? []).some((r) => r.role === "superadmin");
    if (targetIsSuper && !roles.includes("superadmin")) {
      throw new Error("No puedes modificar a un superadmin");
    }
    if (targetIsSuper && data.userId === context.userId && data.role !== "superadmin") {
      throw new Error("No puedes quitarte tu propio rol de superadmin");
    }

    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    const { error } = await supabaseAdmin.from("user_roles").insert({ user_id: data.userId, role: data.role });
    if (error) throw error;
    return { ok: true };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => input)
  .handler(async ({ data, context }) => {
    const roles = await callerRoles(context.supabase, context.userId);
    if (!roles.some((r) => MANAGER_ROLES.includes(r))) throw new Error("Forbidden");
    if (data.userId === context.userId) throw new Error("No puedes eliminar tu propia cuenta");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: targetRoles } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", data.userId);
    const targetIsSuper = (targetRoles ?? []).some((r) => r.role === "superadmin");
    if (targetIsSuper && !roles.includes("superadmin")) throw new Error("No puedes eliminar a un superadmin");

    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw error;
    return { ok: true };
  });
