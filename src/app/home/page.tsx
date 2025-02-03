"use client";

import Header from "../components/Header";
import { useActiveWallet } from "thirdweb/react";
import { useRouter } from "next/navigation";
import Footer from "../components/Footer";
import StatsRadarChart from "../components/StatsRadarChart";
import { useEffect, useState } from "react";
import {
  calculatePlayerRating,
  getStarRating,
  calculateTotalCapital,
  formatCurrency,
} from "../lib/game";

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
  money: number;
  investments: Array<{
    type: string;
    amount: number;
    timestamp: string;
  }>;
  lastTrainingDate: string | null;
  lastConnectionDate: string | null;
  consecutiveConnections: number;
}

export default function HomePage() {
  const activeWallet = useActiveWallet();
  const wallet = activeWallet?.getAccount();
  const router = useRouter();
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlayer() {
      if (!wallet) {
        setLoading(false);
        router.push("/");
        return;
      }

      try {
        const response = await fetch(
          `/api/players/address/${encodeURIComponent(wallet.address)}`
        );
        if (!response.ok) {
          if (response.status === 404) {
            router.push("/createPlayer");
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
  }, [wallet, router]);

  if (loading) {
    return (
      <div className="min-h-screen pb-20">
        <Header pageName="Home" />
        <div className="flex flex-col items-center mt-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2">Loading...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pb-20">
        <Header pageName="Home" />
        <div className="flex flex-col items-center mt-4">
          <div className="text-red-500 text-center">{error}</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!player) {
    return null;
  }

  // Calculate total capital
  const totalCapital = calculateTotalCapital(player.money, player.investments);

  // Calculate if player can train today
  const canTrainToday = player?.lastTrainingDate
    ? new Date().toDateString() !==
      new Date(player.lastTrainingDate).toDateString()
    : true;

  return (
    <div className="min-h-screen pb-20">
      <Header pageName="Home" />
      <div className="flex flex-col items-center mt-2 px-4">
        <h2 className="text-center text-[26px] mb-1">{player.playerName}</h2>
        <div className="text-2xl mb-2">
          {getStarRating(calculatePlayerRating(player.stats))}
        </div>

        {/* Stats Radar Chart */}
        <div className="w-full max-w-md mb-3">
          <StatsRadarChart stats={player.stats} />
        </div>

        {/* Financial Information */}
        <div className="flex flex-col items-start w-full max-w-md bg-gray-800 p-4 rounded-lg mb-2">
          <div className="w-full">
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-300">Cash:</span>
              <span className="text-lg font-semibold text-green-400">
                {formatCurrency(player.money)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Total Capital:</span>
              <span className="text-lg font-semibold text-yellow-400">
                {formatCurrency(totalCapital)}
              </span>
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="w-full max-w-md bg-gray-800 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Status:</span>
            <span className={canTrainToday ? "text-green-400" : "text-red-400"}>
              {canTrainToday ? "Energy full" : "Recovering"}
            </span>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
