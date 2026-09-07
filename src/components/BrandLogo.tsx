import logoAsset from "@/assets/cavabar-trading-logo.jpeg.asset.json";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  imageClassName?: string;
  label?: string;
  showLabel?: boolean;
};

export function BrandLogo({
  className,
  imageClassName,
  label = "CavaBar Trading",
  showLabel = true,
}: BrandLogoProps) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2.5", className)}>
      <img
        src={logoAsset.url}
        alt="Logo de CavaBar Trading"
        width={64}
        height={64}
        className={cn("size-10 shrink-0 rounded-lg object-cover", imageClassName)}
      />
      {showLabel ? <span className="truncate font-display font-extrabold">{label}</span> : null}
    </span>
  );
}
