"use client";

/**
 * EventRow — single line in a live match commentary feed.
 *
 *   45'  ⚽  Ochoa finishes far post. Touchline erupts.
 *
 * Icon is derived from event kind. Home/away team is hinted via a thin
 * left border so the eye tracks possession without needing team names.
 */

export type EventKind =
  | "goal"
  | "chance"
  | "save"
  | "yellow"
  | "red"
  | "sub"
  | "tactic"
  | "kickoff"
  | "final"
  | "info";

export interface EventRowProps {
  minute: number | string;
  kind: EventKind;
  text: string;
  /** "home" | "away" | undefined (neutral events). */
  side?: "home" | "away";
  /** Force a gold glow (used for goals + key moments). */
  highlight?: boolean;
  className?: string;
}

const ICONS: Record<EventKind, string> = {
  goal: "⚽",
  chance: "◎",
  save: "✋",
  yellow: "▮",
  red: "▮",
  sub: "⇅",
  tactic: "◈",
  kickoff: "▶",
  final: "■",
  info: "·",
};

const ICON_TINT: Record<EventKind, string> = {
  goal: "text-touchline",
  chance: "text-sky",
  save: "text-sky",
  yellow: "text-touchline",
  red: "text-blood",
  sub: "text-floodlight/60",
  tactic: "text-pitch-line",
  kickoff: "text-floodlight",
  final: "text-floodlight",
  info: "text-floodlight/50",
};

export default function EventRow({
  minute,
  kind,
  text,
  side,
  highlight = false,
  className = "",
}: EventRowProps) {
  const borderColor =
    side === "home"
      ? "border-l-pitch"
      : side === "away"
      ? "border-l-sky"
      : "border-l-transparent";

  const container = highlight
    ? "bg-touchline/10 border-touchline/40"
    : "bg-floodlight/[0.03] border-transparent";

  return (
    <div
      className={`animate-fade-in flex items-start gap-3 rounded-sm border border-l-2 px-2 py-1.5 ${borderColor} ${container} ${className}`}
    >
      <span className="font-display text-xs tracking-broadcast text-floodlight/60 w-8 shrink-0 text-right tabular-nums">
        {typeof minute === "number" ? `${minute}'` : minute}
      </span>
      <span className={`${ICON_TINT[kind]} text-sm leading-tight w-4 shrink-0`}>
        {ICONS[kind]}
      </span>
      <span
        className={`text-sm leading-snug ${
          kind === "goal" ? "font-display tracking-broadcast text-chalk" : "text-floodlight"
        }`}
      >
        {text}
      </span>
    </div>
  );
}
