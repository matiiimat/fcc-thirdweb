"use client";

import Header from "../components/Header";
import Footer from "../components/Footer";
import TeamLeaderboard from "../components/TeamLeaderboard";

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
      <Header pageName="Leaderboard" xp={0} />
      <main className="container mx-auto px-4 py-8">
        <div className="glass-container p-6 rounded-xl shadow-lg">
          <TeamLeaderboard />
        </div>
      </main>
      <Footer />
    </div>
  );
}
