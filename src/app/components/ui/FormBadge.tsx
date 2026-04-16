"use client";

/**
 * FormBadge — last N results at a glance.
 *
 *     W D L W W         (pills, newest on the right by default)
 *
 * A staple of every football UI. Order is chronological: oldest → newest
 * left-to-right, which matches how league tables render form columns.
 */

export type FormResult = "W" | "D" | "L";

export interface FormBadgeProps {
  /** Chronological list, oldest first. Trimmed/padded to `limit`. */
  results: FormResult[];
  /** Max results shown. Defaults to 5. */
  limit?: number;
  size?: "sm" | "md";
  className?: string;
}

const PALETTE: Record<FormResult, { bg: string; fg: string; label: string }> = {
  W: { bg: "bg-pitch", fg: "text-chalk", label: "Win" },
  D: { bg: "bg-floodlight/25", fg: "text-floodlight", label: "Draw" },
  L: { bg: "bg-blood", fg: "text-chalk", label: "Loss" },
};

const DIMENSIONS = {
  sm: { box: "h-4 w-4 text-[10px]", gap: "gap-0.5" },
  md: { box: "h-5 w-5 text-xs", gap: "gap-1" },
};

export default function FormBadge({
  results,
  limit = 5,
  size = "md",
  className = "",
}: FormBadgeProps) {
  const trimmed = results.slice(-limit);
  const { box, gap } = DIMENSIONS[size];

  // Pad with empty slots on the left so the strip width is stable.
  const padCount = Math.max(0, limit - trimmed.length);

  return (
    <div
      className={`inline-flex items-center ${gap} ${className}`}
      aria-label={`Form: ${trimmed.join(" ") || "no recent matches"}`}
    >
      {Array.from({ length: padCount }).map((_, i) => (
        <span
          key={`pad-${i}`}
          className={`${box} rounded-sm border border-floodlight/10 bg-transparent`}
          aria-hidden="true"
        />
      ))}
      {trimmed.map((r, i) => {
        const p = PALETTE[r];
        return (
          <span
            key={i}
            title={p.label}
            className={`${box} ${p.bg} ${p.fg} inline-flex items-center justify-center rounded-sm font-display leading-none tracking-tight`}
          >
            {r}
          </span>
        );
      })}
    </div>
  );
}
