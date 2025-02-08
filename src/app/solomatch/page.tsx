"use client";

import { useEffect, useState } from "react";
import { useActiveWallet } from "thirdweb/react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getActionCooldown } from "../lib/game";
import { TRAINING_CONSTANTS } from "../lib/constants";

interface PlayerData {
  playerId: string;
  playerName: string;
  ethAddress: string;
  lastGameDate: string | null;
  lastGameResult?: {
    score: number;
    opponent: string;
    result: "win" | "loss" | "draw";
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
    if (!player || !wallet || playing) return;

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
      <div className="min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
        <Header pageName="Solo Match" />
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

  const { onCooldown, remainingTime } = getActionCooldown(
    player.lastGameDate ? new Date(player.lastGameDate) : null,
    true
  );
  const canPlay = !onCooldown;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
      <Header pageName="Solo Match" />
      <div className="container max-w-xl mx-auto px-6 py-4 pb-20">
        {/* Next Game Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Next Game</h2>
          <div className="glass-container p-6 rounded-2xl shadow-lg">
            <div className="text-center">
              <button
                onClick={handlePlay}
                className={`
                  gradient-button py-4 px-8 rounded-xl text-lg mb-4 w-full transition-all duration-300
                  ${
                    !canPlay || playing
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:scale-[1.02]"
                  }
                `}
                disabled={!canPlay || playing}
              >
                {playing ? "PLAYING..." : "PLAY"}
              </button>
              <div className={canPlay ? "text-green-400" : "text-red-400"}>
                {canPlay
                  ? "Ready to play"
                  : `Next game available in: ${remainingTime}`}
              </div>
            </div>
          </div>
        </div>

        {/* Last Game Section */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Last Game</h2>
          <div className="glass-container p-6 rounded-2xl shadow-lg">
            {player.lastGameResult ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Opponent</span>
                  <span className="text-white">
                    {player.lastGameResult.opponent}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Score</span>
                  <span className="text-white">
                    {player.lastGameResult.score}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Result</span>
                  <span
                    className={`
                    ${
                      player.lastGameResult.result === "win"
                        ? "text-green-400"
                        : ""
                    }
                    ${
                      player.lastGameResult.result === "loss"
                        ? "text-red-400"
                        : ""
                    }
                    ${
                      player.lastGameResult.result === "draw"
                        ? "text-yellow-400"
                        : ""
                    }
                  `}
                  >
                    {player.lastGameResult.result.toUpperCase()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400">
                No previous games played
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="text-red-500 text-center mt-6 text-sm">{error}</div>
        )}
      </div>
      <Footer />
    </div>
  );
}
