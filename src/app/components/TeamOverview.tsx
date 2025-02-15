import { useState, useEffect } from "react";

interface TeamMember {
  address: string;
  name: string;
}

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
    <div className="space-y">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-200">{team.teamName}</h3>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-800 rounded-lg">
          <h4 className="text-lg font-medium text-gray-200 mb-3">
            Team Members
          </h4>
          <div className="space-y-2">
            {teamMembers.map((member) => (
              <div
                key={member.address}
                className="flex items-center justify-between py-2 px-3 bg-gray-700 rounded"
              >
                <span className="text-sm text-gray-300">
                  {member.name}
                  {member.address.toLowerCase() ===
                    team.captainAddress.toLowerCase() && " (C)"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {!isTeamCaptain && (
          <button
            onClick={handleLeaveTeam}
            disabled={loading}
            className="w-full px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Leaving..." : "Leave Team"}
          </button>
        )}
      </div>

      {error && <div className="p-4 text-red-400 text-center">{error}</div>}
    </div>
  );
}
