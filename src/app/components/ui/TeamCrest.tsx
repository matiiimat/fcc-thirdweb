"use client";

import { IJersey } from "../../models/Team";

/**
 * TeamCrest — circular badge identity for a team.
 *
 * Uses the team's jersey colors (primary/secondary) with the team's
 * initials inside. Deterministic: the same team always renders the
 * same crest without needing an uploaded asset.
 *
 * Pair this with <Jersey> when you want both the kit and the badge.
 */

export type TeamCrestSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface TeamCrestProps {
  teamName: string;
  jersey?: Partial<IJersey>;
  size?: TeamCrestSize;
  className?: string;
}

const SIZE_PX: Record<TeamCrestSize, number> = {
  xs: 20,
  sm: 28,
  md: 40,
  lg: 56,
  xl: 80,
};

const DEFAULT_PRIMARY = "#0b6b2e";
const DEFAULT_SECONDARY = "#f5f3e8";

function deriveInitials(name: string): string {
  const cleaned = name.trim();
  if (!cleaned) return "FC";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function TeamCrest({
  teamName,
  jersey,
  size = "md",
  className = "",
}: TeamCrestProps) {
  const px = SIZE_PX[size];
  const primary = jersey?.primaryColor || DEFAULT_PRIMARY;
  const secondary = jersey?.secondaryColor || DEFAULT_SECONDARY;
  const initials = deriveInitials(teamName);

  // Font size scales with crest; Bebas handles uppercase well.
  const fontSize = Math.round(px * 0.42);

  return (
    <div
      aria-label={`${teamName} crest`}
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full ${className}`}
      style={{
        width: px,
        height: px,
        backgroundColor: primary,
        boxShadow: `inset 0 0 0 2px ${secondary}, 0 2px 6px rgba(0,0,0,0.35)`,
      }}
    >
      {/* A subtle chevron cut across the lower half — classic crest motif. */}
      <svg
        viewBox="0 0 40 40"
        className="absolute inset-0 h-full w-full opacity-70"
        aria-hidden="true"
      >
        <path
          d="M 0 26 L 20 34 L 40 26 L 40 40 L 0 40 Z"
          fill={secondary}
          opacity="0.18"
        />
      </svg>
      <span
        className="relative font-display leading-none tracking-broadcast"
        style={{
          fontSize,
          color: secondary,
          textShadow: "0 1px 0 rgba(0,0,0,0.25)",
        }}
      >
        {initials}
      </span>
    </div>
  );
}
