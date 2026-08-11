import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { supabase } from "@/integrations/supabase/client";
import type { PricePoint, Product, Promotion } from "@/lib/trading";

export function useProducts(onlyActive = true) {
  return useQuery({
    queryKey: ["products", onlyActive],
    queryFn: async () => {
      let q = supabase.from("products").select("*").order("name");
      if (onlyActive) q = q.eq("is_active", true);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as Product[];
    },
  });
}

export function usePriceHistory() {
  return useQuery({
    queryKey: ["price_history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("price_history")
        .select("product_id, price, created_at")
        .order("created_at", { ascending: true })
        .limit(1200);
      if (error) throw error;
      const map = new Map<string, number[]>();
      for (const row of (data ?? []) as unknown as PricePoint[]) {
        const arr = map.get(row.product_id) ?? [];
        arr.push(Number(row.price));
        map.set(row.product_id, arr.slice(-30));
      }
      return map;
    },
  });
}

export function usePromotions() {
  return useQuery({
    queryKey: ["promotions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return (data ?? []) as unknown as Promotion[];
    },
    refetchInterval: 30_000,
  });
}

/** Live sync: any change to products / promotions / price history refreshes the board. */
export function useRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("cavabar-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["products"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "promotions" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["promotions"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "price_history" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["price_history"] });
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
