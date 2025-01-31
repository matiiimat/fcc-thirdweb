"use client";

import Image from "next/image";
import Header from "../components/Header";
import { ConnectButton, useActiveWallet } from "thirdweb/react";
import { client } from "../client";
import { useRouter } from "next/navigation";
import { inAppWallet, createWallet } from "thirdweb/wallets";
import Footer from "../components/Footer";
import { useEffect, useState } from "react";
import { calculatePlayerRating } from "../lib/game";

interface PlayerData {
  playerName: string;
  stats: {
    strength: number;
    stamina: number;
    passing: number;
    shooting: number;
    defending: number;
    speed: number;
    positioning: number;
  };
  money: number;
  lastTrainingDate: string | null;
}

const wallets = [
  inAppWallet({
    auth: {
      options: ["farcaster"],
    },
  }),
  createWallet("com.coinbase.wallet"),
];

export default function HomePage() {
  const wallet = useActiveWallet()?.getAccount();
  const router = useRouter();
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlayer() {
      if (!wallet) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/players/address/${wallet}`);
        if (!response.ok) {
          if (response.status === 404) {
            // Player doesn't exist yet
            setPlayer(null);
          } else {
            throw new Error("Failed to fetch player data");
          }
        } else {
          const data = await response.json();
          setPlayer(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchPlayer();
  }, [wallet]);

  // Calculate if player can train today
  const canTrainToday = player?.lastTrainingDate
    ? new Date().toDateString() !==
      new Date(player.lastTrainingDate).toDateString()
    : true;

  return (
    <>
      {/* Header */}
      <Header pageName="Home" />

      {/* Player section, just below the image */}
      <div className="flex flex-col items-center mt-4">
        {loading ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2">Loading...</p>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center">{error}</div>
        ) : !wallet ? (
          <div className="text-center">
            <p className="mb-4">Please connect your wallet</p>
            <ConnectButton client={client} />
          </div>
        ) : !player ? (
          <div className="text-center">
            <p className="mb-4">No player found for this wallet</p>
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => router.push("/createPlayer")}
            >
              Create Player
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-center text-[26px]">{player.playerName}</h2>
            {/* Stats */}
            <div className="flex flex-col items-start space-y-2 mt-4">
              <div>
                <span className="font-semibold">OVERALL: </span>
                <span>{calculatePlayerRating(player.stats)}</span>
              </div>
              <div>
                <span className="font-semibold">TRAINING STATUS: </span>
                <span
                  className={canTrainToday ? "text-green-500" : "text-red-500"}
                >
                  {canTrainToday ? "Available" : "Already trained today"}
                </span>
              </div>
              <div>
                <span className="font-semibold">CAPITAL: </span>
                <span>{player.money}</span>
              </div>
            </div>
          </>
        )}
        <Footer />
      </div>
    </>
  );
}
