"use client";

/**
 * RatingChip — match rating, out of 10 by default.
 *
 *   [ 7.4 ]    with a color ramp (blood → floodlight → touchline → pitch)
 *
 * Used on post-match cards, player cards, POTM spotlight, squad lists.
 */

export interface RatingChipProps {
  value: number;
  /** Max rating. Defaults to 10. */
  max?: number;
  size?: "sm" | "md" | "lg";
  /** Show a small progress bar under the number. */
  withBar?: boolean;
  className?: string;
}

function colorFor(v: number): { bg: string; fg: string } {
  if (v >= 8) return { bg: "bg-pitch", fg: "text-chalk" };
  if (v >= 7) return { bg: "bg-touchline", fg: "text-ink" };
  if (v >= 6) return { bg: "bg-floodlight/25", fg: "text-floodlight" };
  return { bg: "bg-blood", fg: "text-chalk" };
}

const SIZES = {
  sm: { pad: "px-1.5 py-0.5", font: "text-xs", bar: "h-0.5 w-8" },
  md: { pad: "px-2 py-0.5", font: "text-sm", bar: "h-0.5 w-10" },
  lg: { pad: "px-2.5 py-1", font: "text-xl", bar: "h-1 w-14" },
};

export default function RatingChip({
  value,
  max = 10,
  size = "md",
  withBar = false,
  className = "",
}: RatingChipProps) {
  const pct = Math.max(0, Math.min(1, value / max));
  const { bg, fg } = colorFor(value);
  const s = SIZES[size];

  return (
    <div className={`inline-flex flex-col items-center gap-0.5 ${className}`}>
      <span
        className={`${bg} ${fg} ${s.pad} ${s.font} rounded-sm font-display tabular-nums leading-none tracking-tight`}
      >
        {value.toFixed(1)}
      </span>
      {withBar && (
        <span className={`${s.bar} overflow-hidden rounded-sm bg-floodlight/15`}>
          <span
            className="block h-full bg-touchline"
            style={{ width: `${pct * 100}%` }}
          />
        </span>
      )}
    </div>
  );
}
