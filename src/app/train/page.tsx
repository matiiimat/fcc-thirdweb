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
import { STAT_NAMES } from "../lib/constants";

interface PlayerData {
  playerId: string;
  playerName: string;
  ethAddress: string;
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

interface TrainingResult {
  stat: string;
  previousValue: number;
  newValue: number;
  baseBonus: number;
  workEthicBonus: number;
  finalBonus: number;
}

export default function TrainPage() {
  const activeWallet = useActiveWallet();
  const wallet = activeWallet?.getAccount();
  const router = useRouter();
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [training, setTraining] = useState(false);
  const [trainingResult, setTrainingResult] = useState<TrainingResult | null>(
    null
  );
  const [showTrainingAnimation, setShowTrainingAnimation] = useState(false);

  // Handle navigation when no wallet or player
  useEffect(() => {
    if (!loading && (!wallet || !player)) {
      router.push("/");
    }
  }, [loading, wallet, player, router]);

  useEffect(() => {
    async function fetchPlayer() {
      if (!wallet) {
        setLoading(false);
        return;
      }

      try {
        const walletAddress = wallet.address;
        console.log("Fetching player for wallet:", walletAddress);

        const response = await fetch(
          `/api/players/address/${encodeURIComponent(walletAddress)}`
        );
        if (!response.ok) {
          if (response.status === 404) {
            setPlayer(null);
            return;
          }
          throw new Error("Failed to fetch player data");
        }

        const data = await response.json();
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
  }, [wallet]);

  const handleTrain = async () => {
    if (!player || training) return;

    setTraining(true);
    setTrainingResult(null);
    setShowTrainingAnimation(false);

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
      console.log("Training result:", result); // Debug log

      if (result.success && result.training) {
        result.player.stats = Object.fromEntries(
          Object.entries(result.player.stats).map(([key, value]) => [
            key,
            Number(value),
          ])
        );
        setPlayer(result.player);
        setTrainingResult(result.training);
        setShowTrainingAnimation(true);

        // Hide training animation after 2 seconds
        setTimeout(() => {
          setShowTrainingAnimation(false);
        }, 2000);
      } else {
        throw new Error(result.error || "Training failed");
      }
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

  // Early return if no wallet or player, navigation handled by effect
  if (!wallet || !player) {
    return null;
  }

  const playerStats = getPlayerStats(player.stats);
  const rating = calculatePlayerRating(player.stats);
  const canTrain =
    !player.lastTrainingDate ||
    new Date().toDateString() !==
      new Date(player.lastTrainingDate).toDateString();

  const formatStatValue = (value: any) => {
    const num = Number(value);
    return Number.isFinite(num) ? num.toFixed(2) : "0.00";
  };

  // Format the training result message
  const getTrainingMessage = () => {
    if (!trainingResult || typeof trainingResult.finalBonus !== "number")
      return "";

    const bonus = trainingResult.finalBonus;
    const statName =
      STAT_NAMES[trainingResult.stat as keyof typeof STAT_NAMES] ||
      trainingResult.stat;
    return `+${bonus.toFixed(2)} ${statName}`;
  };

  return (
    <>
      <Header pageName="Train" />

      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="max-w-2xl w-full">
          {/* Training Button and Status */}
          <div className="text-center mb-8 relative">
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

            {/* Training Animation */}
            {showTrainingAnimation && trainingResult && (
              <div
                key={`training-animation-${Date.now()}`}
                className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full"
              >
                <div className="animate-bounce bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
                  {getTrainingMessage()}
                </div>
              </div>
            )}

            <div className={canTrain ? "text-green-500" : "text-red-500"}>
              {canTrain ? "Training Available" : "Already trained today"}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {playerStats.map(({ name, value }) => (
              <div
                key={`stat-${name}`}
                className={`bg-gray-800 p-4 rounded-lg shadow-md ${
                  trainingResult &&
                  STAT_NAMES[trainingResult.stat as keyof typeof STAT_NAMES] ===
                    name
                    ? "ring-2 ring-green-500"
                    : ""
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-white">{name}</span>
                  <span className={getStatColor(Number(value))}>
                    {formatStatValue(value)}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div
                    className={`${getStatColor(
                      Number(value)
                    )} h-2.5 rounded-full`}
                    style={{ width: `${(Number(value) / 20) * 100}%` }}
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
