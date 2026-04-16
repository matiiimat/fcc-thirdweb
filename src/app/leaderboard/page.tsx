"use client";

import { useState, useEffect } from "react";
import sdk from "@farcaster/frame-sdk";
import Header from "../components/Header";
import Footer from "../components/Footer";
import TeamLeaderboard from "../components/TeamLeaderboard";
import SeasonStandings from "../components/SeasonStandings";
import { useRouter } from "next/navigation";

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<"season" | "overall">("season");
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<any>();
  const router = useRouter();

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
          {activeTab === "season" ? (
            <SeasonStandings />
          ) : (
            <TeamLeaderboard onTeamClick={(teamName) => {
              router.push(`/team?name=${encodeURIComponent(teamName)}`);
            }} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
