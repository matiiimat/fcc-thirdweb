"use client";

import { useEffect, useState } from "react";
import { useActiveWallet } from "thirdweb/react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getActionCooldown } from "../lib/game";
import PositionRecommendationChart from "../components/PositionRecommendationChart";
import PositionSelector from "../components/PositionSelector";
import { Position } from "../models/Player";

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
  lastGameDate: string | null;
  lastGameResult?: {
    position: Position;
    note: number;
    successfulPasses: number;
    successfulTackles: number;
    shotsOnTarget: number;
    distanceCovered: number;
  };
}

export default function SoloMatchPage() {
  const activeWallet = useActiveWallet();
  const wallet = activeWallet?.getAccount();
  const router = useRouter();
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(
    null
  );

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
        setPlayer(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchPlayer();
  }, [wallet]);

  const handlePlay = async () => {
    if (!player || !wallet || playing || !selectedPosition) return;

    setPlaying(true);
    setError(null);

    try {
      const response = await fetch("/api/game/solomatch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-wallet-address": wallet.address,
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
        setPlayer(result.player);
      } else {
        throw new Error(result.error || "Failed to start game");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start game");
    } finally {
      setPlaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
        <Header pageName="Solo Match" />
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

  if (!wallet || !player) {
    return null;
  }

  const { onCooldown, remainingTime } = getActionCooldown(
    player.lastGameDate ? new Date(player.lastGameDate) : null,
    true
  );
  const canPlay = !onCooldown && selectedPosition !== null;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
      <Header pageName="Match" />
      <main className="flex-1 container max-w-xl mx-auto px-3 sm:px-6 py-2 sm:py-4 pb-16 sm:pb-20">
        {/* Next Game Section */}
        <div className="mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-4">
            Next Game
          </h2>
          <div className="glass-container p-3 sm:p-6 rounded-lg sm:rounded-2xl shadow-lg">
            {/* Two columns container */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {/* Position Selection */}
              <div className="order-1">
                <PositionSelector
                  onSelect={setSelectedPosition}
                  selectedPosition={selectedPosition}
                  disabled={playing || onCooldown}
                />
              </div>

              {/* Coach Recommendation */}
              <div className="order-2">
                <h3 className="text-sm sm:text-base font-medium text-white mb-2">
                  Coach Recommendation
                </h3>
                <PositionRecommendationChart stats={player.stats} />
              </div>
            </div>

            {/* Play button */}
            <div className="text-center">
              <button
                onClick={handlePlay}
                className={`
                  gradient-button py-2.5 sm:py-3 px-6 rounded-lg text-base mb-2 w-full transition-all duration-300
                  ${
                    !canPlay || playing
                      ? "opacity-50 cursor-not-allowed"
                      : "active:scale-95 sm:hover:scale-[1.02]"
                  }
                `}
                disabled={!canPlay || playing}
              >
                {playing
                  ? "PLAYING..."
                  : selectedPosition
                  ? "PLAY"
                  : "SELECT POSITION"}
              </button>
              <div
                className={`text-xs sm:text-sm ${
                  canPlay ? "text-green-400" : "text-red-400"
                }`}
              >
                {onCooldown
                  ? remainingTime
                  : selectedPosition
                  ? "Ready"
                  : "Select position"}
              </div>
            </div>
          </div>
        </div>

        {/* Last Game Section */}
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-4">
            Last Game
          </h2>
          <div className="glass-container p-3 sm:p-6 rounded-lg sm:rounded-2xl shadow-lg">
            {player.lastGameResult ? (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="col-span-2 flex justify-between items-center py-1">
                  <span className="text-gray-300">Position</span>
                  <span className="text-white">
                    {player.lastGameResult.position}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-300">Note</span>
                  <span className="text-white">XX</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-300">Passes</span>
                  <span className="text-white">XX</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-300">Tackles</span>
                  <span className="text-white">XX</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-300">Shots</span>
                  <span className="text-white">XX</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-300">Distance</span>
                  <span className="text-white">XX</span>
                </div>
                <div className="col-span-2 flex justify-between items-center py-1 mt-1 border-t border-gray-700">
                  <span className="text-gray-300">XP Gained</span>
                  <span className="text-white">
                    +{player.lastGameResult.note * -10} XP
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400 text-sm py-2">
                No previous games
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="text-red-500 text-center mt-2 text-xs">{error}</div>
        )}
      </main>
      <Footer />
    </div>
  );
}
