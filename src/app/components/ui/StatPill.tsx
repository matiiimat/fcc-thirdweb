"use client";

/**
 * StatPill — label + number with optional delta.
 *
 *   PAS   14   ▲ +0.5
 *
 * For attribute rows on player cards and squad tables. The delta carries
 * positive/negative color automatically.
 */

export interface StatPillProps {
  label: string;
  value: number | string;
  delta?: number;
  /** Hint for which direction is "good". Defaults to "up". */
  positiveDirection?: "up" | "down";
  emphasized?: boolean;
  className?: string;
}

export default function StatPill({
  label,
  value,
  delta,
  positiveDirection = "up",
  emphasized = false,
  className = "",
}: StatPillProps) {
  const isPositive =
    delta !== undefined &&
    delta !== 0 &&
    (positiveDirection === "up" ? delta > 0 : delta < 0);
  const isNegative = delta !== undefined && delta !== 0 && !isPositive;

  const deltaColor = isPositive
    ? "text-pitch-line"
    : isNegative
    ? "text-blood"
    : "text-floodlight/50";
  const deltaGlyph = delta === undefined ? null : delta > 0 ? "▲" : delta < 0 ? "▼" : "·";

  return (
    <div
      className={`flex items-center justify-between gap-2 px-2 py-1 rounded-sm ${
        emphasized
          ? "bg-pitch/20 border border-pitch-line/30"
          : "bg-floodlight/5"
      } ${className}`}
    >
      <span className="text-[10px] uppercase tracking-broadcast text-floodlight/70 font-display">
        {label}
      </span>
      <span className="flex items-baseline gap-1">
        <span
          className={`data-num ${
            emphasized ? "text-chalk text-base" : "text-floodlight text-sm"
          }`}
        >
          {value}
        </span>
        {delta !== undefined && delta !== 0 && (
          <span className={`${deltaColor} text-[10px] font-display leading-none`}>
            {deltaGlyph}
            {Math.abs(delta).toFixed(1)}
          </span>
        )}
      </span>
    </div>
  );
}
