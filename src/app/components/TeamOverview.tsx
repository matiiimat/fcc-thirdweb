import { useState, useEffect } from "react";
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

  const [playerData, setPlayerData] = useState<any>(null);
  const [pendingContractRequests, setPendingContractRequests] = useState(0);
  const [showContractModal, setShowContractModal] = useState(false);
  const [contractAmount, setContractAmount] = useState<number>(0.02);
  const [contractDuration, setContractDuration] = useState<number>(2);
  const [contractLoading, setContractLoading] = useState(false);
  const [contractError, setContractError] = useState<string | null>(null);

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

  const handleContractRequest = async () => {
    try {
      setContractLoading(true);
      setContractError(null);

      const response = await fetch("/api/contracts/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-wallet-address": playerAddress,
        },
        body: JSON.stringify({
          requestedAmount: contractAmount,
          durationInSeasons: contractDuration,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to request contract");
      }

      // Update player data with new contract
      setPlayerData({
        ...playerData,
        contract: data.contract,
      });

      setShowContractModal(false);
    } catch (error) {
      console.error("Error requesting contract:", error);
      setContractError(
        error instanceof Error ? error.message : "Failed to request contract"
      );
    } finally {
      setContractLoading(false);
    }
  };

  const isTeamCaptain =
    team.captainAddress.toLowerCase() === playerAddress.toLowerCase();

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center justify-center gap-2">
        <div className="flex items-center gap-3">
          <Jersey jersey={team.jersey} size="medium" />
          <h3 className="text-xl font-bold text-yellow-400">{team.teamName}</h3>
        </div>

        {/* Contract Summary - Only visible to non-captains */}
        {!isTeamCaptain && playerData?.contract && (
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
        )}
      </div>

      <div className="space-y-4">
        <div className="grid gap-3">
          {isTeamCaptain ? (
            <div className="glass-container p-4 rounded-lg shadow-lg">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => router.push("/manageteam")}
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
                  onClick={() => router.push("/teammanagement")}
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
                  onClick={() => router.push("/scouting")}
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
                  onClick={() => router.push("/manageteam")}
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
                  onClick={() => router.push("/playertactics")}
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
                  onClick={handleLeaveTeam}
                  disabled={loading}
                  className="flex flex-col items-center justify-center px-4 py-3 h-full rounded-lg bg-gray-800/60 backdrop-blur-sm text-white font-medium hover:bg-gray-700/60 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:transform-none col-span-2"
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
            teamId={team._id}
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

      {/* Contract Section - Only visible to non-captains */}
      {!isTeamCaptain && (
        <div className="mt-4 glass-container p-4 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-3">
            Player Contract
          </h3>

          {playerData?.contract ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Status:</span>
                <span
                  className={`font-medium ${
                    playerData.contract.status === "active"
                      ? "text-green-400"
                      : playerData.contract.status === "pending"
                      ? "text-yellow-400"
                      : playerData.contract.status === "rejected"
                      ? "text-red-400"
                      : "text-gray-400"
                  }`}
                >
                  {playerData.contract.status.charAt(0).toUpperCase() +
                    playerData.contract.status.slice(1)}
                </span>
              </div>

              {playerData.contract.status === "active" && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Amount:</span>
                    <span className="text-white">
                      {playerData.contract.requestedAmount} ETH
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Duration:</span>
                    <span className="text-white">
                      {playerData.contract.durationInSeasons} seasons
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Expires:</span>
                    <span className="text-white">
                      Season {playerData.contract.seasonEnds}
                    </span>
                  </div>
                </>
              )}

              {playerData.contract.status === "pending" && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Requested:</span>
                    <span className="text-white">
                      {playerData.contract.requestedAmount} ETH
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Duration:</span>
                    <span className="text-white">
                      {playerData.contract.durationInSeasons} seasons
                    </span>
                  </div>
                  <div className="flex flex-col items-center mt-2">
                    <div className="text-yellow-400 text-sm mb-2">
                      Waiting for captain approval
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          setContractLoading(true);
                          setContractError(null);

                          const response = await fetch(
                            "/api/contracts/cancel",
                            {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                                "x-wallet-address": playerAddress,
                              },
                            }
                          );

                          if (!response.ok) {
                            const data = await response.json();
                            throw new Error(
                              data.error || "Failed to cancel contract request"
                            );
                          }

                          // Update player data with contract removed
                          setPlayerData({
                            ...playerData,
                            contract: undefined,
                          });
                        } catch (error) {
                          console.error("Error cancelling contract:", error);
                          setContractError(
                            error instanceof Error
                              ? error.message
                              : "Failed to cancel contract request"
                          );
                        } finally {
                          setContractLoading(false);
                        }
                      }}
                      className="px-4 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs transition-colors"
                    >
                      Cancel Request
                    </button>
                  </div>
                </>
              )}

              {playerData.contract.status === "rejected" && (
                <div className="text-center mt-2">
                  <p className="text-red-400 text-sm mb-2">
                    Your contract request was rejected
                  </p>
                  <button
                    onClick={() => setShowContractModal(true)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                  >
                    Request New Contract
                  </button>
                </div>
              )}

              {playerData.contract.status === "expired" && (
                <div className="text-center mt-2">
                  <p className="text-gray-400 text-sm mb-2">
                    Your contract has expired
                  </p>
                  <button
                    onClick={() => setShowContractModal(true)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                  >
                    Request New Contract
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-3">
                You don&apos;t have a contract with this team. Request one to
                secure your position and earn ETH.
              </p>
              <button
                onClick={() => setShowContractModal(true)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
              >
                Request Contract
              </button>
            </div>
          )}
        </div>
      )}

      {/* Contract Request Modal */}
      {showContractModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-container p-4 w-[90%] max-w-md rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold text-white mb-4">
              Request Contract
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">
                  Contract Amount (ETH)
                </label>
                <div className="flex items-center">
                  <button
                    onClick={() => {
                      const newAmount = Math.max(0.001, contractAmount - 0.001);
                      setContractAmount(parseFloat(newAmount.toFixed(3)));
                    }}
                    className="px-3 py-2 bg-gray-700 rounded-l-lg text-white hover:bg-gray-600"
                  >
                    -
                  </button>
                  <div className="flex-1 px-3 py-2 bg-gray-800 text-white text-center">
                    {contractAmount.toFixed(3)} ETH
                  </div>
                  <button
                    onClick={() => {
                      const newAmount = Math.min(1, contractAmount + 0.001);
                      setContractAmount(parseFloat(newAmount.toFixed(3)));
                    }}
                    className="px-3 py-2 bg-gray-700 rounded-r-lg text-white hover:bg-gray-600"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1">
                  Duration (Seasons)
                </label>
                <div className="flex items-center">
                  <button
                    onClick={() => {
                      const newDuration = Math.max(1, contractDuration - 1);
                      setContractDuration(newDuration);
                    }}
                    className="px-3 py-2 bg-gray-700 rounded-l-lg text-white hover:bg-gray-600"
                  >
                    -
                  </button>
                  <div className="flex-1 px-3 py-2 bg-gray-800 text-white text-center">
                    {contractDuration}{" "}
                    {contractDuration === 1 ? "Season" : "Seasons"}
                  </div>
                  <button
                    onClick={() => {
                      const newDuration = Math.min(5, contractDuration + 1);
                      setContractDuration(newDuration);
                    }}
                    className="px-3 py-2 bg-gray-700 rounded-r-lg text-white hover:bg-gray-600"
                  >
                    +
                  </button>
                </div>
              </div>

              {contractError && (
                <div className="text-red-400 text-sm">{contractError}</div>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setShowContractModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleContractRequest}
                  disabled={contractLoading}
                  className={`flex-1 px-4 py-2 bg-green-600 text-white rounded-lg ${
                    contractLoading ? "opacity-50" : "hover:bg-green-700"
                  }`}
                >
                  {contractLoading ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </div>
          </div>
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
