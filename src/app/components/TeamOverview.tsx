import { useState, useEffect } from "react";
import { calculatePlayerRating, getStarRating } from "../lib/game";

interface TeamMember {
  address: string;
  name: string;
  stats: {
    strength: number;
    stamina: number;
    passing: number;
    shooting: number;
    defending: number;
    speed: number;
    positioning: number;
    workEthic: number;
  };
}

const calculateOverallRating = (
  stats: TeamMember["stats"] | undefined
): number => {
  if (!stats) return 0;

  const values = Object.values(stats);
  if (values.length === 0) return 0;

  const validValues = values.filter((v) => typeof v === "number" && !isNaN(v));
  if (validValues.length === 0) return 0;

  const average = validValues.reduce((a, b) => a + b, 0) / validValues.length;
  return Math.round(average);
};

interface TeamOverviewProps {
  team: {
    teamName: string;
    captainAddress: string;
    players: string[];
  };
  playerAddress: string;
  onLeaveTeam: () => void;
}

export default function TeamOverview({
  team,
  playerAddress,
  onLeaveTeam,
}: TeamOverviewProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    fetchTeamMemberNames();
  }, [team.players]);

  const fetchTeamMemberNames = async () => {
    try {
      const memberPromises = team.players.map(async (address) => {
        const response = await fetch(
          `/api/players/address/${encodeURIComponent(address)}`
        );
        if (!response.ok)
          throw new Error(`Failed to fetch player data for ${address}`);
        const data = await response.json();
        return {
          address,
          name: data.playerName,
          stats: data.stats,
        };
      });

      const members = await Promise.all(memberPromises);
      setTeamMembers(members);
    } catch (error) {
      console.error("Error fetching team member names:", error);
      setError("Failed to fetch team member names");
    }
  };

  const handleLeaveTeam = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/teams/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamName: team.teamName,
          playerAddress,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to leave team");
      }

      onLeaveTeam();
    } catch (error) {
      console.error("Error leaving team:", error);
      setError(error instanceof Error ? error.message : "Failed to leave team");
    } finally {
      setLoading(false);
    }
  };

  const isTeamCaptain =
    team.captainAddress.toLowerCase() === playerAddress.toLowerCase();

  return (
    <div className="px-2 py-3">
      <div className="bg-gray-800 rounded-lg p-3 mb-3">
        <h3 className="text-xl font-bold text-yellow-400 text-center mb-2">
          {team.teamName}
        </h3>

        <div className="divide-y divide-gray-700">
          {teamMembers.map((member) => (
            <div
              key={member.address}
              className="flex items-center justify-between py-2"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center min-w-0">
                  <span className="text-white truncate">
                    {member.name}
                    {member.address.toLowerCase() ===
                      team.captainAddress.toLowerCase() && (
                      <span className="ml-1 text-yellow-400 font-medium">
                        (C)
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center ml-2">
                  <span className="text-[0.7rem] leading-none">
                    {getStarRating(calculatePlayerRating(member.stats))}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {!isTeamCaptain && (
        <button
          onClick={handleLeaveTeam}
          disabled={loading}
          className="w-full px-4 py-2 rounded bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {loading ? "Leaving..." : "Leave Team"}
        </button>
      )}

      {error && (
        <div className="mt-2 text-red-400 text-center text-sm">{error}</div>
      )}
    </div>
  );
}
