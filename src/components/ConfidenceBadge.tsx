import type { ConfidenceLevel } from "@/lib/types";

const CONFIDENCE_CONFIG: Record<
  ConfidenceLevel,
  { label: string; className: string; dotClassName: string }
> = {
  high: {
    label: "High",
    className: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    dotClassName: "bg-emerald-500",
  },
  medium: {
    label: "Medium",
    className: "bg-amber-50 text-amber-800 ring-amber-200",
    dotClassName: "bg-amber-500",
  },
  low: {
    label: "Low",
    className: "bg-orange-50 text-orange-800 ring-orange-200",
    dotClassName: "bg-orange-500",
  },
  none: {
    label: "No data",
    className: "bg-slate-100 text-slate-600 ring-slate-200",
    dotClassName: "bg-slate-400",
  },
};

interface ConfidenceBadgeProps {
  level: ConfidenceLevel;
  showLabel?: boolean;
}

export function ConfidenceBadge({
  level,
  showLabel = true,
}: ConfidenceBadgeProps) {
  const config = CONFIDENCE_CONFIG[level];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${config.className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${config.dotClassName}`}
        aria-hidden="true"
      />
      {showLabel && config.label}
    </span>
  );
}

export function getConfidenceLabel(level: ConfidenceLevel): string {
  return CONFIDENCE_CONFIG[level].label;
}
