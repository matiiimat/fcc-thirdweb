"use client";

import { useEffect, useState } from "react";
import { useActiveWallet } from "thirdweb/react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";

interface Player {
  ethAddress: string;
  playerName: string;
  isBot?: boolean;
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
  const activeWallet = useActiveWallet();
  const wallet = activeWallet?.getAccount();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [teamData, setTeamData] = useState<{
    teamName: string;
    players: string[];
  } | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);

  useEffect(() => {
    const init = async () => {
      if (wallet) {
        try {
          // Fetch team data
          const teamsResponse = await fetch("/api/teams");
          const teams = await teamsResponse.json();
          const team = teams.find(
            (t: any) =>
              t.captainAddress.toLowerCase() === wallet.address.toLowerCase()
          );

          if (team) {
            setTeamData(team);

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
                    stats: data.stats,
                    isBot: false,
                  };
                }
              }
            );
            const playerData = await Promise.all(playersPromises);
            setPlayers(playerData);
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
  }, [wallet, router]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
        <Header pageName="Manage Team" xp={0} />
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

  if (!wallet || !teamData) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
      <Header pageName="Manage Team" xp={0} />
      <main className="flex-1 container max-w-4xl mx-auto px-3 sm:px-6 py-2 sm:py-4 pb-32">
        <div className="glass-container p-4 sm:p-6 rounded-xl">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">
            Team Players
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {players.map((player) => (
              <div
                key={player.ethAddress}
                className="glass-container p-4 rounded-lg"
              >
                <div className="font-bold text-white">{player.playerName}</div>
                <div className="text-sm text-gray-400">
                  {player.isBot ? "Bot Player" : "Human Player"}
                </div>
                {player.stats && (
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-400">STR: </span>
                      <span className="text-green-400">
                        {player.stats.strength}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">STA: </span>
                      <span className="text-green-400">
                        {player.stats.stamina}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">PAS: </span>
                      <span className="text-green-400">
                        {player.stats.passing}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">SHO: </span>
                      <span className="text-green-400">
                        {player.stats.shooting}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">DEF: </span>
                      <span className="text-green-400">
                        {player.stats.defending}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">SPD: </span>
                      <span className="text-green-400">
                        {player.stats.speed}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">POS: </span>
                      <span className="text-green-400">
                        {player.stats.positioning}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">WRK: </span>
                      <span className="text-green-400">
                        {player.stats.workEthic}
                      </span>
                    </div>
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
    </div>
  );
}
