"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FormationDisplay from "../components/FormationDisplay";
import { ITactic, IPlayerPosition } from "../models/Team";

interface Player {
  ethAddress: string;
  playerName: string;
  username?: string;
  isBot?: boolean;
}

export default function PlayerTacticsPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();

  const [loading, setLoading] = useState(true);
  const [teamData, setTeamData] = useState<{
    teamName: string;
    players: string[];
  } | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [tactics, setTactics] = useState<ITactic[]>([]);
  const [selectedTactic, setSelectedTactic] = useState<ITactic | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const init = async () => {
      if (isConnected && address) {
        try {
          // Fetch player data to get their team
          const playerResponse = await fetch(`/api/players/address/${address}`);
          if (!playerResponse.ok) {
            throw new Error("Failed to fetch player data");
          }

          const playerData = await playerResponse.json();
          if (!playerData.team || playerData.team === "Unassigned") {
            setError("You are not assigned to a team");
            setLoading(false);
            return;
          }

          // Fetch team data
          const teamsResponse = await fetch("/api/teams");
          const teams = await teamsResponse.json();
          const team = teams.find((t: any) => t.teamName === playerData.team);

          if (!team) {
            setError("Team not found");
            setLoading(false);
            return;
          }

          setTeamData(team);

          // Fetch players
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
              };
            } else {
              // Regular player
              const response = await fetch(`/api/players/address/${address}`);
              if (!response.ok) {
                throw new Error(`Failed to fetch player data for ${address}`);
              }
              const data = await response.json();
              return {
                ethAddress: data.ethAddress,
                playerName: data.playerName,
                username: data.username,
                isBot: false,
              };
            }
          });

          const playerData2 = await Promise.all(playersPromises);
          setPlayers(playerData2);

          // Fetch tactics
          const tacticsResponse = await fetch(
            `/api/teams/tactics?teamName=${team.teamName}`
          );
          const tacticsData = await tacticsResponse.json();
          setTactics(tacticsData);

          if (tacticsData.length > 0) {
            setSelectedTactic(tacticsData[0]);
          }
        } catch (error) {
          console.error("Error initializing:", error);
          setError("Failed to load team tactics");
        }
        setLoading(false);
      } else {
        setLoading(false);
        router.push("/");
      }
    };

    init();
  }, [isConnected, address, router]);

  const handleTacticSelect = (tactic: ITactic) => {
    setSelectedTactic(tactic);
  };

  // Dummy function for FormationDisplay - no action on click in read-only mode
  const handlePositionClick = () => {};

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
        <Header pageName="Team Tactics" />
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

  if (!isConnected || !address) {
    return null;
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
        <Header pageName="Team Tactics" />
        <main className="flex-1 container max-w-4xl mx-auto px-3 sm:px-6 py-2 sm:py-4 pb-32">
          <div className="glass-container p-4 sm:p-6 rounded-xl">
            <div className="text-center text-red-400 py-8">{error}</div>
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => router.push("/manageteam")}
                className="px-6 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
              >
                Back to Team
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
      <Header pageName="Team Tactics" />
      <main className="flex-1 container max-w-4xl mx-auto px-3 sm:px-6 py-2 sm:py-4 pb-32">
        <div className="glass-container p-4 sm:p-6 rounded-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Team Tactics
            </h2>
            <div className="text-sm text-gray-400">{teamData?.teamName}</div>
          </div>

          {tactics.length === 0 ? (
            <div className="text-center py-8 text-yellow-400">
              No tactics saved yet - contact your coach to discuss them!
            </div>
          ) : (
            <>
              {/* Saved Tactics */}
              <div className="mb-6">
                <h3 className="text-sm sm:text-base font-medium text-white mb-2">
                  Saved Tactics
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {tactics.map((tactic) => (
                    <button
                      key={tactic.name}
                      onClick={() => handleTacticSelect(tactic)}
                      className={`
                        p-3 rounded-lg transition-all duration-300
                        ${
                          selectedTactic?.name === tactic.name
                            ? "bg-green-600 text-white"
                            : "glass-container hover:bg-gray-800"
                        }
                      `}
                    >
                      <div className="font-bold">{tactic.name}</div>
                      <div className="text-sm opacity-75">
                        {tactic.formation} • {tactic.tacticalStyle}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {selectedTactic && (
                <>
                  {/* Tactical Style Display */}
                  <div className="mb-6">
                    <h3 className="text-sm sm:text-base font-medium text-white mb-2">
                      Tactic
                    </h3>
                    <div className="glass-container p-3 rounded-lg">
                      <span className="text-green-400 font-bold">
                        {selectedTactic.tacticalStyle}
                      </span>
                    </div>
                  </div>

                  {/* Formation Display */}
                  <div className="mb-6">
                    <h3 className="text-sm sm:text-base font-medium text-white mb-2">
                      Formation
                    </h3>
                    <div className="glass-container p-3 rounded-lg">
                      <span className="text-green-400 font-bold">
                        {selectedTactic.formation}
                      </span>
                    </div>
                  </div>

                  {/* Formation Display */}
                  <div className="relative w-full aspect-[2/3] bg-green-900/20 rounded-xl overflow-hidden">
                    <FormationDisplay
                      formation={selectedTactic.formation}
                      playerPositions={selectedTactic.playerPositions}
                      onPositionClick={handlePositionClick}
                      availablePlayers={players}
                    />
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Back Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => router.push("/manageteam")}
            className="px-6 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
          >
            Back to Team
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
