"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { IPlayerStats, Position } from "../models/Player";
import { generateMatchEvents, MatchEvent } from "./MatchEvents";
import {
  Scoreboard,
  MomentumBar,
  LiveStatsStrip,
  EventRow,
  RatingChip,
  HeadlineCard,
  EventKind,
} from "./ui";
import { generateHeadline } from "../lib/narrative/headline";
import { playerCardOgUrl } from "../lib/ogUrl";

interface MatchPopupProps {
  selectedPosition: Position;
  playerName: string;
  username?: string;
  onClose: () => void;
  matchResult?: {
    rating: number;
    workEthicIncrease?: number;
    previousWorkEthic?: number;
    newWorkEthic?: number;
  };
  /** Optional — when provided, enables Farcaster share of the OG card. */
  playerSnapshot?: {
    stats: IPlayerStats;
    team?: string;
    pfp?: string;
    identity?: { traits?: string[] };
  };
  isBottomSheet?: boolean;
}

/** Map the solo-match event type to the broadcast EventRow kind. */
function mapEventKind(ev: MatchEvent): EventKind {
  if (ev.type === "goal") return "goal";
  if (ev.type === "system") {
    if (ev.minute === 0) return "kickoff";
    if (ev.minute >= 90) return "final";
    return "info";
  }
  // "action"
  return "chance";
}

/** Deterministic-ish pseudo-momentum from an event list. */
function computeMomentum(events: MatchEvent[], upToMinute: number): number {
  let m = 0;
  for (const ev of events) {
    if (ev.minute > upToMinute) break;
    if (ev.type === "goal") {
      m += ev.team === "player" ? 30 : -30;
    } else if (ev.type === "action" && ev.team !== "opponent") {
      m += 2;
    } else if (ev.type === "action" && ev.team === "opponent") {
      m -= 2;
    }
    // Decay toward 0 each minute.
    m *= 0.92;
  }
  return Math.max(-100, Math.min(100, m));
}

