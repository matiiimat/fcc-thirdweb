"use client";

import { useState, useEffect } from "react";
import { ITeamStats } from "../models/Team";
import { MatchEvent } from "../lib/teamMatchEngine";
import { calculateWinRate } from "../lib/teamStats";
import { calculateWinRateChange } from "../lib/matchUtils";
import StatBar from "./StatBar";
import PlayerPerformance from "./PlayerPerformance";

interface EnhancedMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  isCompleted: boolean;
  homeTactic?: {
    name: string;
    formation: string;
    tacticalStyle: string;
  };
  awayTactic?: {
    name: string;
    formation: string;
    tacticalStyle: string;
  };
  result?: {
    homeScore: number;
    awayScore: number;
  };
  homeStats?: {
    possession: number;
    shots: number;
    shotsOnTarget: number;
    passes: number;
    passAccuracy: number;
    tackles: number;
    fouls: number;
  };
  awayStats?: {
    possession: number;
    shots: number;
    shotsOnTarget: number;
    passes: number;
    passAccuracy: number;
    tackles: number;
    fouls: number;
  };
  homePlayerRatings?: {
    ethAddress: string;
    username: string;
    position: string;
    rating: number;
    stats: {
      goals: number;
      assists: number;
      shots: number;
      passes: number;
      tackles: number;
      saves?: number;
    };
  }[];
  awayPlayerRatings?: {
    ethAddress: string;
    username: string;
    position: string;
    rating: number;
    stats: {
      goals: number;
      assists: number;
      shots: number;
      passes: number;
      tackles: number;
      saves?: number;
    };
  }[];
  events?: MatchEvent[];
}

interface EnhancedTeamMatchPopupProps {
  match: EnhancedMatch;
  onClose: () => void;
  teamStats?: {
    home: ITeamStats;
    away: ITeamStats;
  };
}

const StatChange = ({
  label,
  value,
  change,
}: {
  label: string;
  value: number;
  change: number;
}) => (
  <div className="flex justify-between items-center text-sm">
    <span className="text-gray-400">{label}</span>
    <div className="flex items-center gap-2">
      <span className="text-white">{value}</span>
      {change !== 0 && (
        <span className={change > 0 ? "text-green-400" : "text-red-400"}>
          {change > 0 ? "+" : ""}
          {change}
        </span>
      )}
    </div>
  </div>
);

