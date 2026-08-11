import { useQuery } from "@tanstack/react-query";

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
