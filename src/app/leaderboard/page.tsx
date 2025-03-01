"use client";

import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import TeamLeaderboard from "../components/TeamLeaderboard";
import SeasonStandings from "../components/SeasonStandings";

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<"season" | "overall">("season");

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
      <Header pageName="Leaderboard" />
      <main className="container mx-auto px-4 py-8">
        <div className="glass-container p-6 rounded-xl shadow-lg">
          {/* Tabs */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveTab("season")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === "season"
                  ? "bg-green-700 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              Current Season
            </button>
            <button
              onClick={() => setActiveTab("overall")}
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === "overall"
                  ? "bg-green-700 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              Overall Rankings
            </button>
          </div>

          {/* Content */}
          {activeTab === "season" ? <SeasonStandings /> : <TeamLeaderboard />}
        </div>
      </main>
      <Footer />
    </div>
  );
}
