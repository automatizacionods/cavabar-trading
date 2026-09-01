import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { supabase } from "@/integrations/supabase/client";


export type Sale = {
  id: string;
  product_id: string | null;
  quantity: number;
  unit_price: number;
  total: number;
  created_at: string;
};

export function useSales() {
  return useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as unknown as Sale[];
    },
  });
}

export type Settings = {
  id: number;
  bar_name: string;
  currency: string;
  auto_pricing: boolean;
  volatility: number;
  tick_seconds: number;
  public_view: string;
};

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("settings").select("*").eq("id", 1).maybeSingle();
      if (error) throw error;
      return data as unknown as Settings | null;
    },
  });
}

/** Redirects to whichever public screen the admin enabled (mercado en vivo o modo TV). */
export function useEnforcePublicView(current: "trading" | "tv") {
  const settings = useSettings();
  const navigate = useNavigate();
  const target = settings.data?.public_view;

  useEffect(() => {
    if (!target || target === current) return;
    if (target === "tv") void navigate({ to: "/tv" });
    if (target === "trading") void navigate({ to: "/app/trading" });
  }, [target, current, navigate]);
}

