"use client";

/**
 * LiveStatsStrip — broadcast mono strip under MomentumBar.
 *
 *   POSS  58 · 42      SHOTS  7 · 3      xG  1.2 · 0.4
 */

export interface LiveStat {
  label: string;
  home: number | string;
  away: number | string;
}

export interface LiveStatsStripProps {
  stats: LiveStat[];
  className?: string;
}

export default function LiveStatsStrip({
  stats,
  className = "",
}: LiveStatsStripProps) {
  return (
    <div
      className={`grid gap-2 rounded-sm border border-floodlight/10 bg-ink/50 px-2 py-1.5 ${className}`}
      style={{
        gridTemplateColumns: `repeat(${stats.length}, minmax(0, 1fr))`,
      }}
    >
      {stats.map((s, i) => (
        <div
          key={i}
          className="flex flex-col items-center justify-center text-center"
        >
          <span className="text-[9px] uppercase tracking-broadcast text-floodlight/50 font-display">
            {s.label}
          </span>
          <span className="data-num text-xs text-floodlight">
            <span className="text-pitch-line">{s.home}</span>
            <span className="mx-1 text-floodlight/40">·</span>
            <span className="text-sky">{s.away}</span>
          </span>
        </div>
      ))}
    </div>
  );
}
