import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  hint,
  tone = "default",
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "up" | "down" | "promo";
  icon?: React.ReactNode;
}) {
  const color =
    tone === "up"
      ? "var(--up)"
      : tone === "down"
        ? "var(--down)"
        : tone === "promo"
          ? "var(--promo)"
          : undefined;

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
      </div>
      <p className={cn("num mt-2 text-2xl font-bold")} style={color ? { color } : undefined}>
        {value}
      </p>
      {hint ? <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
