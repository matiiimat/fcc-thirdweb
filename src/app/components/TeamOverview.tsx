import { useState } from "react";
import { useRouter } from "next/navigation";
import TeamMatchesSection from "./TeamMatchesSection";
import TeamStatsDisplay from "./TeamStatsDisplay";
import { ITactic, IJersey, ITeamStats } from "../models/Team";
import JerseyCustomizationModal from "./JerseyCustomizationModal";
import Jersey from "./Jersey";
import { Types } from "mongoose";

interface MongoTactic extends ITactic {
  _id: Types.ObjectId;
}

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

interface MongoTeam {
  _id: string;
  teamName: string;
  captainAddress: string;
  players: string[];
  matches?: Match[];
  tactics: MongoTactic[];
  jersey?: IJersey;
  stats: ITeamStats;
  isPublic: boolean;
}

interface TeamOverviewProps {
  team: MongoTeam;
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
  const [activeTab, setActiveTab] = useState<"matches" | "stats">("matches");

  const handleVisibilityToggle = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/teams/visibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamName: team.teamName,
          captainAddress: playerAddress,
          isPublic: !team.isPublic,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update team visibility");
      }

      // Update local state
      team.isPublic = !team.isPublic;
      router.refresh(); // Refresh the page to update the teams list
    } catch (error) {
      console.error("Error updating team visibility:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update team visibility"
      );
    } finally {
      setLoading(false);
    }
  };

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

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab("matches")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === "matches"
                ? "bg-green-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            Matches
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
        </div>

        {/* Tab Content */}
        {activeTab === "matches" ? (
          <TeamMatchesSection
            teamName={team.teamName}
            matches={team.matches || []}
            tactics={team.tactics || []}
            isTeamCaptain={isTeamCaptain}
            currentTeam={team}
          />
        ) : (
          <div className="glass-container p-4 rounded-xl shadow-lg">
            <TeamStatsDisplay stats={team.stats} />
          </div>
        )}
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
