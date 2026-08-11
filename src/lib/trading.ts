export type Product = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  image_url: string | null;
  base_price: number;
  min_price: number;
  max_price: number;
  current_price: number;
  previous_price: number;
  stock: number;
  is_active: boolean;
  sold_count: number;
  views_count: number;
  created_at: string;
  updated_at: string;
};

export type Promotion = {
  id: string;
  product_id: string;
  promo_type: "fixed" | "percent" | "happy_hour" | "flash_sale" | string;
  value: number;
  promo_price: number;
  original_price: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  created_at: string;
};

export type PricePoint = { product_id: string; price: number; created_at: string };

export const CATEGORIES = [
  "cervezas",
  "cocteles",
  "licores",
  "shots",
  "promociones",
  "sin alcohol",
] as const;

export const PROMO_TYPES: { value: string; label: string }[] = [
  { value: "flash_sale", label: "Flash Sale" },
  { value: "happy_hour", label: "Happy Hour" },
  { value: "percent", label: "Descuento porcentual" },
  { value: "fixed", label: "Descuento fijo" },
];

export const PROMO_LABEL: Record<string, string> = {
  flash_sale: "FLASH SALE",
  happy_hour: "HAPPY HOUR",
  percent: "DESCUENTO",
  fixed: "DESCUENTO",
};

export function formatPrice(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function changePct(product: Pick<Product, "current_price" | "previous_price">): number {
  if (!product.previous_price) return 0;
  return ((product.current_price - product.previous_price) / product.previous_price) * 100;
}

export function formatClock(msLeft: number): string {
  const total = Math.max(0, Math.floor(msLeft / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function promoPriceFor(
  type: string,
  value: number,
  base: number,
  minPrice: number,
): number {
  let price = base;
  if (type === "fixed") price = base - value;
  else price = base * (1 - value / 100);
  return Math.max(Math.round(Math.max(price, minPrice * 0.5)), 0);
}

export function isPromoLive(p: Promotion, now = Date.now()): boolean {
  return p.is_active && new Date(p.ends_at).getTime() > now && new Date(p.starts_at).getTime() <= now;
}
