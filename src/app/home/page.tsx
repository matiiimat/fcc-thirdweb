"use client";

import Header from "../components/Header";
import { ConnectButton, useActiveWallet } from "thirdweb/react";
import { client } from "../client";
import { useRouter } from "next/navigation";
import { inAppWallet, createWallet } from "thirdweb/wallets";
import Footer from "../components/Footer";
import { useEffect, useState } from "react";
import { calculatePlayerRating, getStarRating } from "../lib/game";

interface PlayerData {
  playerId: string;
  playerName: string;
  ethAddress: string; // Add this to track stored address
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
  lastTrainingDate: string | null;
  lastConnectionDate: string | null;
  consecutiveConnections: number;
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
        return;
      }

      const walletAddress = wallet.toString().toLowerCase(); // Normalize address
      console.log("Connected wallet address:", walletAddress); // Debug log

      try {
        console.log("Fetching player for address:", walletAddress); // Debug log
        const response = await fetch(
          `/api/players/address/${encodeURIComponent(walletAddress)}`
        );
        console.log("API response status:", response.status); // Debug log

        if (!response.ok) {
          if (response.status === 404) {
            console.log(
              "No player found for wallet, redirecting to create player"
            ); // Debug log
            setPlayer(null);
          } else {
            const errorData = await response.json();
            console.error("Error response:", errorData); // Debug log
            throw new Error(errorData.error || "Failed to fetch player data");
          }
        } else {
          const data = await response.json();
          console.log("Player data fetched:", {
            playerId: data.playerId,
            name: data.playerName,
            storedAddress: data.ethAddress,
            requestedAddress: walletAddress,
          }); // Debug log

          // Verify the addresses match
          if (data.ethAddress.toLowerCase() !== walletAddress) {
            console.error("Address mismatch:", {
              stored: data.ethAddress.toLowerCase(),
              requested: walletAddress,
            });
            setPlayer(null);
          } else {
            setPlayer(data);
            // Update connection streak
            updateConnectionStreak(data);
          }
        }
      } catch (err) {
        console.error("Fetch player error:", err); // Debug log
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchPlayer();
  }, [wallet]);

  // Update player's connection streak
  async function updateConnectionStreak(playerData: PlayerData) {
    const today = new Date();
    const lastConnection = playerData.lastConnectionDate
      ? new Date(playerData.lastConnectionDate)
      : null;

    // Check if we need to update the streak
    const needsUpdate =
      !lastConnection || today.toDateString() !== lastConnection.toDateString();

    if (needsUpdate) {
      // Calculate if the last connection was yesterday
      const isConsecutive =
        lastConnection &&
        Math.abs(today.getTime() - lastConnection.getTime()) <=
          24 * 60 * 60 * 1000;

      try {
        const response = await fetch(`/api/players/${playerData.playerId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lastConnectionDate: today,
            consecutiveConnections: isConsecutive
              ? playerData.consecutiveConnections + 1
              : 1,
          }),
        });

        if (!response.ok) {
          console.error("Failed to update connection streak");
        }
      } catch (err) {
        console.error("Error updating connection streak:", err);
      }
    }
  }

  // Calculate if player can train today
  const canTrainToday = player?.lastTrainingDate
    ? new Date().toDateString() !==
      new Date(player.lastTrainingDate).toDateString()
    : true;

  return (
    <>
      {/* Header */}
      <Header pageName="Home" />

      {/* Player section */}
      <div className="flex flex-col items-center mt-8">
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
            <div className="mt-4 text-sm text-gray-600">
              Wallet: {wallet.toString()}
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-center text-[26px] mb-2">
              {player.playerName}
            </h2>
            <div className="text-2xl mb-4">
              {getStarRating(calculatePlayerRating(player.stats))}
            </div>
            {/* Stats */}
            <div className="flex flex-col items-start space-y-2 mt-4">
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
