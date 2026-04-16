"use client";

import { useState, useEffect } from "react";
import { LeaderboardSortBy } from "../api/leaderboard/teams/route";

interface LeaderboardEntry {
  teamName: string;
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  cleanSheets: number;
  points: number;
  winRate: number;
  form: string;
}

interface TeamLeaderboardProps {
  className?: string;
  page?: number;
  limit?: number;
  onTeamClick: (teamName: string) => void;
  refreshTrigger?: number;
}

export default function TeamLeaderboard({
  className = "",
  page = 1,
  limit = 10,
  onTeamClick,
  refreshTrigger = 0,
}: TeamLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sortBy = "points" as const;

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        setLoading(true);
        setError(null); // Clear any previous errors

        const response = await fetch(
          `/api/leaderboard/teams?sortBy=${sortBy}&page=${page}&limit=${limit}`
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error ||
              `Failed to fetch leaderboard (${response.status})`
          );
        }

        const data = await response.json();

        if (!data.leaderboard || !Array.isArray(data.leaderboard)) {
          throw new Error("Invalid leaderboard data received");
        }

        setLeaderboard(data.leaderboard);
      } catch (error) {
        console.error("Leaderboard fetch error:", error);
        setError(
          error instanceof Error ? error.message : "Failed to fetch leaderboard"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, [sortBy, page, limit, refreshTrigger]);

  const getFormColor = (form: string) => {
    switch (form) {
      case "Good":
        return "text-green-400";
      case "Average":
        return "text-yellow-400";
      case "Poor":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  if (loading) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
        <p className="mt-2 text-gray-400">Loading leaderboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Team Rankings</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-sm text-gray-400">
              <th className="text-left py-2 px-3">#</th>
              <th className="text-left py-2 px-3">Team</th>
              <th className="text-center py-2 px-3">Pts</th>
              <th className="text-center py-2 px-3">P</th>
              <th className="text-center py-2 px-3">W</th>
              <th className="text-center py-2 px-3">D</th>
              <th className="text-center py-2 px-3">L</th>
              <th className="text-center py-2 px-3">GA</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((team, index) => (
              <tr
                key={team.teamName}
                className="border-t border-gray-800 hover:bg-black/20 transition-colors"
              >
                <td className="py-2 px-3">{(page - 1) * limit + index + 1}</td>
                <td className="py-2 px-3 font-medium">{team.teamName}</td>
                <td className="text-center py-2 px-3 font-bold">
                  {team.points}
                </td>
                <td className="text-center py-2 px-3">{team.gamesPlayed}</td>
                <td className="text-center py-2 px-3 text-green-400">
                  {team.wins}
                </td>
                <td className="text-center py-2 px-3 text-yellow-400">
                  {team.draws}
                </td>
                <td className="text-center py-2 px-3 text-red-400">
                  {team.losses}
                </td>
                <td
                  className={`text-center py-2 px-3 ${
                    team.goalDifference > 0
                      ? "text-green-400"
                      : team.goalDifference < 0
                      ? "text-red-400"
                      : "text-gray-400"
                  }`}
                >
                  {team.goalDifference > 0 ? "+" : ""}
                  {team.goalDifference}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
