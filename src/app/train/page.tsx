"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { NoWalletState } from "../components/TeamPageStates";
import { useAppInitialization } from "../hooks/useAppInitialization";
import {
  calculatePlayerRating,
  getStarCount,
  getPlayerStats,
  getStatColor,
  getActionCooldown,
} from "../lib/game";
import { STAT_NAMES } from "../lib/constants";
import PositionRecommendationChart from "../components/PositionRecommendationChart";
import PositionSelector from "../components/PositionSelector";
import MatchPopup from "../components/MatchPopup";
import { Position } from "../models/Player";

interface TrainingResult {
  stat: string;
  previousValue: number;
  newValue: number;
  baseBonus: number;
  workEthicBonus: number;
  finalBonus: number;
}

export default function TrainPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  
  // Use optimized initialization hook
  const {
    isSDKReady,
    context,
    player,
    loading: playerLoading,
    error: playerError,
    refetchPlayer,
  } = useAppInitialization();

  const [training, setTraining] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [trainingResult, setTrainingResult] = useState<TrainingResult | null>(
    null
  );
  const [showTrainingAnimation, setShowTrainingAnimation] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(
    null
  );
  const [showMatchPopup, setShowMatchPopup] = useState(false);
  const [matchResult, setMatchResult] = useState<
    | {
        rating: number;
        workEthicIncrease?: number;
        previousWorkEthic?: number;
        newWorkEthic?: number;
      }
    | undefined
  >();
  const [error, setError] = useState<string | null>(null);

  // Redirect to home if connected but no player (hasn't registered)
  useEffect(() => {
    if (!playerLoading && isConnected && !player) {
      router.push("/");
    }
  }, [playerLoading, isConnected, player, router]);

  // Show simple loading state while SDK initializes (no AppLoader needed here)
  if (!isSDKReady) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
        <Header pageName="Train" />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
        <Footer />
      </div>
    );
  }


  const handleTrain = async () => {
    if (!player || !isConnected || !address || training) return;

    setTraining(true);
    setTrainingResult(null);
    setShowTrainingAnimation(false);

    try {
      const response = await fetch("/api/game/train", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-wallet-address": address,
        },
        body: JSON.stringify({ playerId: player.playerId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Training failed");
      }

      const result = await response.json();
      if (result.success && result.training) {
        setTrainingResult(result.training);
        setShowTrainingAnimation(true);
        setTimeout(() => setShowTrainingAnimation(false), 2000);

        // Refetch player data to get updated stats and cooldown state
        setTimeout(() => refetchPlayer(), 100);
      } else {
        throw new Error(result.error || "Training failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Training failed");
    } finally {
      setTraining(false);
    }
  };

  const handlePlay = async () => {
    if (!player || !isConnected || !address || playing || !selectedPosition)
      return;

    setPlaying(true);
    setError(null);

    try {
      const response = await fetch("/api/game/solomatch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-wallet-address": address,
        },
        body: JSON.stringify({
          playerId: player.playerId,
          position: selectedPosition,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to start game");
      }

      const result = await response.json();
      if (result.success) {
        setShowMatchPopup(true);
        setMatchResult(result.matchResult);
        // Refetch player data to get updated stats
        setTimeout(() => refetchPlayer(), 100);
      } else {
        throw new Error(result.error || "Failed to start game");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start game");
    } finally {
      setPlaying(false);
    }
  };

  const handleMatchEnd = () => {
    setShowMatchPopup(false);
    setPlaying(false);
    setMatchResult(undefined);
  };

  if (playerLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
        <Header pageName="Train" />
        <main className="flex-1 container max-w-xl mx-auto px-3 sm:px-6 py-2 sm:py-4 pb-24">
          <div className="grid grid-cols-1 gap-4">
            {/* Drop In Match Section Skeleton */}
            <div className="glass-container p-3 sm:p-4 rounded-xl shadow-lg">
              <div className="h-6 w-32 bg-gray-700/30 rounded animate-pulse mb-4"></div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {/* Position Selector Skeleton */}
                <div className="col-span-1">
                  <div className="h-24 bg-gray-700/30 rounded animate-pulse"></div>
                </div>
                {/* Coach Suggestion Skeleton */}
                <div className="col-span-1">
                  <div className="h-4 w-28 bg-gray-700/30 rounded animate-pulse mb-2"></div>
                  <div className="h-20 bg-gray-700/30 rounded animate-pulse"></div>
                </div>
              </div>
              {/* Button Skeleton */}
              <div className="h-10 w-full bg-gray-700/30 rounded-lg animate-pulse"></div>
            </div>

            {/* Training Section Skeleton */}
            <div className="glass-container p-3 sm:p-4 rounded-xl shadow-lg">
              <div className="h-6 w-24 bg-gray-700/30 rounded animate-pulse mb-4"></div>
              {/* Training Button Skeleton */}
              <div className="text-center mb-3">
                <div className="h-10 w-full bg-gray-700/30 rounded-lg animate-pulse mb-2"></div>
              </div>
              {/* Stats Grid Skeleton */}
              <div className="grid grid-cols-2 gap-2">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="glass-container p-2 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <div className="h-4 w-16 bg-gray-700/30 rounded animate-pulse"></div>
                      <div className="h-4 w-12 bg-gray-700/30 rounded animate-pulse"></div>
                    </div>
                    <div className="h-1.5 w-full bg-gray-700/30 rounded-full animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isConnected || !address) {
    return <NoWalletState pageName="Train" />;
  }

  if (!player) {
    return null;
  }

  const playerStats = getPlayerStats(player.stats);
  const rating = calculatePlayerRating(player.stats);
  const trainCooldown = getActionCooldown(
    player.lastTrainingDate ? new Date(player.lastTrainingDate) : null,
    false
  );
  const matchCooldown = getActionCooldown(
    player.lastGameDate ? new Date(player.lastGameDate) : null,
    true
  );
  const canTrain = !trainCooldown.onCooldown;
  const canPlay = !matchCooldown.onCooldown && selectedPosition !== null;

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
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
      <Header pageName="Train" />
      <main className="flex-1 container max-w-xl mx-auto px-3 sm:px-6 py-2 sm:py-4 pb-24">
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-400 text-center p-3 rounded-lg mb-4 text-sm font-medium">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 gap-4">
          {/* Drop In Match Section */}
          <div className="glass-container p-3 sm:p-4 rounded-xl shadow-lg">
            <h2 className="text-base font-semibold text-white mb-2">
              Drop In Match
            </h2>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="col-span-1">
                <PositionSelector
                  onSelect={setSelectedPosition}
                  selectedPosition={selectedPosition}
                  disabled={playing || matchCooldown.onCooldown}
                  compact={true}
                />
              </div>
              <div className="col-span-1">
                <h3 className="text-xs font-medium text-white mb-1">
                  Coach Suggestion
                </h3>
                <PositionRecommendationChart
                  stats={player.stats}
                  compact={true}
                />
              </div>
            </div>
            <div className="text-center">
              <button
                onClick={handlePlay}
                className={`gradient-button py-2 px-4 rounded-lg text-sm w-full mb-1 transition-all duration-300
                  ${
                    !canPlay || playing
                      ? "opacity-50 cursor-not-allowed"
                      : "active:scale-95"
                  }`}
                disabled={!canPlay || playing}
              >
                {playing
                  ? "PLAYING..."
                  : selectedPosition
                  ? "PLAY"
                  : "SELECT POSITION"}
              </button>
              <div
                className={`text-xs ${
                  matchCooldown.onCooldown
                    ? "text-red-400"
                    : !selectedPosition
                    ? "text-green-400"
                    : canPlay
                    ? "text-green-400"
                    : "text-red-400"
                }`}
              >
                {matchCooldown.onCooldown
                  ? matchCooldown.remainingTime
                  : selectedPosition
                  ? "Ready"
                  : "Select position"}
              </div>
            </div>
          </div>

          {/* Training Section */}
          <div className="glass-container p-3 sm:p-4 rounded-xl shadow-lg">
            <h2 className="text-base font-semibold text-white mb-2">
              Training
            </h2>
            <div className="text-center mb-3 relative">
              <button
                onClick={handleTrain}
                className={`gradient-button py-2 px-4 rounded-lg text-sm w-full mb-1 transition-all duration-300
                  ${
                    !canTrain || training
                      ? "opacity-50 cursor-not-allowed"
                      : "active:scale-95"
                  }`}
                disabled={!canTrain || training}
              >
                {training ? "TRAINING..." : "TRAIN"}
              </button>

              {showTrainingAnimation && trainingResult && (
                <div
                  key={`training-animation-${Date.now()}`}
                  className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full"
                >
                  <div className="animate-bounce glass-container bg-green-500/20 text-white px-2 py-1 rounded-lg shadow-lg text-xs">
                    {getTrainingMessage()}
                  </div>
                </div>
              )}

              <div className="text-xs">
                <span
                  className={`${canTrain ? "text-green-400" : "text-red-400"}`}
                >
                  {canTrain ? "Ready" : trainCooldown.remainingTime}
                </span>
              </div>
              {player.privateTrainer?.selectedSkill &&
                player.privateTrainer.remainingSessions > 0 && (
                  <div className="glass-container bg-green-900/20 p-2 rounded-lg text-xs mt-1">
                    <div className="font-semibold text-green-400">
                      {STAT_NAMES[player.privateTrainer.selectedSkill as keyof typeof STAT_NAMES]} Training
                      • {player.privateTrainer.remainingSessions} left
                    </div>
                  </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {playerStats
                .filter(({ name }) => name !== undefined)
                .map(({ name, value }) => (
                  <div
                    key={`stat-${name}`}
                    className={`glass-container p-2 rounded-lg transition-all duration-300 ${
                      trainingResult &&
                      STAT_NAMES[
                        trainingResult.stat as keyof typeof STAT_NAMES
                      ] === name
                        ? "ring-1 ring-green-500 shadow-green-500/20"
                        : ""
                    }`}
                  >
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="font-semibold text-white">{name}</span>
                      <span className={getStatColor(Number(value))}>
                        {formatStatValue(value)}
                      </span>
                    </div>
                    <div className="w-full bg-black/40 rounded-full h-1.5">
                      <div
                        className={`${getStatColor(
                          Number(value)
                        )} h-1.5 rounded-full transition-all duration-300`}
                        style={{ width: `${(Number(value) / 20) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {showMatchPopup && selectedPosition && (
        <MatchPopup
          selectedPosition={selectedPosition}
          playerName={player.playerName}
          username={player.username}
          onClose={handleMatchEnd}
          matchResult={matchResult}
          playerSnapshot={{
            stats: player.stats,
            team: player.team,
            identity: player.identity,
            pfp: context?.user?.pfpUrl,
          }}
          isBottomSheet={true}
        />
      )}
    </div>
  );
}