const MatchPopup: React.FC<MatchPopupProps> = ({
  selectedPosition,
  playerName,
  username,
  onClose,
  matchResult,
  playerSnapshot,
  isBottomSheet = false,
}) => {
  const [currentMinute, setCurrentMinute] = useState(0);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [showBackButton, setShowBackButton] = useState(false);
  const [score, setScore] = useState({ player: 0, opponent: 0 });
  const [goalFlash, setGoalFlash] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const eventsRef = useRef<MatchEvent[]>([]);
  const prevScoreRef = useRef({ player: 0, opponent: 0 });

  const displayName =
    username && username.trim() !== "" ? username : playerName;

  useEffect(() => {
    const matchEvents = generateMatchEvents(selectedPosition, displayName);
    eventsRef.current = matchEvents;
    setEvents(matchEvents);

    timerRef.current = setInterval(() => {
      setCurrentMinute((prev) => {
        const next = prev + 1;
        if (next >= 90) {
          if (timerRef.current) clearInterval(timerRef.current);
          setShowBackButton(true);
          return 90;
        }
        return next;
      });
    }, 500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [selectedPosition, displayName]);

  // Update score and detect goal changes for flash animation.
  useEffect(() => {
    const currentEvents = events.filter((ev) => ev.minute <= currentMinute);
    const newScore = currentEvents.reduce(
      (acc, ev) => {
        if (ev.type === "goal") {
          if (ev.team === "player") acc.player += 1;
          else if (ev.team === "opponent") acc.opponent += 1;
        }
        return acc;
      },
      { player: 0, opponent: 0 }
    );
    if (
      newScore.player !== prevScoreRef.current.player ||
      newScore.opponent !== prevScoreRef.current.opponent
    ) {
      setGoalFlash(true);
      setTimeout(() => setGoalFlash(false), 900);
    }
    prevScoreRef.current = newScore;
    setScore(newScore);
  }, [currentMinute, events]);

  const currentEvents = events.filter((ev) => ev.minute <= currentMinute);
  const momentum = useMemo(
    () => computeMomentum(events, currentMinute),
    [events, currentMinute]
  );

  // Approximate live stats from events.
  const liveStats = useMemo(() => {
    const shotsHome = currentEvents.filter(
      (e) => e.type === "action" && e.team !== "opponent"
    ).length;
    const shotsAway = currentEvents.filter(
      (e) => e.type === "action" && e.team === "opponent"
    ).length;
    // Fake possession biased by momentum.
    const possHome = Math.round(
      50 + (momentum / 100) * 15 + (Math.sin(currentMinute / 9) * 3)
    );
    const possHomeClamped = Math.max(30, Math.min(70, possHome));
    return [
      {
        label: "Poss",
        home: `${possHomeClamped}%`,
        away: `${100 - possHomeClamped}%`,
      },
      { label: "Shots", home: shotsHome, away: shotsAway },
      {
        label: "xG",
        home: (score.player * 0.8 + shotsHome * 0.08).toFixed(1),
        away: (score.opponent * 0.8 + shotsAway * 0.06).toFixed(1),
      },
    ];
  }, [currentEvents, currentMinute, momentum, score]);

  const minuteLabel =
    currentMinute >= 90 ? "FT" : currentMinute === 0 ? "KO" : `${currentMinute}'`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`
          relative w-full max-w-md max-h-[92vh] overflow-y-auto
          rounded-t-xl border-t border-pitch-line/40
          bg-gradient-to-b from-ink to-pitch-deep
          transform transition-all duration-300 ease-out
          ${isBottomSheet ? "animate-slide-up" : "animate-fade-in"}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-ink/80 border border-floodlight/20 text-floodlight/70 hover:text-chalk hover:border-floodlight/40 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="p-4 space-y-3">
          {/* Broadcast scoreboard */}
          <Scoreboard
            home={{ name: `${displayName}'s XI`, score: score.player }}
            away={{ name: "Opposition", score: score.opponent }}
            minute={minuteLabel}
            flash={goalFlash}
          />

          {/* Momentum */}
          <MomentumBar
            momentum={momentum}
            homeLabel={displayName}
            awayLabel="Away"
          />

          {/* Live stats strip */}
          <LiveStatsStrip stats={liveStats} />

          {/* Post-match tabloid headline */}
          {currentMinute >= 90 && (() => {
            const h = generateHeadline({
              homeTeam: `${displayName}'s XI`,
              awayTeam: "Opposition",
              homeScore: score.player,
              awayScore: score.opponent,
              topPerformer: displayName,
            });

            // Build the OG share URL if we have enough context.
            const shareData =
              playerSnapshot && matchResult
                ? {
                    text: `${h.headline} — full time ${score.player}-${score.opponent}. Rated ${matchResult.rating.toFixed(
                      1
                    )} / 10 in fcc/FC.`,
                    imageUrl: playerCardOgUrl({
                      name: displayName,
                      username,
                      position: selectedPosition,
                      rating: Math.round(matchResult.rating * 10), // 0-10 → 0-100
                      team: playerSnapshot.team,
                      traits: playerSnapshot.identity?.traits ?? [],
                      pfp: playerSnapshot.pfp,
                      stats: playerSnapshot.stats as any,
                    }),
                  }
                : undefined;

            return (
              <HeadlineCard
                headline={h.headline}
                body={h.body}
                byline={h.byline}
                footer={h.footer}
                variant="full"
                share={shareData}
              />
            );
          })()}

          {/* Rating + work ethic reveal once FT */}
          {currentMinute >= 90 && matchResult && (
            <div className="flex items-center justify-between gap-3 rounded-sm border border-touchline/40 bg-touchline/10 px-3 py-2">
              <div>
                <div className="text-[10px] uppercase tracking-broadcast text-touchline/80 font-display">
                  Your Rating
                </div>
                <div className="font-display text-2xl leading-none text-chalk tabular-nums">
                  {matchResult.rating.toFixed(1)}
                </div>
              </div>
              <RatingChip value={matchResult.rating} max={10} size="lg" withBar />
              {matchResult.workEthicIncrease !== undefined && (
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-broadcast text-floodlight/60 font-display">
                    Work Ethic
                  </div>
                  <div className="font-display text-base leading-none text-pitch-line">
                    +{matchResult.workEthicIncrease.toFixed(2)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Commentary feed */}
          <div className="max-h-80 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {[...currentEvents].reverse().map((ev, i) => (
              <EventRow
                key={`${ev.minute}-${i}`}
                minute={ev.minute === 0 ? "KO" : ev.minute === 90 ? "FT" : ev.minute}
                kind={mapEventKind(ev)}
                text={ev.text}
                side={
                  ev.team === "player"
                    ? "home"
                    : ev.team === "opponent"
                    ? "away"
                    : undefined
                }
                highlight={ev.type === "goal"}
              />
            ))}
          </div>

          {/* Back button */}
          {showBackButton && (
            <button
              onClick={onClose}
              className="w-full gradient-button py-2.5 rounded-sm font-display tracking-broadcast uppercase text-chalk hover:opacity-90 transition-opacity"
            >
              Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchPopup;
