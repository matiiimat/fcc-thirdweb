import { useState } from "react";

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
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-200 mb-2">
          {team.teamName}
        </h3>
        <p className="text-sm text-gray-400">
          {isTeamCaptain ? "Team Captain" : "Team Member"}
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="text-lg font-medium text-gray-200 mb-3">
            Team Members
          </h4>
          <div className="space-y-2">
            {team.players.map((player, index) => (
              <div
                key={player}
                className="flex items-center justify-between py-2 px-3 bg-gray-700 rounded"
              >
                <span className="text-sm text-gray-300">
                  Player {index + 1}
                  {player.toLowerCase() === team.captainAddress.toLowerCase() &&
                    " (Captain)"}
                </span>
                <span className="text-xs text-gray-400">
                  {player.slice(0, 6)}...{player.slice(-4)}
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
