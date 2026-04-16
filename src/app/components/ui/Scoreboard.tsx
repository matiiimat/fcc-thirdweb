"use client";

import TeamCrest from "./TeamCrest";
import { IJersey } from "../../models/Team";

/**
 * Scoreboard — broadcast-style score bug.
 *
 *   [ ★ CRE ]  HOME  2 — 1  AWAY  [ CRE ★ ]
 *                       45'+2
 *
 * Meant for live-match and post-match contexts. Uses the .broadcast-card
 * register from globals.css so the typography stays consistent.
 */

export interface ScoreboardSide {
  name: string;
  score: number;
  jersey?: Partial<IJersey>;
}

export interface ScoreboardProps {
  home: ScoreboardSide;
  away: ScoreboardSide;
  /** Minute label like "45", "45+2", "FT", "HT". Omit for pre-match. */
  minute?: string;
  /** Flash the score when true (e.g. right after a goal fires). */
  flash?: boolean;
  className?: string;
}

function TeamSide({
  side,
  align,
}: {
  side: ScoreboardSide;
  align: "left" | "right";
}) {
  const isLeft = align === "left";
  return (
    <div
      className={`flex min-w-0 flex-1 items-center gap-2 ${
        isLeft ? "justify-start" : "justify-end"
      }`}
    >
      {isLeft && <TeamCrest teamName={side.name} jersey={side.jersey} size="md" />}
      <span
        className={`truncate font-display text-lg tracking-broadcast text-floodlight ${
          isLeft ? "text-left" : "text-right"
        }`}
        title={side.name}
      >
        {side.name}
      </span>
      {!isLeft && <TeamCrest teamName={side.name} jersey={side.jersey} size="md" />}
    </div>
  );
}

export default function Scoreboard({
  home,
  away,
  minute,
  flash = false,
  className = "",
}: ScoreboardProps) {
  return (
    <div className={`broadcast-card px-3 py-3 ${className}`}>
      <div className="flex items-center gap-3">
        <TeamSide side={home} align="left" />

        <div className="flex shrink-0 flex-col items-center px-1">
          <div
            className={`broadcast-score flex items-baseline gap-2 ${
              flash ? "animate-goal-flash" : ""
            }`}
          >
            <span>{home.score}</span>
            <span className="text-2xl text-floodlight/60">—</span>
            <span>{away.score}</span>
          </div>
          {minute && (
            <span className="mt-1 font-display text-xs tracking-broadcast text-touchline">
              {minute}
            </span>
          )}
        </div>

        <TeamSide side={away} align="right" />
      </div>
    </div>
  );
}
