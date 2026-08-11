import corona from "@/assets/corona.png";
import mojito from "@/assets/mojito.png";
import whiskey from "@/assets/whiskey.png";

const BY_NAME: Record<string, string> = {
  mojito,
  "corona extra": corona,
  "club colombia dorada": corona,
  "jack daniels": whiskey,
  "buchanans 12": whiskey,
  "aguardiente antioqueno": whiskey,
};

const EMOJI_BY_CATEGORY: Record<string, string> = {
  cervezas: "🍺",
  cocteles: "🍹",
  licores: "🥃",
  shots: "🥂",
  promociones: "⚡",
  "sin alcohol": "🥤",
};

export function productImage(name: string, imageUrl?: string | null): string | null {
  if (imageUrl) return imageUrl;
  return BY_NAME[name.trim().toLowerCase()] ?? null;
}

export function categoryEmoji(category: string): string {
  return EMOJI_BY_CATEGORY[category] ?? "🍸";
}
