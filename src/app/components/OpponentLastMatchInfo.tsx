"use client";

import { useState, useEffect } from "react";
import { ITactic } from "../models/Team";
import { Match } from "../types/match";

interface OpponentLastMatchInfoProps {
  opponentTeamId: string;
  opponentTeamName: string;
}

export default function OpponentLastMatchInfo({
  opponentTeamId,
  opponentTeamName,
}: OpponentLastMatchInfoProps) {
  const [lastMatch, setLastMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"tactics" | "stats">("tactics");

  useEffect(() => {
    const fetchLastMatch = async () => {
      try {
        const response = await fetch(`/api/matches/last?teamId=${opponentTeamId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch last match");
        }
        const data = await response.json();
        setLastMatch(data.match);
      } catch (error) {
        console.error("Error fetching last match:", error);
        setError("Failed to load last match information");
      } finally {
        setLoading(false);
      }
    };

    fetchLastMatch();
  }, [opponentTeamId]);

  if (loading) {
    return (
      <div className="glass-container p-4 rounded-xl shadow-lg mt-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 bg-gray-700/30 rounded"></div>
          <div className="h-20 bg-gray-700/30 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-container p-4 rounded-xl shadow-lg mt-4">
        <div className="text-red-400 text-sm">{error}</div>
      </div>
    );
  }

  if (!lastMatch) {
    return (
      <div className="glass-container p-4 rounded-xl shadow-lg mt-4">
        <div className="text-gray-400 text-sm">
          No previous matches found for {opponentTeamName}
        </div>
      </div>
    );
  }

  const wasHomeTeam = lastMatch.homeTeamName === opponentTeamName;
  const opponentTactic = wasHomeTeam ? lastMatch.homeTactic : lastMatch.awayTactic;
  const opponentStats = wasHomeTeam ? lastMatch.homeStats : lastMatch.awayStats;

  return (
    <div className="glass-container p-4 rounded-xl shadow-lg mt-4">
      <h3 className="text-lg font-semibold text-white mb-4">
        {opponentTeamName}&apos;s Last Match
      </h3>

      {/* Match Summary */}
      <div className="mb-4">
        <div className="flex justify-center items-center space-x-4">
          <div className="text-center">
            <div className="font-semibold">{lastMatch.homeTeamName}</div>
            <div className="text-2xl font-bold text-green-500">
              {lastMatch.result?.homeScore || 0}
            </div>
          </div>
          <div className="text-xl font-bold">-</div>
          <div className="text-center">
            <div className="font-semibold">{lastMatch.awayTeamName}</div>
            <div className="text-2xl font-bold text-green-500">
              {lastMatch.result?.awayScore || 0}
            </div>
          </div>
        </div>
        <div className="text-sm text-gray-400 text-center mt-2">
          {new Date(lastMatch.scheduledDate).toLocaleDateString()}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700 mb-4">
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "tactics"
              ? "text-green-400 border-b-2 border-green-400"
              : "text-gray-400 hover:text-gray-300"
          }`}
          onClick={() => setActiveTab("tactics")}
        >
          Tactics
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "stats"
              ? "text-green-400 border-b-2 border-green-400"
              : "text-gray-400 hover:text-gray-300"
          }`}
          onClick={() => setActiveTab("stats")}
        >
          Statistics
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "tactics" && opponentTactic && (
        <div className="space-y-4">
          <div>
            <div className="text-sm font-medium text-gray-400">Formation</div>
            <div className="text-white">{opponentTactic.formation}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-400">Tactical Style</div>
            <div className="text-white">{opponentTactic.tacticalStyle}</div>
          </div>
        </div>
      )}

      {activeTab === "stats" && opponentStats && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-400">Possession</div>
              <div className="text-white">{opponentStats.possession}%</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-400">Shots</div>
              <div className="text-white">{opponentStats.shots}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-400">Shots on Target</div>
              <div className="text-white">{opponentStats.shotsOnTarget}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-400">Corners</div>
              <div className="text-white">{opponentStats.corners}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-400">Fouls</div>
              <div className="text-white">{opponentStats.fouls}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 