import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/users.functions";

/** Reads the signed-in user's roles directly (RLS allows reading your own rows). */
export function useMyRoles() {
  return useQuery({
    queryKey: ["my-roles"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) return { roles: [] as AppRole[], isManager: false, isSuperadmin: false, userId: null };
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      if (error) throw error;
      const roles = (data ?? []).map((r) => r.role as AppRole);
      return {
        roles,
        isSuperadmin: roles.includes("superadmin"),
        isManager: roles.some((r) => r === "superadmin" || r === "admin"),
        userId: user.id,
      };
    },
    staleTime: 30_000,
  });
}

export const ROLE_LABEL: Record<string, string> = {
  superadmin: "Superadmin",
  admin: "Administrador",
  usuario: "Usuario",
  staff: "Staff",
};
