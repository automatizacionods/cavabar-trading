import { cn } from "@/lib/utils";
import { formatClock } from "@/lib/trading";

type Props = {
  msLeft: number;
  totalMs: number;
  size?: number;
  className?: string;
};

export function CircularCountdown({ msLeft, totalMs, size = 132, className }: Props) {
  const stroke = size / 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const ratio = totalMs > 0 ? Math.max(0, Math.min(1, msLeft / totalMs)) : 0;
  const urgent = msLeft <= 60_000;
  const color = urgent ? "var(--down)" : "var(--promo)";

  return (
    <div
      className={cn("relative grid place-items-center", urgent && "animate-pulse", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          className="text-muted"
          strokeWidth={stroke}
          opacity={0.35}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - ratio)}
          style={{
            transition: "stroke-dashoffset 250ms linear, stroke 300ms ease",
            filter: `drop-shadow(0 0 10px ${color})`,
          }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span
          className="num font-bold"
          style={{ color, fontSize: size / 4.2 }}
        >
          {formatClock(msLeft)}
        </span>
      </div>
    </div>
  );
}
