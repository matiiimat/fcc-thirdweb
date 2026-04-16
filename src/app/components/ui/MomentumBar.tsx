"use client";

/**
 * MomentumBar — live bar showing which team is on top right now.
 *
 *   ====|=======----------
 *   ^ home                ^ away
 *
 * momentum in [-100, 100]. -100 = away dominating, +100 = home dominating.
 * Paired with <Scoreboard /> in MatchPopup — the thin strip of broadcast
 * graphic that makes an auto-match feel alive.
 */

export interface MomentumBarProps {
  /** -100..100; 0 = even. */
  momentum: number;
  homeLabel?: string;
  awayLabel?: string;
  className?: string;
}

export default function MomentumBar({
  momentum,
  homeLabel,
  awayLabel,
  className = "",
}: MomentumBarProps) {
  const clamped = Math.max(-100, Math.min(100, momentum));
  // Convert to 0..100 centered at 50.
  const pointerPct = 50 + clamped / 2;

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between text-[10px] uppercase tracking-broadcast text-floodlight/60 font-display mb-1">
        <span>{homeLabel || "Home"}</span>
        <span>Momentum</span>
        <span>{awayLabel || "Away"}</span>
      </div>
      <div className="relative h-2 rounded-full overflow-hidden bg-floodlight/10">
        {/* Home fill, from left to pointer */}
        <span
          className="absolute inset-y-0 left-0 bg-pitch transition-[width] duration-500 ease-out"
          style={{ width: `${pointerPct}%` }}
        />
        {/* Away fill, from pointer to right */}
        <span
          className="absolute inset-y-0 right-0 bg-sky/70 transition-[width] duration-500 ease-out"
          style={{ width: `${100 - pointerPct}%` }}
        />
        {/* Pointer line */}
        <span
          className="absolute top-0 bottom-0 w-0.5 bg-chalk transition-[left] duration-500 ease-out"
          style={{ left: `calc(${pointerPct}% - 1px)` }}
        />
      </div>
    </div>
  );
}
