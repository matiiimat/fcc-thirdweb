"use client";

/**
 * IdentityStrip — compact row of form / morale / fatigue / condition bars.
 *
 * Used on the home player card and on the player detail page. Each bar
 * is a thin gauge with a label and a colored fill. Form uses a different
 * (diverging) scale because it can be negative.
 */

export interface IdentityStripProps {
  form: number;      // -3..+3
  morale: number;    // 0..100
  fatigue: number;   // 0..100; high = tired
  condition: number; // 0..100
  className?: string;
}

function formFill(form: number): { pct: number; color: string } {
  // Center at 50%, +3 goes to 100, -3 goes to 0.
  const pct = Math.max(0, Math.min(100, 50 + (form / 3) * 50));
  const color = form >= 0.75 ? "bg-pitch-line" : form <= -0.75 ? "bg-blood" : "bg-floodlight/50";
  return { pct, color };
}

function Bar({
  label,
  pct,
  color,
  rightLabel,
}: {
  label: string;
  pct: number;
  color: string;
  rightLabel?: string;
}) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-baseline justify-between text-[9px] uppercase tracking-broadcast text-floodlight/60 font-display leading-none">
        <span>{label}</span>
        {rightLabel && <span className="text-floodlight/80">{rightLabel}</span>}
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-sm bg-floodlight/10">
        <span
          className={`block h-full ${color} transition-[width] duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function IdentityStrip({
  form,
  morale,
  fatigue,
  condition,
  className = "",
}: IdentityStripProps) {
  const f = formFill(form);
  const sign = form >= 0 ? "+" : "";

  return (
    <div className={`grid grid-cols-4 gap-2 ${className}`}>
      <Bar
        label="Form"
        pct={f.pct}
        color={f.color}
        rightLabel={`${sign}${form.toFixed(1)}`}
      />
      <Bar
        label="Morale"
        pct={morale}
        color={morale >= 60 ? "bg-pitch-line" : morale >= 30 ? "bg-touchline" : "bg-blood"}
        rightLabel={`${Math.round(morale)}`}
      />
      <Bar
        label="Fatigue"
        pct={fatigue}
        color={fatigue >= 70 ? "bg-blood" : fatigue >= 40 ? "bg-touchline" : "bg-floodlight/40"}
        rightLabel={`${Math.round(fatigue)}`}
      />
      <Bar
        label="Fitness"
        pct={condition}
        color={condition >= 80 ? "bg-pitch-line" : condition >= 50 ? "bg-touchline" : "bg-blood"}
        rightLabel={`${Math.round(condition)}`}
      />
    </div>
  );
}
