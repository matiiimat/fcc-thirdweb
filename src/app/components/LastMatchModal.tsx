import { useState } from "react";
import { MatchStats, MatchEvent } from "../types/match";
import StatBar from "./StatBar";
import PlayerPerformance from "./PlayerPerformance";

interface LastMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchData: {
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    homeStats: MatchStats;
    awayStats: MatchStats;
    homePlayerRatings: any[];
    awayPlayerRatings: any[];
    events: MatchEvent[];
    homeTactics?: {
      formation: string;
      tacticalStyle: string;
      playerPositions: any[];
    };
    awayTactics?: {
      formation: string;
      tacticalStyle: string;
      playerPositions: any[];
    };
  } | null;
  teamName: string;
}

export default function LastMatchModal({
  isOpen,
  onClose,
  matchData,
  teamName,
}: LastMatchModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "stats" | "players" | "tactics">("overview");

  if (!isOpen || !matchData) return null;

  const isHomeTeam = matchData.homeTeam === teamName;
  const teamStats = isHomeTeam ? matchData.homeStats : matchData.awayStats;
  const opponentStats = isHomeTeam ? matchData.awayStats : matchData.homeStats;
  const teamPlayerRatings = isHomeTeam ? matchData.homePlayerRatings : matchData.awayPlayerRatings;
  const opponentPlayerRatings = isHomeTeam ? matchData.awayPlayerRatings : matchData.homePlayerRatings;
  const teamTactics = isHomeTeam ? matchData.homeTactics : matchData.awayTactics;
  const opponentTactics = isHomeTeam ? matchData.awayTactics : matchData.homeTactics;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-end justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-gradient-to-b from-[#1a1d21] to-[#0d0f12] rounded-t-xl w-full max-w-4xl h-[75vh] flex flex-col transform transition-all duration-300 ease-out animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Last Match Details</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              ✕
            </button>
          </div>

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
            <button
              onClick={() => setActiveTab("tactics")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === "tactics"
                  ? "bg-yellow-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              Tactics
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <>
              {/* Score Display */}
              <div className="flex justify-center items-center space-x-4 mb-6">
                <div className="text-center">
                  <div className="font-semibold">{matchData.homeTeam}</div>
                  <div className="text-3xl font-bold text-green-500">
                    {matchData.homeScore}
                  </div>
                </div>
                <div className="text-2xl font-bold">-</div>
                <div className="text-center">
                  <div className="font-semibold">{matchData.awayTeam}</div>
                  <div className="text-3xl font-bold text-green-500">
                    {matchData.awayScore}
                  </div>
                </div>
              </div>

              {/* Match Events */}
              {matchData.events && matchData.events.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Match Events</h3>
                  <div className="glass-container bg-black/20 p-3 rounded-lg space-y-2 max-h-48 overflow-y-auto">
                    {matchData.events.map((event, index) => (
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
            </>
          )}

          {activeTab === "stats" && (
            <div className="space-y-4">
              <div className="glass-container bg-black/20 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Match Statistics</h3>
                <div className="space-y-3">
                  <StatBar
                    label="Possession"
                    homeValue={Math.round(teamStats.possession)}
                    awayValue={Math.round(opponentStats.possession)}
                    unit="%"
                  />
                  <StatBar
                    label="Shots"
                    homeValue={teamStats.shots}
                    awayValue={opponentStats.shots}
                    subLabel={`(${teamStats.shotsOnTarget} on target - ${opponentStats.shotsOnTarget} on target)`}
                  />
                  <StatBar
                    label="Passes"
                    homeValue={teamStats.passes}
                    awayValue={opponentStats.passes}
                    subLabel={`(${Math.round(teamStats.passAccuracy)}% acc. - ${Math.round(opponentStats.passAccuracy)}% acc.)`}
                  />
                  <StatBar
                    label="Tackles"
                    homeValue={teamStats.tackles}
                    awayValue={opponentStats.tackles}
                  />
                  <StatBar
                    label="Fouls"
                    homeValue={teamStats.fouls}
                    awayValue={opponentStats.fouls}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "players" && (
            <div className="space-y-6">
              <PlayerPerformance
                playerRatings={teamPlayerRatings}
                teamName={teamName}
              />
              <PlayerPerformance
                playerRatings={opponentPlayerRatings}
                teamName={isHomeTeam ? matchData.awayTeam : matchData.homeTeam}
              />
            </div>
          )}

          {activeTab === "tactics" && (
            <div className="space-y-6">
              {teamTactics && (
                <div className="glass-container bg-black/20 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">{teamName} Tactics</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Formation:</span>
                      <span className="font-medium">{teamTactics.formation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Style:</span>
                      <span className="font-medium">{teamTactics.tacticalStyle}</span>
                    </div>
                  </div>
                </div>
              )}
              {opponentTactics && (
                <div className="glass-container bg-black/20 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">
                    {isHomeTeam ? matchData.awayTeam : matchData.homeTeam} Tactics
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Formation:</span>
                      <span className="font-medium">{opponentTactics.formation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Style:</span>
                      <span className="font-medium">{opponentTactics.tacticalStyle}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 