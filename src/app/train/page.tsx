"use client";

import { useEffect, useState } from "react";
import { useActiveWallet } from "thirdweb/react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  calculatePlayerRating,
  getStarRating,
  getPlayerStats,
  getStatColor,
} from "../lib/game";

interface PlayerData {
  playerId: string;
  playerName: string;
  stats: {
    strength: number;
    stamina: number;
    passing: number;
    shooting: number;
    defending: number;
    speed: number;
    positioning: number;
    workEthic: number;
  };
  lastTrainingDate: string | null;
  lastConnectionDate: string | null;
  consecutiveConnections: number;
}

export default function TrainPage() {
  const activeWallet = useActiveWallet();
  const wallet = activeWallet?.getAccount();
  const router = useRouter();
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [training, setTraining] = useState(false);

  useEffect(() => {
    async function fetchPlayer() {
      if (!wallet) {
        setLoading(false);
        return;
      }

      try {
        const walletAddress = wallet.toString();
        console.log("Fetching player for wallet:", walletAddress); // Debug log

        const response = await fetch(`/api/players/address/${walletAddress}`);
        if (!response.ok) {
          if (response.status === 404) {
            router.push("/");
            return;
          }
          throw new Error("Failed to fetch player data");
        }

        const data = await response.json();
        // Ensure all stats are numbers
        data.stats = Object.fromEntries(
          Object.entries(data.stats).map(([key, value]) => [key, Number(value)])
        );
        setPlayer(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchPlayer();
  }, [wallet, router]);

  const handleTrain = async () => {
    if (!player || training) return;

    setTraining(true);
    try {
      const response = await fetch("/api/game/train", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerId: player.playerId,
        }),
      });

      if (!response.ok) {
        throw new Error("Training failed");
      }

      const result = await response.json();
      setPlayer(result.player);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Training failed");
    } finally {
      setTraining(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header pageName="Train" />
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2">Loading...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (!wallet || !player) {
    router.push("/");
    return null;
  }

  const playerStats = getPlayerStats(player.stats);
  const rating = calculatePlayerRating(player.stats);
  const canTrain =
    !player.lastTrainingDate ||
    new Date().toDateString() !==
      new Date(player.lastTrainingDate).toDateString();

  // Filter out work ethic from visible stats
  const visibleStats = playerStats.filter((stat) => stat.name !== "Work Ethic");

  return (
    <>
      <Header pageName="Train" />

      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="max-w-2xl w-full">
          {/* Training Button and Status */}
          <div className="text-center mb-8">
            <button
              onClick={handleTrain}
              className={`
                text-white font-bold py-4 px-8 rounded-lg text-xl mb-4
                ${
                  canTrain && !training
                    ? "bg-blue-500 hover:bg-blue-700"
                    : "bg-gray-500 cursor-not-allowed"
                }
              `}
              disabled={!canTrain || training}
            >
              {training ? "TRAINING..." : "TRAIN"}
            </button>
            <div className={canTrain ? "text-green-500" : "text-red-500"}>
              {canTrain ? "Training Available" : "Already trained today"}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {visibleStats.map(({ name, value }) => (
              <div key={name} className="bg-gray-800 p-4 rounded-lg shadow-md">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white">{name}</span>
                  <span className={getStatColor(value)}>
                    {value.toFixed(2)}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div
                    className={`${getStatColor(value)} h-2.5 rounded-full`}
                    style={{ width: `${(value / 20) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="text-red-500 text-center mb-4">{error}</div>
          )}
        </div>
        <Footer />
      </div>
    </>
  );
}
