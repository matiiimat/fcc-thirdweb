"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import sdk from "@farcaster/frame-sdk";
import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ContractPaymentModal from "../components/ContractPaymentModal";

interface PlayerContract {
  requestedAmount: number;
  durationInSeasons: number;
  status: "pending" | "active" | "rejected" | "expired";
  startDate: Date | null;
  endDate: Date | null;
  seasonStarted: number;
  seasonEnds: number;
  transactionHash?: string;
}

interface Player {
  ethAddress: string;
  playerName: string;
  username?: string;
  isBot?: boolean;
  contract?: PlayerContract;
  stats?: {
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
export default function ManageTeamPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<any>();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [teamData, setTeamData] = useState<{
    teamName: string;
    players: string[];
    isPublic: boolean;
    captainAddress: string;
  } | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [contractAmount, setContractAmount] = useState(0);
  const [contractPlayerId, setContractPlayerId] = useState("");
  const [contractDuration, setContractDuration] = useState(0);
  const [hasPendingContracts, setHasPendingContracts] = useState(false);

  // Check if the current user is the team captain
  const isCaptain =
    isConnected &&
    !!address &&
    !!teamData &&
    address?.toLowerCase() === teamData?.captainAddress?.toLowerCase();

  // Fetch the balance of the captain's wallet (only if the user is the captain)
  const {
    data: balanceData,
    isLoading: isBalanceLoading,
    isError: isBalanceError,
  } = useBalance({
    address: isCaptain ? address : undefined,
  });

  // Farcaster Frame Integration
  useEffect(() => {
    const load = async () => {
      try {
        await sdk.actions.ready();
        setContext(await sdk.context);
      } catch (error) {
        console.error("Error initializing Farcaster Frame SDK:", error);
      }
    };

    if (!isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
    }
  }, [isSDKLoaded]);

  const handleVisibilityToggle = async () => {
    if (!teamData || !address) return;

    try {
      setUpdating(true);
      const response = await fetch("/api/teams/visibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamName: teamData.teamName,
          captainAddress: address,
          isPublic: !teamData.isPublic,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update team visibility");
      }

      setTeamData((prev) =>
        prev ? { ...prev, isPublic: !prev.isPublic } : null
      );
    } catch (error) {
      console.error("Error updating team visibility:", error);
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      if (isConnected && address) {
        try {
          // Fetch team data
          const teamsResponse = await fetch("/api/teams");
          const teams = await teamsResponse.json();

          // First check if user is a captain
          let team = teams.find(
            (t: any) => t.captainAddress.toLowerCase() === address.toLowerCase()
          );

          // If not a captain, check if user is a member of any team
          if (!team) {
            // Fetch player data to get their team
            const playerResponse = await fetch(
              `/api/players/address/${address}`
            );
            if (playerResponse.ok) {
              const playerData = await playerResponse.json();
              if (playerData.team && playerData.team !== "Unassigned") {
                // Find the team the player belongs to
                team = teams.find((t: any) => t.teamName === playerData.team);
              }
            }
          }

          if (team) {
            setTeamData(team);
            console.log("Team data loaded:", team);

            // Fetch players
            const playersPromises = team.players.map(
              async (address: string) => {
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
                    stats: bot.stats,
                    isBot: true,
                  };
                } else {
                  // Regular player
                  const response = await fetch(
                    `/api/players/address/${address}`
                  );
                  if (!response.ok) {
                    throw new Error(
                      `Failed to fetch player data for ${address}`
                    );
                  }
                  const data = await response.json();
                  return {
                    ethAddress: data.ethAddress,
                    playerName: data.playerName,
                    username: data.username,
                    stats: data.stats,
                    contract: data.contract,
                    isBot: false,
                  };
                }
              }
            );
            const playerData = await Promise.all(playersPromises);
            setPlayers(playerData);

            // Check if there are any pending contract requests
            const hasPending = playerData.some(
              (player) =>
                player.contract && player.contract.status === "pending"
            );
            setHasPendingContracts(hasPending);
          }
        } catch (error) {
          console.error("Error initializing:", error);
        }
        setLoading(false);
      } else {
        setLoading(false);
        router.push("/");
      }
    };

