"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useActiveWallet } from "thirdweb/react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import MatchScheduler from "../../components/MatchScheduler";
import MatchSimulator from "../../components/MatchSimulator";
import { Types } from "mongoose";
import { ITactic } from "../../models/Team";

interface Team {
  _id: string;
  teamName: string;
  tactics: MongoTactic[];
  players: string[];
}

interface MongoTactic extends ITactic {
  _id: Types.ObjectId;
}

export default function MatchTestPage() {
  const router = useRouter();
  const activeWallet = useActiveWallet();
  const wallet = activeWallet?.getAccount();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showScheduler, setShowScheduler] = useState(false);

  useEffect(() => {
    async function fetchTeams() {
      try {
        const response = await fetch("/api/teams");
        if (!response.ok) {
          throw new Error("Failed to fetch teams");
        }
        const data = await response.json();
        setTeams(data);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to fetch teams"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchTeams();
  }, []);

  const handleScheduleMatch = async (matchData: {
    homeTeamId: string;
    awayTeamId: string;
    date: string;
  }) => {
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/teams/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(matchData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to schedule match");
      }

      setSuccess("Match scheduled successfully!");
    } catch (error) {
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
        <Header pageName="Match Test" />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-2 text-gray-400">Loading teams...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
      <Header pageName="Match Test" />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Mode Toggle */}
          <div className="flex justify-end">
            <button
              onClick={() => {
                setShowScheduler(!showScheduler);
                setError(null);
                setSuccess(null);
              }}
              className="text-sm px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              {showScheduler ? "Show Simulator" : "Show Scheduler"}
            </button>
          </div>

          {showScheduler ? (
            /* Match Scheduler */
            <MatchScheduler teams={teams} onSchedule={handleScheduleMatch} />
          ) : (
            /* Match Simulator */
            <MatchSimulator teams={teams} onError={setError} />
          )}

          {/* Status Messages */}
          {error && <div className="text-red-400 text-center">{error}</div>}
          {success && (
            <div className="text-green-400 text-center">{success}</div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
