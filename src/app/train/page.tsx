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
  getActionCooldown,
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
  privateTrainer?: {
    selectedSkill: keyof typeof STAT_NAMES | null;
    remainingSessions: number;
  };
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
        const validStats = [
          "strength",
          "stamina",
          "passing",
          "shooting",
          "defending",
          "speed",
          "positioning",
          "workEthic",
        ];
        const cleanStats = Object.fromEntries(
          Object.entries(data.stats)
            .filter(([key]) => validStats.includes(key))
            .map(([key, value]) => [key, Number(value)])
        );
        setPlayer({ ...data, stats: cleanStats });
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchPlayer();
  }, [wallet]);

  const handleTrain = async () => {
    if (!player || !wallet || training) return;

    setTraining(true);
    setTrainingResult(null);
    setShowTrainingAnimation(false);

    try {
      const response = await fetch("/api/game/train", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-wallet-address": wallet.address, // Add wallet address to headers
        },
        body: JSON.stringify({
          playerId: player.playerId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Training failed");
      }

      const result = await response.json();
      console.log("Training result:", result);

      if (result.success && result.training) {
        const validStats = [
          "strength",
          "stamina",
          "passing",
          "shooting",
          "defending",
          "speed",
          "positioning",
          "workEthic",
        ];
        const cleanStats = Object.fromEntries(
          Object.entries(result.player.stats)
            .filter(([key]) => validStats.includes(key))
            .map(([key, value]) => [key, Number(value)])
        );
        setPlayer({ ...result.player, stats: cleanStats });
        setTrainingResult(result.training);
        setShowTrainingAnimation(true);

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
      <div className="min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
        <Header pageName="Train" />
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          <p className="mt-2 text-green-400">Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!wallet || !player) {
    return null;
  }

  const playerStats = getPlayerStats(player.stats);
  const rating = calculatePlayerRating(player.stats);
  const { onCooldown, remainingTime } = getActionCooldown(
    player.lastTrainingDate ? new Date(player.lastTrainingDate) : null,
    true // isTraining = true
  );
  const canTrain = !onCooldown;

  const formatStatValue = (value: any) => {
    const num = Number(value);
    return Number.isFinite(num) ? num.toFixed(2) : "0.00";
  };

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
    <div className="min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
      <Header pageName="Train" />
      <div className="container max-w-xl mx-auto px-6 py-4 pb-20">
        <div className="glass-container p-6 rounded-2xl shadow-lg">
          {/* Training Button and Status */}
          <div className="text-center mb-8 relative">
            <button
              onClick={handleTrain}
              className={`
                gradient-button py-4 px-8 rounded-xl text-lg mb-4 w-full transition-all duration-300
                ${
                  !canTrain || training
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:scale-[1.02]"
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
                <div className="animate-bounce glass-container bg-green-500/20 text-white px-4 py-2 rounded-xl shadow-lg text-sm">
                  {getTrainingMessage()}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className={canTrain ? "text-green-400" : "text-red-400"}>
                {canTrain ? "Ready to train" : `Resting: ${remainingTime} left`}
              </div>
              {player.privateTrainer?.selectedSkill &&
                player.privateTrainer.remainingSessions > 0 && (
                  <div className="glass-container bg-green-900/20 p-4 rounded-xl text-sm">
                    <div className="font-semibold text-green-400 mb-1">
                      Private Trainer Active
                    </div>
                    <div className="text-gray-300 mb-1">
                      Focusing on:{" "}
                      {STAT_NAMES[player.privateTrainer.selectedSkill]}
                    </div>
                    <div className="text-green-400">
                      {player.privateTrainer.remainingSessions} training
                      sessions remaining
                    </div>
                  </div>
                )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {playerStats.map(({ name, value }) => (
              <div
                key={`stat-${name}`}
                className={`glass-container p-4 rounded-xl transition-all duration-300 ${
                  trainingResult &&
                  STAT_NAMES[trainingResult.stat as keyof typeof STAT_NAMES] ===
                    name
                    ? "ring-2 ring-green-500 shadow-green-500/20"
                    : ""
                }`}
              >
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="font-semibold text-white">{name}</span>
                  <span className={getStatColor(Number(value))}>
                    {formatStatValue(value)}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-black/40 rounded-full h-2">
                  <div
                    className={`${getStatColor(
                      Number(value)
                    )} h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${(Number(value) / 20) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="text-red-500 text-center mt-6 text-sm">{error}</div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
