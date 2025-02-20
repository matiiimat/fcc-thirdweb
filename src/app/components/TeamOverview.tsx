import { useState } from "react";
import { useRouter } from "next/navigation";
import TeamMatchesSection from "./TeamMatchesSection";
import { ITactic, IJersey } from "../models/Team";
import JerseyCustomizationModal from "./JerseyCustomizationModal";
import Jersey from "./Jersey";

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

interface TeamOverviewProps {
  team: {
    teamName: string;
    captainAddress: string;
    players: string[];
    matches?: Match[];
    tactics?: ITactic[];
    jersey?: IJersey;
  };
  playerAddress: string;
  onLeaveTeam: () => void;
}

export default function TeamOverview({
  team,
  playerAddress,
  onLeaveTeam,
}: TeamOverviewProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [jerseyModalOpen, setJerseyModalOpen] = useState(false);

  const handleJerseyUpdate = async (jersey: IJersey) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/teams/jersey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamName: team.teamName,
          captainAddress: playerAddress,
          jersey,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update jersey");
      }

      setJerseyModalOpen(false);
    } catch (error) {
      console.error("Error updating jersey:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update jersey"
      );
    } finally {
      setLoading(false);
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
        <div className="flex items-center justify-center gap-2">
          <Jersey jersey={team.jersey} size="medium" />
          <h3 className="text-xl font-bold text-yellow-400">{team.teamName}</h3>
        </div>
      </div>

      <div className="space-y-2">
        {isTeamCaptain && (
          <div className="space-y-2">
            <button
              onClick={() => router.push("/manageteam")}
              className="w-full px-4 py-2 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              Manage Team
            </button>
            <button
              onClick={() => router.push("/teammanagement")}
              className="w-full px-4 py-2 rounded bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
            >
              Tactics
            </button>
            <button
              onClick={() => router.push("/scouting")}
              className="w-full px-4 py-2 rounded bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors"
            >
              Scouting
            </button>
          </div>
        )}

        {!isTeamCaptain && (
          <button
            onClick={handleLeaveTeam}
            disabled={loading}
            className="w-full px-4 py-2 rounded bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Leaving..." : "Leave Team"}
          </button>
        )}
      </div>

      {/* Matches Section */}
      <TeamMatchesSection
        teamName={team.teamName}
        matches={team.matches || []}
        tactics={team.tactics || []}
        isTeamCaptain={isTeamCaptain}
      />

      {/* Sponsoring Section */}
      {isTeamCaptain && (
        <div className="mt-4">
          <button
            onClick={() => setJerseyModalOpen(true)}
            className="w-full px-4 py-2 rounded bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
          >
            Sponsoring
          </button>
        </div>
      )}

      {/* Jersey Customization Modal */}
      <JerseyCustomizationModal
        isOpen={jerseyModalOpen}
        onClose={() => setJerseyModalOpen(false)}
        onSave={handleJerseyUpdate}
        currentJersey={team.jersey}
      />

      {error && (
        <div className="mt-2 text-red-400 text-center text-sm">{error}</div>
      )}
    </div>
  );
}
