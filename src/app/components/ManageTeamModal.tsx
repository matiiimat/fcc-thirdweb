"use client";

import { useState, useEffect } from "react";
import ContractPaymentModal from "./ContractPaymentModal";

interface Player {
  _id: string;
  playerId: string;
  playerName: string;
  username?: string;
  ethAddress: string;
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
  contract?: {
    status: "active" | "pending" | "rejected" | "expired";
    requestedAmount: number;
    durationInSeasons: number;
    seasonEnds?: number;
  };
}

interface TeamData {
  _id: string;
  teamName: string;
  captainAddress: string;
  isPublic: boolean;
  budget?: number;
}

interface ManageTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  captainAddress: string;
  teamId: string;
  isBottomSheet?: boolean;
}

export default function ManageTeamModal({
  isOpen,
  onClose,
  captainAddress,
  teamId,
  isBottomSheet = false,
}: ManageTeamModalProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [contractAmount, setContractAmount] = useState(0);
  const [contractPlayerId, setContractPlayerId] = useState("");
  const [contractDuration, setContractDuration] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen || !captainAddress || !teamId) return;

      try {
        setLoading(true);

        // Fetch team data first
        const teamsResponse = await fetch("/api/teams");
        const teams = await teamsResponse.json();

        // Find the team by ID
        const team = teams.find((t: any) => t._id === teamId);

        if (team) {
          setTeamData(team);

          // Fetch players using the same approach as in manageteam/page.tsx
          const playersPromises = team.players.map(async (address: string) => {
            if (address.toLowerCase().startsWith("0xbot")) {
              // Fetch the specific bot
              const botsResponse = await fetch(
                `/api/bots?address=${encodeURIComponent(address)}`
              );
              if (!botsResponse.ok) {
                throw new Error(`Failed to fetch bot data for ${address}`);
              }
              const botsData = await botsResponse.json();
              const bot = botsData.bots[0];
              return {
                ethAddress: bot.ethAddress,
                playerName: bot.playerName,
                isBot: true,
                stats: bot.stats,
              };
            } else {
              // Fetch the specific player
              const playerResponse = await fetch(
                `/api/players/address/${encodeURIComponent(address)}`
              );
              if (!playerResponse.ok) {
                throw new Error(`Failed to fetch player data for ${address}`);
              }
              const playerData = await playerResponse.json();
              return {
                ethAddress: playerData.ethAddress,
                playerName: playerData.playerName,
                username: playerData.username,
                stats: playerData.stats,
                contract: playerData.contract,
              };
            }
          });

          const playersData = await Promise.all(playersPromises);
          setPlayers(playersData);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, captainAddress, teamId]);

  const handleVisibilityToggle = async () => {
    if (!teamData) return;

    try {
      setUpdating(true);
      const response = await fetch("/api/teams/visibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamName: teamData.teamName,
          captainAddress: captainAddress,
          isPublic: !teamData.isPublic,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update team visibility");
      }

      // Update local state
      setTeamData({
        ...teamData,
        isPublic: !teamData.isPublic,
      });
    } catch (error) {
      console.error("Error updating team visibility:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update team visibility"
      );
    } finally {
      setUpdating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-end justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`
          bg-gradient-to-b from-[#1a1d21] to-[#0d0f12] 
          rounded-t-xl w-full max-w-4xl h-[75vh] flex flex-col
          transform transition-all duration-300 ease-out
          ${isBottomSheet ? "animate-slide-up" : "animate-fade-in"}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Manage Team</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {/* Team Info Skeleton */}
              <div className="w-full h-12 bg-gray-700/30 rounded animate-pulse mb-4"></div>

              {/* Players List Skeleton */}
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-full h-24 bg-gray-700/30 rounded animate-pulse mb-3"
                  style={{ animationDelay: `${i * 0.05}s` }}
                ></div>
              ))}
            </div>
          ) : (
            <div className="overflow-y-auto h-[65vh] pr-1">
              {teamData && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-bold text-white">
                      Team Players
                    </h2>
                    <span className="text-sm text-gray-400">
                      {players.length} Players
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <button
                      onClick={handleVisibilityToggle}
                      disabled={updating}
                      className="text-sm px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          teamData.isPublic ? "bg-green-500" : "bg-red-500"
                        }`}
                      ></span>
                      <span className="text-gray-300">
                        {teamData.isPublic ? "Public" : "Private"}
                      </span>
                    </button>
                    <span className="text-xs text-gray-500">
                      {teamData.isPublic
                        ? "Team is visible to other players"
                        : "Team is hidden from other players"}
                    </span>
                  </div>

                  {/* Team Budget */}
                  {teamData.budget !== undefined && (
                    <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300">Team Budget:</span>
                        <span className="text-green-400 font-medium">
                          {teamData.budget.toFixed(3)} ETH
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Players List */}
              <div className="space-y-4">
                {players.map((player) => (
                  <div
                    key={player._id}
                    className="glass-container p-3 rounded-lg"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-white font-medium">
                          {player.username || player.playerName}
                        </h3>
                        <div className="text-xs text-gray-400">
                          {player.ethAddress.substring(0, 6)}...
                          {player.ethAddress.substring(
                            player.ethAddress.length - 4
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Player Stats */}
                    <div className="grid grid-cols-4 gap-1 mt-2">
                      <div className="flex items-center bg-gray-800/30 rounded p-1.5">
                        <span className="text-gray-400 w-8">STR</span>
                        <span className="text-green-400 ml-0.5">
                          {Math.round(player.stats.strength)}
                        </span>
                      </div>
                      <div className="flex items-center bg-gray-800/30 rounded p-1.5">
                        <span className="text-gray-400 w-8">STA</span>
                        <span className="text-green-400 ml-0.5">
                          {Math.round(player.stats.stamina)}
                        </span>
                      </div>
                      <div className="flex items-center bg-gray-800/30 rounded p-1.5">
                        <span className="text-gray-400 w-8">PAS</span>
                        <span className="text-green-400 ml-0.5">
                          {Math.round(player.stats.passing)}
                        </span>
                      </div>
                      <div className="flex items-center bg-gray-800/30 rounded p-1.5">
                        <span className="text-gray-400 w-8">SHO</span>
                        <span className="text-green-400 ml-0.5">
                          {Math.round(player.stats.shooting)}
                        </span>
                      </div>
                      <div className="flex items-center bg-gray-800/30 rounded p-1.5">
                        <span className="text-gray-400 w-8">DEF</span>
                        <span className="text-green-400 ml-0.5">
                          {Math.round(player.stats.defending)}
                        </span>
                      </div>
                      <div className="flex items-center bg-gray-800/30 rounded p-1.5">
                        <span className="text-gray-400 w-8">SPD</span>
                        <span className="text-green-400 ml-0.5">
                          {Math.round(player.stats.speed)}
                        </span>
                      </div>
                      <div className="flex items-center bg-gray-800/30 rounded p-1.5">
                        <span className="text-gray-400 w-8">POS</span>
                        <span className="text-green-400 ml-0.5">
                          {Math.round(player.stats.positioning)}
                        </span>
                      </div>
                      <div className="flex items-center bg-gray-800/30 rounded p-1.5">
                        <span className="text-gray-400 w-8">WRK</span>
                        <span className="text-green-400 ml-0.5">
                          {Math.round(player.stats.workEthic)}
                        </span>
                      </div>
                    </div>

                    {/* Contract Information */}
                    <div className="mt-2 p-2 bg-gray-800/50 rounded-lg">
                      {player.contract ? (
                        <>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-gray-400 text-xs">
                              Contract:
                            </span>
                            <span
                              className={`text-xs font-medium ${
                                player.contract.status === "active"
                                  ? "text-green-400"
                                  : player.contract.status === "pending"
                                  ? "text-yellow-400"
                                  : player.contract.status === "rejected"
                                  ? "text-red-400"
                                  : "text-gray-400"
                              }`}
                            >
                              {player.contract.status.charAt(0).toUpperCase() +
                                player.contract.status.slice(1)}
                            </span>
                          </div>

                          {player.contract.status === "active" && (
                            <>
                              <div className="text-xs text-gray-300 flex justify-between">
                                <span>Amount:</span>
                                <span>
                                  {player.contract.requestedAmount} ETH
                                </span>
                              </div>
                              <div className="text-xs text-gray-300 flex justify-between">
                                <span>Length:</span>
                                <span>
                                  {player.contract.durationInSeasons}{" "}
                                  {player.contract.durationInSeasons === 1
                                    ? "season"
                                    : "seasons"}
                                </span>
                              </div>
                              {player.contract.seasonEnds && (
                                <div className="text-xs text-gray-300 flex justify-between">
                                  <span>Expires:</span>
                                  <span>
                                    Season {player.contract.seasonEnds}
                                  </span>
                                </div>
                              )}
                            </>
                          )}

                          {player.contract.status === "pending" && (
                            <>
                              <div className="text-xs text-gray-300 flex justify-between">
                                <span>Request:</span>
                                <span>
                                  {player.contract.requestedAmount} ETH
                                </span>
                              </div>
                              <div className="text-xs text-gray-300 flex justify-between mb-2">
                                <span>Length:</span>
                                <span>
                                  {player.contract.durationInSeasons}{" "}
                                  {player.contract.durationInSeasons === 1
                                    ? "season"
                                    : "seasons"}
                                </span>
                              </div>
                            </>
                          )}
                        </>
                      ) : (
                        <div className="text-xs text-gray-400 text-center">
                          No active contract
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    {player.contract?.status === "pending" && (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={async () => {
                            try {
                              setUpdating(true);
                              const response = await fetch(
                                "/api/contracts/respond",
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                    "x-wallet-address": captainAddress,
                                  },
                                  body: JSON.stringify({
                                    playerAddress: player.ethAddress,
                                    action: "accept",
                                  }),
                                }
                              );

                              if (!response.ok) {
                                const data = await response.json();
                                throw new Error(
                                  data.error || "Failed to accept contract"
                                );
                              }

                              const data = await response.json();

                              // Show payment modal
                              setSelectedPlayer(player);
                              setContractAmount(data.amount);
                              setContractPlayerId(data.playerId);
                              setContractDuration(data.durationInSeasons);
                              setShowPaymentModal(true);
                            } catch (error) {
                              console.error("Error accepting contract:", error);
                            } finally {
                              setUpdating(false);
                            }
                          }}
                          className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                        >
                          Sign Contract
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              setUpdating(true);
                              const response = await fetch(
                                "/api/contracts/respond",
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                    "x-wallet-address": captainAddress,
                                  },
                                  body: JSON.stringify({
                                    playerAddress: player.ethAddress,
                                    action: "reject",
                                  }),
                                }
                              );

                              if (!response.ok) {
                                const data = await response.json();
                                throw new Error(
                                  data.error || "Failed to reject contract"
                                );
                              }

                              // Refresh data
                              const playersResponse = await fetch(
                                `/api/teams/players?teamId=${teamId}`
                              );
                              if (playersResponse.ok) {
                                const playersData =
                                  await playersResponse.json();
                                setPlayers(playersData);
                              }
                            } catch (error) {
                              console.error("Error rejecting contract:", error);
                            } finally {
                              setUpdating(false);
                            }
                          }}
                          className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                        >
                          Reject Contract
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contract Payment Modal */}
      {showPaymentModal && selectedPlayer && (
        <ContractPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          playerAddress={selectedPlayer.ethAddress}
          playerId={contractPlayerId}
          amount={contractAmount}
          durationInSeasons={contractDuration}
          onSuccess={async () => {
            setShowPaymentModal(false);

            // Refresh data
            const playersResponse = await fetch(
              `/api/teams/players?teamId=${teamId}`
            );
            if (playersResponse.ok) {
              const playersData = await playersResponse.json();
              setPlayers(playersData);
            }
          }}
        />
      )}
    </div>
  );
}
