"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useActiveWallet } from "thirdweb/react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import HireBotModal from "../components/HireBotModal";
import HirePlayerModal from "../components/HirePlayerModal";
import { IPlayerStats } from "../models/Player";

interface Player {
  _id: string;
  playerId: string;
  playerName: string;
  ethAddress: string;
  stats: IPlayerStats;
  team: string;
}

interface Bot extends Omit<Player, "_id"> {
  isBot: true;
}

export default function ScoutingPage() {
  const router = useRouter();
  const activeWallet = useActiveWallet();
  const wallet = activeWallet?.getAccount();
  const [activeTab, setActiveTab] = useState("players");
  const [players, setPlayers] = useState<Player[]>([]);
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isCaptain, setIsCaptain] = useState(false);
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [teamId, setTeamId] = useState<string>("");

  useEffect(() => {
    const checkCaptainStatus = async () => {
      if (!wallet) {
        router.push("/");
        return;
      }

      try {
        const response = await fetch("/api/teams");
        const teams = await response.json();
        const captainTeam = teams.find(
          (team: any) =>
            team.captainAddress.toLowerCase() === wallet.address.toLowerCase()
        );

        if (!captainTeam) {
          router.push("/team");
          return;
        }

        setIsCaptain(true);
        setTeamId(captainTeam._id);
      } catch (err) {
        console.error("Error checking captain status:", err);
        setError("Failed to verify captain status");
      }
    };

    checkCaptainStatus();
  }, [wallet, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isCaptain) return;

      try {
        if (activeTab === "players") {
          const response = await fetch("/api/players");
          if (!response.ok) {
            throw new Error("Failed to fetch unassigned players");
          }
          const players = await response.json();
          const unassignedPlayers = players.filter(
            (player: Player & { isBot?: boolean }) =>
              player.team === "Unassigned" && !player.isBot
          );
          setPlayers(unassignedPlayers);
        } else {
          const response = await fetch("/api/bots");
          if (!response.ok) {
            throw new Error("Failed to fetch bots");
          }
          const data = await response.json();
          setBots(data.bots);
        }
      } catch (err) {
        setError(`Failed to load ${activeTab}`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    fetchData();
  }, [activeTab, isCaptain]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
        <Header pageName="Scouting" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-2 text-sm text-green-400">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
        <Header pageName="Scouting" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-red-500 text-center text-sm px-4">{error}</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
      <Header pageName="Scouting" />
      <main className="flex-1 container mx-auto px-2 sm:px-4 py-2 sm:py-4">
        <div className="glass-container p-2 sm:p-6 w-full max-w-4xl mx-auto rounded-lg sm:rounded-2xl shadow-lg">
          <div className="flex border-b border-gray-700 mb-2 sm:mb-4">
            <button
              className={`flex-1 py-1.5 sm:py-2 text-center text-sm sm:text-base ${
                activeTab === "players"
                  ? "text-white border-b-2 border-green-500"
                  : "text-gray-400"
              }`}
              onClick={() => setActiveTab("players")}
            >
              Players
            </button>
            <button
              className={`flex-1 py-1.5 sm:py-2 text-center text-sm sm:text-base ${
                activeTab === "bots"
                  ? "text-white border-b-2 border-green-500"
                  : "text-gray-400"
              }`}
              onClick={() => setActiveTab("bots")}
            >
              Bots
            </button>
          </div>

          <div className="overflow-x-auto -mx-2 sm:mx-0">
            <table className="w-full">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="py-2 sm:py-3 px-2 text-left text-xs sm:text-sm">
                    Name
                  </th>
                  <th className="py-2 sm:py-3 px-2 text-center text-xs sm:text-sm">
                    STR
                  </th>
                  <th className="py-2 sm:py-3 px-2 text-center text-xs sm:text-sm">
                    STA
                  </th>
                  <th className="py-2 sm:py-3 px-2 text-center text-xs sm:text-sm">
                    PAS
                  </th>
                  <th className="py-2 sm:py-3 px-2 text-center text-xs sm:text-sm">
                    SHO
                  </th>
                  <th className="py-2 sm:py-3 px-2 text-center text-xs sm:text-sm">
                    DEF
                  </th>
                  <th className="py-2 sm:py-3 px-2 text-center text-xs sm:text-sm">
                    SPD
                  </th>
                  <th className="py-2 sm:py-3 px-2 text-center text-xs sm:text-sm">
                    POS
                  </th>
                  <th className="py-2 sm:py-3 px-2 text-center text-xs sm:text-sm">
                    WRK
                  </th>
                </tr>
              </thead>
              <tbody>
                {activeTab === "players"
                  ? players.map((player) => (
                      <tr
                        key={player._id}
                        className="text-gray-300 border-b border-gray-700 active:bg-[#2a2d31]/50 sm:hover:bg-[#2a2d31]/50 transition-colors duration-200 cursor-pointer"
                        onClick={() => setSelectedPlayer(player)}
                        style={{ cursor: "pointer" }}
                      >
                        <td className="py-2 sm:py-3 px-2 text-xs sm:text-sm">
                          {player.playerName}
                        </td>
                        <td className="py-2 sm:py-3 px-2 text-center text-xs sm:text-sm">
                          {Math.round(player.stats.strength)}
                        </td>
                        <td className="py-2 sm:py-3 px-2 text-center text-xs sm:text-sm">
                          {Math.round(player.stats.stamina)}
                        </td>
                        <td className="py-2 sm:py-3 px-2 text-center text-xs sm:text-sm">
                          {Math.round(player.stats.passing)}
                        </td>
                        <td className="py-2 sm:py-3 px-2 text-center text-xs sm:text-sm">
                          {Math.round(player.stats.shooting)}
                        </td>
                        <td className="py-2 sm:py-3 px-2 text-center text-xs sm:text-sm">
                          {Math.round(player.stats.defending)}
                        </td>
                        <td className="py-2 sm:py-3 px-2 text-center text-xs sm:text-sm">
                          {Math.round(player.stats.speed)}
                        </td>
                        <td className="py-2 sm:py-3 px-2 text-center text-xs sm:text-sm">
                          {Math.round(player.stats.positioning)}
                        </td>
                        <td className="py-2 sm:py-3 px-2 text-center text-xs sm:text-sm">
                          {Math.round(player.stats.workEthic)}
                        </td>
                      </tr>
                    ))
                  : bots.map((bot) => (
                      <tr
                        key={bot.ethAddress}
                        className="text-gray-300 border-b border-gray-700 active:bg-[#2a2d31]/50 sm:hover:bg-[#2a2d31]/50 transition-colors duration-200"
                        onClick={() => setSelectedBot(bot)}
                        style={{ cursor: "pointer" }}
                      >
                        <td className="py-2 sm:py-3 px-2 text-xs sm:text-sm">
                          {bot.playerName}
                        </td>
                        <td className="py-2 sm:py-3 px-2 text-center text-xs sm:text-sm">
                          {bot.stats.strength}
                        </td>
                        <td className="py-2 sm:py-3 px-2 text-center text-xs sm:text-sm">
                          {Math.round(bot.stats.stamina)}
                        </td>
                        <td className="py-2 sm:py-3 px-2 text-center text-xs sm:text-sm">
                          {Math.round(bot.stats.passing)}
                        </td>
                        <td className="py-2 sm:py-3 px-2 text-center text-xs sm:text-sm">
                          {Math.round(bot.stats.shooting)}
                        </td>
                        <td className="py-2 sm:py-3 px-2 text-center text-xs sm:text-sm">
                          {Math.round(bot.stats.defending)}
                        </td>
                        <td className="py-2 sm:py-3 px-2 text-center text-xs sm:text-sm">
                          {Math.round(bot.stats.speed)}
                        </td>
                        <td className="py-2 sm:py-3 px-2 text-center text-xs sm:text-sm">
                          {Math.round(bot.stats.positioning)}
                        </td>
                        <td className="py-2 sm:py-3 px-2 text-center text-xs sm:text-sm">
                          {Math.round(bot.stats.workEthic)}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Status Messages */}
        {(error || success) && (
          <div
            className={`mt-4 p-3 rounded-lg text-center ${
              error
                ? "bg-red-500/20 text-red-300"
                : "bg-green-500/20 text-green-300"
            }`}
          >
            {error || success}
          </div>
        )}

        {/* Back Button */}
        <div className="mt-6 flex justify-center pb-20">
          <button
            onClick={() => router.push("/team")}
            className="px-6 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
          >
            Back
          </button>
        </div>
      </main>
      <Footer />

      {/* Hire Bot Modal */}
      <HireBotModal
        isOpen={!!selectedBot}
        onClose={() => setSelectedBot(null)}
        onConfirm={async () => {
          if (!selectedBot || !wallet) return;

          try {
            const response = await fetch("/api/teams/hire-bot", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                botAddress: selectedBot.ethAddress,
                captainAddress: wallet.address,
              }),
            });

            if (!response.ok) {
              const data = await response.json();
              throw new Error(data.error || "Failed to hire bot");
            }

            setSuccess(`Successfully hired ${selectedBot.playerName}!`);

            // Refresh the team data to include the new bot
            const teamsResponse = await fetch("/api/teams");
            if (!teamsResponse.ok) {
              throw new Error("Failed to refresh team data");
            }
            const teamsData = await teamsResponse.json();
            const captainTeam = teamsData.find(
              (t: any) =>
                t.captainAddress.toLowerCase() === wallet.address.toLowerCase()
            );

            if (!captainTeam) {
              throw new Error("Failed to find captain's team");
            }

            // Remove the hired bot from the available bots list
            setBots((prevBots) =>
              prevBots.filter((b) => b.ethAddress !== selectedBot.ethAddress)
            );

            // Refresh the players list to ensure hired bots don't show up
            const playersResponse = await fetch("/api/players");
            if (!playersResponse.ok) {
              throw new Error("Failed to refresh players data");
            }
            const playersData = await playersResponse.json();
            const unassignedPlayers = playersData.filter(
              (player: Player & { isBot?: boolean }) =>
                player.team === "Unassigned" && !player.isBot
            );
            setPlayers(unassignedPlayers);
          } catch (err: any) {
            setError(err.message || "Failed to hire bot");
          }
          setSelectedBot(null);
        }}
        botName={selectedBot?.playerName || ""}
      />

      {/* Hire Player Modal */}
      <HirePlayerModal
        isOpen={!!selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
        onConfirm={async () => {
          if (!selectedPlayer || !wallet || !teamId) return;

          try {
            const response = await fetch("/api/notifications", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ethAddress: wallet.address,
              },
              body: JSON.stringify({
                fromTeamId: teamId,
                toPlayerId: selectedPlayer.playerId,
                type: "TEAM_INVITATION",
              }),
            });

            if (!response.ok) {
              const data = await response.json();
              throw new Error(data.error || "Failed to send invitation");
            }

            setSuccess(
              `Successfully sent invitation to ${selectedPlayer.playerName}!`
            );

            // Remove the invited player from the available players list
            setPlayers((prevPlayers) =>
              prevPlayers.filter((p) => p._id !== selectedPlayer._id)
            );
          } catch (err: any) {
            setError(err.message || "Failed to send invitation");
          }
          setSelectedPlayer(null);
        }}
        playerName={selectedPlayer?.playerName || ""}
      />
    </div>
  );
}