const TeamStats = ({
  stats,
  isWinner,
  goalsScored,
  goalsConceded,
}: {
  stats: ITeamStats;
  isWinner: boolean;
  goalsScored: number;
  goalsConceded: number;
}) => {
  const winRateChange = calculateWinRateChange(
    stats,
    isWinner,
    goalsScored,
    goalsConceded
  );

  return (
    <div className="glass-container bg-black/20 p-3 rounded-lg space-y-2">
      <StatChange label="Games Played" value={stats.gamesPlayed} change={1} />
      <StatChange label="Wins" value={stats.wins} change={isWinner ? 1 : 0} />
      <StatChange
        label="Draws"
        value={stats.draws}
        change={goalsScored === goalsConceded ? 1 : 0}
      />
      <StatChange
        label="Losses"
        value={stats.losses}
        change={!isWinner && goalsScored !== goalsConceded ? 1 : 0}
      />
      <StatChange
        label="Goals For"
        value={stats.goalsFor}
        change={goalsScored}
      />
      <StatChange
        label="Goals Against"
        value={stats.goalsAgainst}
        change={goalsConceded}
      />
      <StatChange
        label="Clean Sheets"
        value={stats.cleanSheets}
        change={goalsConceded === 0 ? 1 : 0}
      />
      <div className="flex justify-between items-center text-sm mt-2 pt-2 border-t border-gray-700">
        <span className="text-gray-400">Win Rate</span>
        <div className="flex items-center gap-2">
          <span className="text-white">
            {calculateWinRate(stats).toFixed(1)}%
          </span>
          {winRateChange !== 0 && (
            <span
              className={winRateChange > 0 ? "text-green-400" : "text-red-400"}
            >
              {winRateChange > 0 ? "+" : ""}
              {winRateChange.toFixed(1)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const MatchStatsComparison = ({
  homeStats,
  awayStats,
  homeGoals,
  awayGoals,
}: {
  homeStats: EnhancedMatch["homeStats"];
  awayStats: EnhancedMatch["awayStats"];
  homeGoals: number;
  awayGoals: number;
}) => {
  if (!homeStats || !awayStats) return null;

  // Add goals to shot count
  const homeTotalShots = homeStats.shots + homeGoals;
  const awayTotalShots = awayStats.shots + awayGoals;

  return (
    <div className="space-y-4">
      <div className="glass-container bg-black/20 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Match Statistics</h3>
        <div className="space-y-3">
          <StatBar
            label="Possession"
            homeValue={Math.round(homeStats.possession)}
            awayValue={Math.round(awayStats.possession)}
            unit="%"
          />
          <StatBar
            label="Shots"
            homeValue={homeTotalShots}
            awayValue={awayTotalShots}
            subLabel={`(${homeStats.shotsOnTarget + homeGoals} on target - ${
              awayStats.shotsOnTarget + awayGoals
            } on target)`}
          />
          <StatBar
            label="Passes"
            homeValue={homeStats.passes}
            awayValue={awayStats.passes}
            subLabel={`(${Math.round(
              homeStats.passAccuracy
            )}% acc. - ${Math.round(awayStats.passAccuracy)}% acc.)`}
          />
          <StatBar
            label="Tackles"
            homeValue={homeStats.tackles}
            awayValue={awayStats.tackles}
          />
          <StatBar
            label="Fouls"
            homeValue={homeStats.fouls}
            awayValue={awayStats.fouls}
          />
        </div>
      </div>
    </div>
  );
};

const EnhancedTeamMatchPopup: React.FC<EnhancedTeamMatchPopupProps> = ({
  match,
  onClose,
  teamStats,
}) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "stats" | "players" | "events"
  >("events");
  const [currentMinute, setCurrentMinute] = useState(0);
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [autoplaySpeed, setAutoplaySpeed] = useState(500); // milliseconds per minute
  const [matchCompleted, setMatchCompleted] = useState(false);

  // Initialize match
  useEffect(() => {
    // Start at minute 0
    setCurrentMinute(0);
    setMatchCompleted(false);
    setIsLiveMode(true);
  }, [match.id]); // Reset when match changes

  // Auto-advance the match time in live mode
  useEffect(() => {
    if (!isLiveMode || currentMinute >= 4) {
      if (currentMinute >= 4 && !matchCompleted) {
        setMatchCompleted(true);
      }
      return;
    }

    const timer = setTimeout(() => {
      const newMinute = Math.min(currentMinute + 1, 4);
      setCurrentMinute(newMinute);

      // Set match as completed when we reach the end
      if (newMinute >= 4) {
        setMatchCompleted(true);
      }
    }, autoplaySpeed);

    return () => clearTimeout(timer);
  }, [currentMinute, isLiveMode, autoplaySpeed, matchCompleted]);

  // Get events up to current minute (for live mode)
  const visibleEvents =
    match.events?.filter((event) => {
      if (!isLiveMode) return true;

      // For live mode, only show events up to the current minute
      // Convert event minute to a number to ensure proper comparison
      const eventMinute =
        typeof event.minute === "string"
          ? parseInt(event.minute, 10)
          : event.minute;

      return eventMinute <= currentMinute;
    }) || [];

  // Group events by minute for better display
  const eventsByMinute = visibleEvents.reduce((acc, event) => {
    const minute = event.minute;
    if (!acc[minute]) {
      acc[minute] = [];
    }
    acc[minute].push(event);
    return acc;
  }, {} as Record<number, MatchEvent[]>);

  // Sort minutes in descending order
  const sortedMinutes = Object.keys(eventsByMinute)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
      <div
        className="absolute inset-0 bg-black opacity-50"
        onClick={onClose}
      ></div>
      <div className="glass-container relative bg-[#1a1d21]/90 p-6 rounded-xl shadow-xl max-w-2xl w-full mx-auto z-10 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-white"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <h2 className="text-xl font-bold text-center mb-4">Match Result</h2>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6">
          {/* Only show Overview tab when match is completed */}
          {matchCompleted && (
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === "overview"
                  ? "bg-green-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              Overview
            </button>
          )}

          {/* Match Events tab is always visible */}
          <button
            onClick={() => setActiveTab("events")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === "events"
                ? "bg-yellow-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            Match Events
          </button>

          {/* Only show Statistics tab when match is completed */}
          {matchCompleted && match.homeStats && (
            <button
              onClick={() => setActiveTab("stats")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === "stats"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              Statistics
            </button>
          )}

          {/* Only show Players tab when match is completed */}
          {matchCompleted && match.homePlayerRatings && (
            <button
              onClick={() => setActiveTab("players")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === "players"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              Players
            </button>
          )}
        </div>

        {activeTab === "overview" && (
          <>
            {/* Score Display */}
            <div className="flex justify-center items-center space-x-4 mb-6">
              <div className="text-center">
                <div className="font-semibold">{match.homeTeam}</div>
                <div className="text-3xl font-bold text-green-500">
                  {match.result?.homeScore || 0}
                </div>
                <div className="text-sm text-gray-400">
                  {match.homeTactic?.tacticalStyle || "No Tactic"}
                </div>
              </div>
              <div className="text-2xl font-bold">-</div>
              <div className="text-center">
                <div className="font-semibold">{match.awayTeam}</div>
                <div className="text-3xl font-bold text-green-500">
                  {match.result?.awayScore || 0}
                </div>
                <div className="text-sm text-gray-400">
                  {match.awayTactic?.tacticalStyle || "No Tactic"}
                </div>
              </div>
            </div>

            {/* Formation Display */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-sm font-semibold mb-1">Home Formation</div>
                <div className="glass-container bg-black/20 p-2 rounded-lg">
                  {match.homeTactic?.formation || "N/A"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold mb-1">Away Formation</div>
                <div className="glass-container bg-black/20 p-2 rounded-lg">
                  {match.awayTactic?.formation || "N/A"}
                </div>
              </div>
            </div>

            {/* Stats Changes */}
            {teamStats && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Match Impact</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-green-400 mb-2">
                      {match.homeTeam}
                    </h4>
                    <TeamStats
                      stats={teamStats.home}
                      isWinner={
                        (match.result?.homeScore || 0) >
                        (match.result?.awayScore || 0)
                      }
                      goalsScored={match.result?.homeScore || 0}
                      goalsConceded={match.result?.awayScore || 0}
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-400 mb-2">
                      {match.awayTeam}
                    </h4>
                    <TeamStats
                      stats={teamStats.away}
                      isWinner={
                        (match.result?.awayScore || 0) >
                        (match.result?.homeScore || 0)
                      }
                      goalsScored={match.result?.awayScore || 0}
                      goalsConceded={match.result?.homeScore || 0}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "events" && (
          <div className="space-y-4">
            {/* Live Mode Controls */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="live-mode"
                  checked={isLiveMode}
                  onChange={() => setIsLiveMode(!isLiveMode)}
                  className="mr-2"
                />
                <label htmlFor="live-mode" className="text-sm text-white">
                  Live Mode
                </label>
              </div>

              {isLiveMode && (
                <div className="flex items-center">
                  <span className="text-sm text-white mr-2">Speed:</span>
                  <select
                    value={autoplaySpeed}
                    onChange={(e) => setAutoplaySpeed(Number(e.target.value))}
                    className="bg-gray-800 text-white text-sm rounded px-2 py-1"
                  >
                    <option value="1000">Slow</option>
                    <option value="500">Normal</option>
                    <option value="250">Fast</option>
                  </select>
                </div>
              )}
            </div>

            {/* Match Time Display */}
            {isLiveMode && (
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-white">
                  {currentMinute}′
                </div>
                <div className="w-full bg-gray-700 h-2 rounded-full mt-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(currentMinute / 4) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Score Display */}
            <div className="flex justify-center items-center space-x-4 mb-4">
              <div className="text-center">
                <div className="font-semibold">{match.homeTeam}</div>
                <div className="text-3xl font-bold text-green-500">
                  {isLiveMode
                    ? visibleEvents.filter(
                        (e) =>
                          e.type === "goal" && e.teamName === match.homeTeam
                      ).length
                    : match.result?.homeScore || 0}
                </div>
              </div>
              <div className="text-2xl font-bold">-</div>
              <div className="text-center">
                <div className="font-semibold">{match.awayTeam}</div>
                <div className="text-3xl font-bold text-green-500">
                  {isLiveMode
                    ? visibleEvents.filter(
                        (e) =>
                          e.type === "goal" && e.teamName === match.awayTeam
                      ).length
                    : match.result?.awayScore || 0}
                </div>
              </div>
            </div>

            {/* Match Events */}
            <div className="glass-container bg-black/20 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Match Events</h3>
              <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
                {sortedMinutes.map((minute) => (
                  <div
                    key={minute}
                    className="border-b border-gray-700 pb-2 last:border-0"
                  >
                    <div className="text-sm font-medium text-green-400 mb-1">
                      {minute}′
                    </div>
                    <div className="space-y-2">
                      {eventsByMinute[minute].map((event, index) => (
                        <div
                          key={index}
                          className={`text-sm ${
                            event.type === "goal"
                              ? "text-yellow-400 font-bold"
                              : event.type === "system"
                              ? "text-gray-400 italic"
                              : "text-white"
                          }`}
                        >
                          {event.description}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "stats" && match.homeStats && match.awayStats && (
          <MatchStatsComparison
            homeStats={match.homeStats}
            awayStats={match.awayStats}
            homeGoals={match.result?.homeScore || 0}
            awayGoals={match.result?.awayScore || 0}
          />
        )}

        {activeTab === "players" &&
          match.homePlayerRatings &&
          match.awayPlayerRatings && (
            <div className="space-y-6">
              <PlayerPerformance
                playerRatings={match.homePlayerRatings}
                teamName={match.homeTeam}
              />
              <PlayerPerformance
                playerRatings={match.awayPlayerRatings}
                teamName={match.awayTeam}
              />
            </div>
          )}

        {/* Close Button */}
        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="gradient-button py-2 px-6 rounded-lg text-sm transition-all duration-300 active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedTeamMatchPopup;
