"use client";

import { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

interface Player {
  _id: string;
  playerName: string;
  totalPoints: number;
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState("players");
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    // Max possible points: 8 stats * 100 points = 800
    const percentage = (totalPoints / 800) * 100;
    if (percentage >= 90) return "⭐⭐⭐⭐⭐";
    if (percentage >= 70) return "⭐⭐⭐⭐";
    if (percentage >= 50) return "⭐⭐⭐";
    if (percentage >= 30) return "⭐⭐";
    return "⭐";
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header pageName="Leaderboard" />
        <div className="flex flex-col items-center mt-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-2">Loading...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <Header pageName="Leaderboard" />
        <div className="flex flex-col items-center mt-4">
          <div className="text-red-500 text-center">{error}</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <Header pageName="Leaderboard" />
      <div className="flex flex-col items-center mt-2 px-4 pb-24">
        <div className="glass-container p-6 w-full max-w-4xl mb-4">
          <div className="flex border-b border-gray-700 mb-4">
            <button
              className={`flex-1 py-2 text-center ${
                activeTab === "players"
                  ? "text-white border-b-2 border-green-500"
                  : "text-gray-400 hover:text-gray-300"
              }`}
              onClick={() => setActiveTab("players")}
            >
              Players
            </button>
            <button
              className={`flex-1 py-2 text-center ${
                activeTab === "teams"
                  ? "text-white border-b-2 border-green-500"
                  : "text-gray-400 hover:text-gray-300"
              }`}
              onClick={() => setActiveTab("teams")}
              disabled
            >
              Teams (Coming Soon)
            </button>
          </div>

          {activeTab === "players" ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-700">
                    <th className="py-3 px-4 text-left">Rank</th>
                    <th className="py-3 px-4 text-left">Player</th>
                    <th className="py-3 px-4 text-left">Rating</th>
                    <th className="py-3 px-4 text-right">Total Points</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((player, index) => (
                    <tr
                      key={player._id}
                      className="text-gray-300 border-b border-gray-700 hover:bg-[#2a2d31]"
                    >
                      <td className="py-3 px-4">{index + 1}</td>
                      <td className="py-3 px-4">{player.playerName}</td>
                      <td className="py-3 px-4">
                        {calculateStarRating(player.totalPoints)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {Math.floor(player.totalPoints)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">
              Teams leaderboard coming soon!
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