    init();
  }, [isConnected, address, router]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
        <Header pageName={isCaptain ? "Manage Team" : "Players"} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-2 text-green-400 text-sm">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isConnected || !address || !teamData) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
      <Header pageName={isCaptain ? "Manage Team" : "Players"} />
      <main className="flex-1 container max-w-4xl mx-auto px-2 sm:px-6 py-2 sm:py-4 pb-32">
        {/* Contract Warning Message */}
        <div className="mb-4 p-3 bg-yellow-900/30 border border-yellow-700/50 rounded-lg text-yellow-400 text-sm">
          <p className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            You cannot leave the team while under contract
          </p>
        </div>

        <div className="glass-container p-3 sm:p-6 rounded-xl">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Team Players
              </h2>
              <span className="text-sm text-gray-400">
                {players.length} Players
              </span>
            </div>
            {isCaptain && (
              <>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleVisibilityToggle}
                    disabled={updating}
                    className="text-sm px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        teamData?.isPublic ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></span>
                    <span className="text-gray-300">
                      {teamData?.isPublic ? "Public" : "Private"}
                    </span>
                  </button>
                  <span className="text-xs text-gray-500">
                    {teamData?.isPublic
                      ? "Team is visible to other players"
                      : "Team is hidden from other players"}
                  </span>
                </div>

                {/* Team Budget - Only visible to captain */}
                <div className="mt-3 p-3 bg-gradient-to-r from-green-900/30 to-green-700/30 rounded-lg">
                  <h3 className="text-green-400 font-medium text-sm mb-1">
                    Team Budget
                  </h3>
                  {isBalanceLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500 mr-2"></div>
                      <span className="text-gray-300 text-sm">
                        Loading balance...
                      </span>
                    </div>
                  ) : isBalanceError ? (
                    <p className="text-red-400 text-sm">
                      Error loading wallet balance
                    </p>
                  ) : (
                    <div className="flex items-center">
                      <span className="text-green-400 font-semibold text-xl">
                        {balanceData
                          ? parseFloat(balanceData.formatted).toFixed(3)
                          : "0.000"}{" "}
                        ETH
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {players.map((player) => (
              <div
                key={player.ethAddress}
                className="glass-container p-3 sm:p-4 rounded-lg flex flex-col"
              >
                {/* Player Header */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-bold text-white text-lg">
                      {player.isBot
                        ? player.playerName
                        : player.username || player.playerName}
                    </div>
                    <div className="text-sm text-gray-400">
                      {player.isBot ? "Bot Player" : "Human Player"}
                    </div>
                  </div>
                </div>

                {/* Stats Section */}
                {player.stats && (
                  <div className="flex-1">
                    <div className="grid grid-cols-4 gap-2 text-sm mb-4">
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
                  </div>
                )}

                {/* Contract Information */}
                <div className="mt-2 p-2 bg-gray-800/50 rounded-lg">
                  {player.contract ? (
                    <>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-gray-400 text-xs">Contract:</span>
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
                            <span>{player.contract.requestedAmount} ETH</span>
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
                          <div className="text-xs text-gray-300 flex justify-between">
                            <span>Expires:</span>
                            <span>Season {player.contract.seasonEnds}</span>
                          </div>
                        </>
                      )}

                      {player.contract.status === "pending" && (
                        <>
                          <div className="text-xs text-gray-300 flex justify-between">
                            <span>Request:</span>
                            <span>{player.contract.requestedAmount} ETH</span>
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

                {/* Action Buttons - Only visible to team captain */}
                {isCaptain && (
                  <div className="flex gap-2 mt-2">
                    {player.contract?.status === "pending" ? (
                      <>
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
                                    "x-wallet-address": address,
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
                                    "x-wallet-address": address,
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

                              // Refresh the page to show updated contract status
                              window.location.reload();
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
                      </>
                    ) : (
                      <>
                        {/* Renew Contract button removed - only show for players without active contracts */}
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => router.push("/team")}
            className="px-6 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
          >
            Back to Team
          </button>
        </div>
      </main>
      <Footer />

      {/* Contract Payment Modal */}
      {showPaymentModal && selectedPlayer && (
        <ContractPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          playerAddress={selectedPlayer.ethAddress}
          playerId={contractPlayerId}
          amount={contractAmount}
          durationInSeasons={contractDuration}
          onSuccess={() => {
            // Refresh the page to show updated contract status
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
