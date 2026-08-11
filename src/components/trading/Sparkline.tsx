type Props = {
  data: number[];
  tone: "up" | "down" | "promo";
  className?: string;
};

const TONE_VAR: Record<Props["tone"], string> = {
  up: "var(--up)",
  down: "var(--down)",
  promo: "var(--promo)",
};

export function Sparkline({ data, tone, className }: Props) {
  const points = data.length > 1 ? data : [1, 1];
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const w = 100;
  const h = 32;

  const coords = points.map((value, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - ((value - min) / span) * (h - 4) - 2;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  const stroke = TONE_VAR[tone];
  const id = `spark-${tone}`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${coords.join(" ")} ${w},${h}`} fill={`url(#${id})`} />
      <polyline
        points={coords.join(" ")}
        fill="none"
        stroke={stroke}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
