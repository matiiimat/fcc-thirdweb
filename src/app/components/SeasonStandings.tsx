"use client";

import { useState, useEffect } from "react";

interface TeamStats {
  teamId: string;
  teamName: string;
  points: number;
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

interface Season {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "registration" | "ongoing" | "completed";
  registeredTeams: TeamStats[];
}

export default function SeasonStandings() {
  const [season, setSeason] = useState<Season | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentSeason();
  }, []);

  const fetchCurrentSeason = async () => {
    try {
      const response = await fetch("/api/seasons?status=ongoing");
      if (!response.ok) {
        throw new Error("Failed to fetch season data");
      }

      const data = await response.json();
      if (data.seasons?.length) {
        setSeason(data.seasons[0]); // Get the active season
      }
    } catch (error) {
      console.error("Error fetching season:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load season data"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center text-gray-400 py-8">
        Loading season standings...
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-400 py-8">{error}</div>;
  }

  if (!season) {
    return (
      <div className="text-center text-gray-400 py-8">
        No active season found. The next season will start soon!
      </div>
    );
  }

  // Sort teams by points, goal difference, and goals scored
  const standings = [...season.registeredTeams].sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    if (b.goalDifference !== a.goalDifference) {
      return b.goalDifference - a.goalDifference;
    }
    return b.goalsFor - a.goalsFor;
  });

  return (
    <div className="overflow-x-auto">
      <div className="text-xl font-bold mb-4">{season.name}</div>
      <table className="w-full">
        <thead>
          <tr className="text-gray-400 border-b border-gray-700">
            <th className="text-left py-2 px-4">Pos</th>
            <th className="text-left py-2 px-4">Team</th>
            <th className="text-center py-2 px-4">P</th>
            <th className="text-center py-2 px-4">W</th>
            <th className="text-center py-2 px-4">D</th>
            <th className="text-center py-2 px-4">L</th>
            <th className="text-center py-2 px-4">GF</th>
            <th className="text-center py-2 px-4">GA</th>
            <th className="text-center py-2 px-4">GD</th>
            <th className="text-center py-2 px-4">Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((team, index) => (
            <tr
              key={team.teamId}
              className="border-b border-gray-800 hover:bg-gray-800/30"
            >
              <td className="py-2 px-4">{index + 1}</td>
              <td className="py-2 px-4">{team.teamName}</td>
              <td className="text-center py-2 px-4">{team.gamesPlayed}</td>
              <td className="text-center py-2 px-4">{team.wins}</td>
              <td className="text-center py-2 px-4">{team.draws}</td>
              <td className="text-center py-2 px-4">{team.losses}</td>
              <td className="text-center py-2 px-4">{team.goalsFor}</td>
              <td className="text-center py-2 px-4">{team.goalsAgainst}</td>
              <td className="text-center py-2 px-4">{team.goalDifference}</td>
              <td className="text-center py-2 px-4 font-bold">{team.points}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 text-sm text-gray-400">
        <div>P: Games Played • W: Wins • D: Draws • L: Losses</div>
        <div>
          GF: Goals For • GA: Goals Against • GD: Goal Difference • Pts: Points
        </div>
      </div>
    </div>
  );
}
