"use client";

import Header from "../components/Header";
import { useActiveWallet } from "thirdweb/react";
import { useRouter } from "next/navigation";
import Footer from "../components/Footer";
import { useEffect, useState } from "react";
import { calculatePlayerRating, getStarRating } from "../lib/game";

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
        router.push("/"); // Redirect to main page if no wallet
        return;
      }

      const walletAddress = wallet.address;
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
            router.push("/createPlayer");
            return;
          } else {
            const errorData = await response.json();
            console.error("Error response:", errorData); // Debug log
            throw new Error(errorData.error || "Failed to fetch player data");
          }
        }

        const data = await response.json();
        console.log("Player data fetched:", {
          playerId: data.playerId,
          name: data.playerName,
          storedAddress: data.ethAddress,
          requestedAddress: walletAddress,
        }); // Debug log

        // Verify the addresses match
        if (data.ethAddress.toLowerCase() !== walletAddress.toLowerCase()) {
          console.error("Address mismatch:", {
            stored: data.ethAddress.toLowerCase(),
            requested: walletAddress.toLowerCase(),
          });
          router.push("/createPlayer");
          return;
        }

        setPlayer(data);
        // Update connection streak
        updateConnectionStreak(data);
      } catch (err) {
        console.error("Fetch player error:", err); // Debug log
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchPlayer();
  }, [wallet, router]);

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

  if (loading) {
    return (
      <>
        <Header pageName="Home" />
        <div className="flex flex-col items-center mt-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2">Loading...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header pageName="Home" />
        <div className="flex flex-col items-center mt-8">
          <div className="text-red-500 text-center">{error}</div>
        </div>
        <Footer />
      </>
    );
  }

  if (!player) {
    return null; // Let the useEffect handle redirection
  }

  return (
    <>
      <Header pageName="Home" />
      <div className="flex flex-col items-center mt-8">
        <h2 className="text-center text-[26px] mb-2">{player.playerName}</h2>
        <div className="text-2xl mb-4">
          {getStarRating(calculatePlayerRating(player.stats))}
        </div>
        {/* Stats */}
        <div className="flex flex-col items-start space-y-2 mt-4">
          <div>
            <span className="font-semibold">TRAINING STATUS: </span>
            <span className={canTrainToday ? "text-green-500" : "text-red-500"}>
              {canTrainToday ? "Available" : "Already trained today"}
            </span>
          </div>
          <div>
            <span className="font-semibold">CAPITAL: </span>
            <span>{player.money}</span>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}
