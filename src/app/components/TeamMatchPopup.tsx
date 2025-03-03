"use client";

import { useState } from "react";
import { ITeamStats } from "../models/Team";
import { Match, MatchStats, MatchEvent } from "../types/match";
import { calculateWinRate } from "../lib/teamStats";
import { calculateWinRateChange } from "../lib/matchUtils";
import StatBar from "./StatBar";
import PlayerPerformance from "./PlayerPerformance";

interface TeamMatchPopupProps {
  match: Match;
  onClose: () => void;
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
}: {
  homeStats: MatchStats;
  awayStats: MatchStats;
}) => (
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
          homeValue={homeStats.shots}
          awayValue={awayStats.shots}
          subLabel={`(${homeStats.shotsOnTarget} on target - ${awayStats.shotsOnTarget} on target)`}
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

const TeamMatchPopup: React.FC<TeamMatchPopupProps> = ({ match, onClose }) => {
  const [activeTab, setActiveTab] = useState<"overview" | "stats" | "players">(
    "overview"
  );

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
        <div className="flex gap-2 mb-6">
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
          {match.homeStats && (
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
          {match.homePlayerRatings && (
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

            {/* Match Events */}
            {match.events && match.events.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Match Events</h3>
                <div className="glass-container bg-black/20 p-3 rounded-lg space-y-2 max-h-48 overflow-y-auto">
                  {match.events.map((event: MatchEvent, index: number) => (
                    <div
                      key={index}
                      className="text-sm text-gray-300 border-b border-gray-700 last:border-0 pb-2 last:pb-0"
                    >
                      {event.description}
                    </div>
                  ))}
                </div>
              </div>
            )}

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
            {match.stats && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Match Impact</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-green-400 mb-2">
                      {match.homeTeam}
                    </h4>
                    <TeamStats
                      stats={match.stats.home}
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
                      stats={match.stats.away}
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

        {activeTab === "stats" && match.homeStats && match.awayStats && (
          <MatchStatsComparison
            homeStats={match.homeStats}
            awayStats={match.awayStats}
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

export default TeamMatchPopup;
