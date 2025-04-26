import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TeamMatchesSection from "./TeamMatchesSection";
import TeamStatsDisplay from "./TeamStatsDisplay";
import { ITactic, IJersey, ITeamStats } from "../models/Team";
import JerseyCustomizationModal from "./JerseyCustomizationModal";
import PlayerContractModal from "./PlayerContractModal";
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
  onOpenScouting: () => void;
  onOpenManageTeam: () => void;
  onOpenTactics: () => void;
  isCaptain: boolean;
  onLastMatchClick: () => void;
}

export default function TeamOverview({
  team,
  playerAddress,
  onLeaveTeam,
  onOpenScouting,
  onOpenManageTeam,
  onOpenTactics,
  isCaptain,
  onLastMatchClick,
}: TeamOverviewProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [jerseyModalOpen, setJerseyModalOpen] = useState(false);
  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"matches" | "stats">("matches");
  const [playerData, setPlayerData] = useState<any>(null);
  const [pendingContractRequests, setPendingContractRequests] = useState(0);

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

  // Fetch player data including contract information
  useEffect(() => {
    const fetchPlayerData = async () => {
      try {
        const response = await fetch(`/api/players/address/${playerAddress}`);
        if (response.ok) {
          const data = await response.json();
          setPlayerData(data);
        }
      } catch (error) {
        console.error("Error fetching player data:", error);
      }
    };

    if (playerAddress) {
      fetchPlayerData();
    }
  }, [playerAddress]);

  const handleLeaveTeam = async () => {
    try {
      // Check if player has an active contract
      if (playerData?.contract?.status === "active") {
        setError("You cannot leave the team while under contract");
        return;
      }

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

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center justify-center gap-2">
        <div className="flex items-center gap-3">
          <Jersey jersey={team.jersey} size="medium" />
          <h3 className="text-xl font-bold text-yellow-400">{team.teamName}</h3>
        </div>

        {/* Contract Summary - Only visible to non-captains */}
        {/* {!isCaptain && playerData?.contract && (
          <div className="glass-container p-2 rounded-lg text-center text-sm w-full max-w-xs">
            <span
              className={`font-medium ${
                playerData.contract.status === "active"
                  ? "text-green-400"
                  : playerData.contract.status === "pending"
                  ? "text-yellow-400"
                  : "text-gray-400"
              }`}
            >
              {playerData.contract.status === "active"
                ? `Contract: ${playerData.contract.requestedAmount} ETH, ${
                    playerData.contract.durationInSeasons
                  } ${
                    playerData.contract.durationInSeasons === 1
                      ? "season"
                      : "seasons"
                  }`
                : playerData.contract.status === "pending"
                ? "Contract request pending"
                : "Contract expired"}
            </span>
          </div>
        )} */}
      </div>

      <div className="space-y-4">
        <div className="grid gap-3">
          {isCaptain ? (
            <div className="glass-container p-4 rounded-lg shadow-lg">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={onOpenManageTeam}
                  className="flex flex-col items-center justify-center px-4 py-3 h-full rounded-lg bg-gray-800/60 backdrop-blur-sm text-white font-medium hover:bg-gray-700/60 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] relative"
                >
                  <img
                    src="/icons/iconmanageteam.png"
                    alt="Manage Team"
                    className="w-8 h-8 mb-2"
                  />
                  Manage Team
                  {pendingContractRequests > 0 && (
                    <span className="absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3 w-3 h-3 bg-red-500 rounded-full"></span>
                  )}
                </button>
                <button
                  onClick={onOpenTactics}
                  className="flex flex-col items-center justify-center px-4 py-3 h-full rounded-lg bg-gray-800/60 backdrop-blur-sm text-white font-medium hover:bg-gray-700/60 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <img
                    src="/icons/icontactics.png"
                    alt="Tactics"
                    className="w-8 h-8 mb-2"
                  />
                  Tactics
                </button>
                <button
                  onClick={onOpenScouting}
                  className="flex flex-col items-center justify-center px-4 py-3 rounded-lg bg-gray-800/60 backdrop-blur-sm text-white font-medium hover:bg-gray-700/60 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                  style={{ minHeight: "100%" }}
                >
                  <img
                    src="/icons/iconscouting.png"
                    alt="Scouting"
                    className="w-8 h-8 mb-2 object-contain"
                  />
                  Scouting
                </button>
                <button
                  onClick={() => setJerseyModalOpen(true)}
                  className="flex flex-col items-center justify-center px-4 py-3 h-full rounded-lg bg-gray-800/60 backdrop-blur-sm text-white font-medium hover:bg-gray-700/60 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <img
                    src="/icons/iconcustomize.png"
                    alt="Customize"
                    className="w-8 h-8 mb-2"
                  />
                  Customize
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-container p-4 rounded-lg shadow-lg">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={onOpenManageTeam}
                  className="flex flex-col items-center justify-center px-4 py-3 h-full rounded-lg bg-gray-800/60 backdrop-blur-sm text-white font-medium hover:bg-gray-700/60 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <img
                    src="/icons/iconmanageteam.png"
                    alt="Players"
                    className="w-8 h-8 mb-2"
                  />
                  Players
                </button>
                <button
                  onClick={onOpenTactics}
                  className="flex flex-col items-center justify-center px-4 py-3 h-full rounded-lg bg-gray-800/60 backdrop-blur-sm text-white font-medium hover:bg-gray-700/60 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <img
                    src="/icons/icontactics.png"
                    alt="View Team Tactics"
                    className="w-8 h-8 mb-2"
                  />
                  Tactics
                </button>
                <button
                  onClick={() => setContractModalOpen(true)}
                  className="flex flex-col items-center justify-center px-4 py-3 h-full rounded-lg bg-gray-800/60 backdrop-blur-sm text-white font-medium hover:bg-gray-700/60 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] relative"
                >
                  <img
                    src="/icons/iconcontract.png"
                    alt="Contract"
                    className="w-8 h-8 mb-2"
                  />
                  Contract
                  {playerData?.contract?.status === "pending" && (
                    <span className="absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3 w-3 h-3 bg-yellow-500 rounded-full"></span>
                  )}
                </button>
                <button
                  onClick={handleLeaveTeam}
                  disabled={loading}
                  className="flex flex-col items-center justify-center px-4 py-3 h-full rounded-lg bg-gray-800/60 backdrop-blur-sm text-white font-medium hover:bg-gray-700/60 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:transform-none"
                >
                  <img
                    src="/icons/iconleave.png"
                    alt="Leave Team"
                    className="w-8 h-8 mb-2"
                  />
                  {loading ? "Leaving..." : "Leave Team"}
                </button>
              </div>
            </div>
          )}
        </div>

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
        </div>

        {/* Tab Content */}
        <TeamMatchesSection
          teamName={team.teamName}
          teamId={team._id}
          tactics={team.tactics || []}
          isTeamCaptain={isCaptain}
          currentTeam={team}
          onLastMatchClick={onLastMatchClick}
        />
      </div>

      {/* Add PlayerContractModal */}
      <PlayerContractModal
        isOpen={contractModalOpen}
        onClose={() => setContractModalOpen(false)}
        playerAddress={playerAddress}
        playerData={playerData}
        isBottomSheet={true}
      />

      {/* Jersey Customization Modal */}
      <JerseyCustomizationModal
        isOpen={jerseyModalOpen}
        onClose={() => setJerseyModalOpen(false)}
        onSave={handleJerseyUpdate}
        currentJersey={team.jersey}
        isBottomSheet={true}
      />

      {error && (
        <div className="mt-2 text-red-400 text-center text-sm">{error}</div>
      )}
    </div>
  );
}
