"use client";

import { useState } from "react";
import { ITactic } from "../models/Team";

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  isCompleted: boolean;
  homeTactic?: ITactic;
  awayTactic?: ITactic;
  result?: {
    homeScore: number;
    awayScore: number;
  };
}

interface TeamMatchesSectionProps {
  teamName: string;
  matches: Match[];
  tactics: ITactic[];
  isTeamCaptain: boolean;
}

export default function TeamMatchesSection({
  teamName,
  matches,
  tactics,
  isTeamCaptain,
}: TeamMatchesSectionProps) {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedTactic, setSelectedTactic] = useState<ITactic | null>(null);
  const [updating, setUpdating] = useState(false);

  // Group matches by status (upcoming vs completed)
  const upcomingMatches = matches
    .filter((match) => !match.isCompleted)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const completedMatches = matches
    .filter((match) => match.isCompleted)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const formatMatchDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const handleUpdateTactic = async (match: Match, tactic: ITactic) => {
    if (!isTeamCaptain) return;

    setUpdating(true);
    try {
      const response = await fetch("/api/teams/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: match.id,
          teamName,
          tactic,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update tactic");
      }

      // Update local state
      const updatedMatch = await response.json();
      setSelectedMatch(updatedMatch);
      setSelectedTactic(null);
    } catch (error) {
      console.error("Error updating tactic:", error);
    } finally {
      setUpdating(false);
    }
  };

  const getTeamTactic = (match: Match) => {
    return match.homeTeam === teamName ? match.homeTactic : match.awayTactic;
  };

  return (
    <div className="glass-container p-4 rounded-xl shadow-lg mt-4">
      <h2 className="text-lg font-semibold text-white mb-4">Team Matches</h2>

      {/* Upcoming Matches */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-green-400 mb-2">
          Upcoming Matches
        </h3>
        <div className="space-y-2">
          {upcomingMatches.length > 0 ? (
            upcomingMatches.map((match) => (
              <div
                key={match.id}
                className="glass-container bg-black/20 p-3 rounded-lg"
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex-1">
                    <span
                      className={
                        match.homeTeam === teamName
                          ? "text-green-400"
                          : "text-white"
                      }
                    >
                      {match.homeTeam}
                    </span>
                    <span className="text-gray-400 mx-2">vs</span>
                    <span
                      className={
                        match.awayTeam === teamName
                          ? "text-green-400"
                          : "text-white"
                      }
                    >
                      {match.awayTeam}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatMatchDate(match.date)}
                  </div>
                </div>

                {/* Tactic Selection */}
                {isTeamCaptain && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-400 mb-1">
                      Current Tactic: {getTeamTactic(match)?.name || "None"}
                    </div>
                    <div className="flex gap-2">
                      <select
                        className="flex-1 bg-black/30 text-white text-sm rounded px-2 py-1"
                        value={selectedTactic?.name || ""}
                        onChange={(e) => {
                          const tactic = tactics.find(
                            (t) => t.name === e.target.value
                          );
                          setSelectedTactic(tactic || null);
                        }}
                      >
                        <option value="">Select Tactic</option>
                        {tactics.map((tactic) => (
                          <option key={tactic.name} value={tactic.name}>
                            {tactic.name} ({tactic.formation} •{" "}
                            {tactic.tacticalStyle})
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() =>
                          selectedTactic &&
                          handleUpdateTactic(match, selectedTactic)
                        }
                        disabled={!selectedTactic || updating}
                        className={`px-3 py-1 rounded text-sm transition-all duration-200
                          ${
                            updating
                              ? "bg-gray-600"
                              : selectedTactic
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-gray-600 opacity-50 cursor-not-allowed"
                          }`}
                      >
                        {updating ? "Updating..." : "Set"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-gray-400 text-sm text-center">
              No upcoming matches scheduled
            </div>
          )}
        </div>
      </div>

      {/* Completed Matches */}
      <div>
        <h3 className="text-sm font-medium text-blue-400 mb-2">
          Match History
        </h3>
        <div className="space-y-2">
          {completedMatches.length > 0 ? (
            completedMatches.map((match) => (
              <div
                key={match.id}
                className="glass-container bg-black/20 p-3 rounded-lg"
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <span
                      className={
                        match.homeTeam === teamName
                          ? "text-green-400"
                          : "text-white"
                      }
                    >
                      {match.homeTeam}
                    </span>
                    <span className="text-gray-400 mx-2">
                      {match.result
                        ? `${match.result.homeScore} - ${match.result.awayScore}`
                        : "vs"}
                    </span>
                    <span
                      className={
                        match.awayTeam === teamName
                          ? "text-green-400"
                          : "text-white"
                      }
                    >
                      {match.awayTeam}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatMatchDate(match.date)}
                  </div>
                </div>
                <div className="mt-1 text-xs text-gray-400">
                  Tactic Used: {getTeamTactic(match)?.name || "None"}
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-400 text-sm text-center">
              No match history available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
