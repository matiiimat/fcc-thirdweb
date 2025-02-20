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
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-3">
        <Jersey jersey={team.jersey} size="medium" />
        <h3 className="text-xl font-bold text-yellow-400">{team.teamName}</h3>
      </div>

      <div className="space-y-4">
        {isTeamCaptain ? (
          <div className="grid gap-3">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 shadow-lg">
              <h4 className="text-lg font-semibold text-yellow-400 mb-3">
                Team Management
              </h4>
              <div className="grid gap-2">
                <button
                  onClick={() => router.push("/manageteam")}
                  className="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium hover:opacity-90 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Manage Team
                </button>
                <button
                  onClick={() => router.push("/teammanagement")}
                  className="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-green-600 to-green-700 text-white font-medium hover:opacity-90 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Tactics
                </button>
                <button
                  onClick={() => router.push("/scouting")}
                  className="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium hover:opacity-90 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Scouting
                </button>
                <button
                  onClick={() => setJerseyModalOpen(true)}
                  className="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-yellow-600 to-yellow-700 text-white font-medium hover:opacity-90 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Sponsoring
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={handleLeaveTeam}
            disabled={loading}
            className="w-full px-4 py-2.5 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white font-medium hover:opacity-90 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:transform-none"
          >
            {loading ? "Leaving..." : "Leave Team"}
          </button>
        )}

        {/* Matches Section */}
        <TeamMatchesSection
          teamName={team.teamName}
          matches={team.matches || []}
          tactics={team.tactics || []}
          isTeamCaptain={isTeamCaptain}
        />
      </div>

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
