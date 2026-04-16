"use client";

import TeamCrest from "./TeamCrest";
import { IJersey } from "../../models/Team";

/**
 * FixtureCard — upcoming or completed match in a list.
 *
 *   MATCHDAY 7 · SAT 14:00
 *   [CRE] HOME   2 — 1   AWAY [CRE]   FT
 */

export interface FixtureCardProps {
  home: { name: string; jersey?: Partial<IJersey>; score?: number };
  away: { name: string; jersey?: Partial<IJersey>; score?: number };
  /** Matchday number or round label. */
  matchday?: string | number;
  /** Human-readable kickoff or kickoff time. */
  kickoff?: string;
  /** "FT", "LIVE", "HT", or empty for upcoming. */
  status?: string;
  onClick?: () => void;
  className?: string;
}

export default function FixtureCard({
  home,
  away,
  matchday,
  kickoff,
  status,
  onClick,
  className = "",
}: FixtureCardProps) {
  const isCompleted = home.score !== undefined && away.score !== undefined;
  const isLive = status === "LIVE";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`data-card group w-full px-3 py-2.5 text-left transition-colors hover:border-pitch-line/50 disabled:cursor-default ${className}`}
    >
      {(matchday || kickoff) && (
        <div className="mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-broadcast text-floodlight/50 font-display">
          <span>{matchday ? `Matchday ${matchday}` : ""}</span>
          <span>{kickoff}</span>
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <TeamCrest teamName={home.name} jersey={home.jersey} size="sm" />
          <span className="truncate font-display tracking-broadcast text-sm text-floodlight">
            {home.name}
          </span>
        </div>
        <div className="shrink-0 px-2 text-center">
          {isCompleted ? (
            <span className="data-num text-lg text-chalk">
              {home.score} — {away.score}
            </span>
          ) : (
            <span className="font-display text-xs tracking-broadcast text-floodlight/50">
              VS
            </span>
          )}
          {status && (
            <div
              className={`text-[9px] uppercase tracking-broadcast font-display ${
                isLive ? "text-blood animate-pulse" : "text-floodlight/50"
              }`}
            >
              {status}
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          <span className="truncate font-display tracking-broadcast text-sm text-floodlight text-right">
            {away.name}
          </span>
          <TeamCrest teamName={away.name} jersey={away.jersey} size="sm" />
        </div>
      </div>
    </button>
  );
}
