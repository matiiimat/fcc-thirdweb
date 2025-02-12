"use client";

import { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { PLAYER_CONSTANTS } from "@/app/lib/constants";
import { useActiveWallet } from "thirdweb/react";
import { useRouter } from "next/navigation";

interface LeaderboardPlayer {
  _id: string;
  playerName: string;
  totalPoints: number;
}

interface PlayerData {
  xp: number;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("players");
  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const activeWallet = useActiveWallet();
  const wallet = activeWallet?.getAccount();
  const [player, setPlayer] = useState<PlayerData | null>(null);

  // Fetch player data for XP
  useEffect(() => {
    async function fetchPlayer() {
      if (!wallet) {
        return;
      }

      try {
        const response = await fetch(
          `/api/players/address/${encodeURIComponent(wallet.address)}`
        );
        if (!response.ok) {
          if (response.status === 404) {
            router.push("/createPlayer");
            return;
          }
          throw new Error("Failed to fetch player data");
        }

        const data = await response.json();
        setPlayer(data);
      } catch (err) {
        console.error(err);
      }
    }

    fetchPlayer();
  }, [wallet, router]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch("/api/leaderboard");
        if (!response.ok) {
          throw new Error("Failed to fetch leaderboard");
        }
        const data = await response.json();
        setPlayers(data.players);
      } catch (err) {
        setError("Failed to load leaderboard data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const calculateStarRating = (totalPoints: number) => {
    // Max possible points: 8 stats * 20 points = 160
    const percentage =
      (totalPoints / (8 * PLAYER_CONSTANTS.MAX_STAT_VALUE)) * 100;
    if (percentage >= 90) return "⭐⭐⭐⭐⭐";
    if (percentage >= 70) return "⭐⭐⭐⭐";
    if (percentage >= 50) return "⭐⭐⭐";
    if (percentage >= 30) return "⭐⭐";
    return "⭐";
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
        <Header pageName="Leaderboard" xp={player?.xp || 0} />
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
        <Header pageName="Leaderboard" xp={player?.xp || 0} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-red-500 text-center text-sm px-4">{error}</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
      <Header pageName="Leaderboard" xp={player?.xp || 0} />
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
                activeTab === "teams"
                  ? "text-white border-b-2 border-green-500"
                  : "text-gray-400"
              }`}
              onClick={() => setActiveTab("teams")}
              disabled
            >
              Teams
            </button>
          </div>

          {activeTab === "players" ? (
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <table className="w-full">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-700">
                    <th className="py-2 sm:py-3 px-2 text-center w-10 sm:w-16 text-xs sm:text-sm">
                      #
                    </th>
                    <th className="py-2 sm:py-3 px-2 sm:px-4 text-left text-xs sm:text-sm">
                      Player
                    </th>
                    <th className="py-2 sm:py-3 px-2 sm:px-4 text-left text-xs sm:text-sm">
                      Rating
                    </th>
                    <th className="py-2 sm:py-3 px-2 sm:px-4 text-right text-xs sm:text-sm">
                      Points
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((player, index) => (
                    <tr
                      key={player._id}
                      className="text-gray-300 border-b border-gray-700 active:bg-[#2a2d31]/50 sm:hover:bg-[#2a2d31]/50 transition-colors duration-200"
                    >
                      <td className="py-2 sm:py-3 px-2 text-center text-xs sm:text-sm">
                        {index + 1}
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">
                        {player.playerName}
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm">
                        {calculateStarRating(player.totalPoints)}
                      </td>
                      <td className="py-2 sm:py-3 px-2 sm:px-4 text-right text-xs sm:text-sm">
                        {Math.floor(player.totalPoints)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-4 text-sm">
              Coming soon
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
