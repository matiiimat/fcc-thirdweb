"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import sdk, { Context } from "@farcaster/frame-sdk";

export type FrameContext = Context.FrameContext;
export type SafeAreaInsets = Context.SafeAreaInsets;

import {
  useAccount,
  useSendTransaction,
  useWaitForTransactionReceipt,
  useDisconnect,
  useConnect,
} from "wagmi";

import { config } from "./components/providers/WagmiProvider";
import { Button } from "@/components/ui/Button";
import Header from "./components/Header";
import Footer from "./components/Footer";
import StatsRadarChart from "./components/StatsRadarChart";
import NotificationBanner from "./components/NotificationBanner";
import {
  calculatePlayerRating,
  getStarRating,
  getActionCooldown,
} from "./lib/game";

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
  lastGameDate: string | null;
  lastConnectionDate: string | null;
  consecutiveConnections: number;
  lastGameResult?: {
    score: number;
    opponent: string;
    result: "win" | "loss" | "draw";
  };
}

export default function Home() {
  const router = useRouter();
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<FrameContext>();
  const [isContextOpen, setIsContextOpen] = useState(false);
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Wagmi hooks
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { connect } = useConnect();

  // Farcaster Frame Integration
  useEffect(() => {
    const load = async () => {
      try {
        setContext(await sdk.context);
        sdk.actions.ready();
      } catch (error) {
        console.error("Error initializing Farcaster Frame SDK:", error);
      }
    };

    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
    }
  }, [isSDKLoaded]);

  // Fetch player data when wallet is connected
  useEffect(() => {
    async function fetchPlayer() {
      if (!address) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/players/address/${encodeURIComponent(address)}`
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

    if (isConnected) {
      fetchPlayer();
    } else {
      setLoading(false);
    }
  }, [address, router, isConnected]);

  const toggleContext = useCallback(() => {
    setIsContextOpen((prev) => !prev);
  }, []);

  if (!isSDKLoaded) {
    return <div>Loading...</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
        <Header pageName="Home" />
        <div className="flex flex-col items-center mt-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-2">Loading...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
        <Header pageName="Home" />
        <div className="flex flex-col items-center mt-4">
          <div className="text-red-500 text-center">{error}</div>
        </div>
        <Footer />
      </div>
    );
  }

  // If not connected, show connect button
  if (!isConnected) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
        <Header pageName="fcc/FC" />
        <main className="flex-1 container mx-auto px-3 sm:px-6 py-2 sm:py-4 pb-16 sm:pb-20">
          <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto">
            <div className="glass-container p-6 w-full rounded-lg shadow-lg text-center">
              <h1 className="text-2xl font-bold mb-4">Welcome to fcc/FC!</h1>
              <p className="mb-6">Connect your wallet to start playing</p>
              <Button
                onClick={() => connect({ connector: config.connectors[0] })}
              >
                Connect Wallet
              </Button>

              <div className="mt-4 text-xs text-gray-400">
                <p>Username: {context?.user?.username || "N/A"}</p>
              </div>

              <div className="mt-4">
                <button
                  onClick={toggleContext}
                  className="flex items-center gap-2 transition-colors text-sm text-gray-400"
                >
                  <span
                    className={`transform transition-transform ${
                      isContextOpen ? "rotate-90" : ""
                    }`}
                  >
                    ➤
                  </span>
                  Frame Context
                </button>

                {isContextOpen && (
                  <div className="p-4 mt-2 bg-gray-800 rounded-lg text-left">
                    <pre className="font-mono text-xs whitespace-pre-wrap break-words max-w-full overflow-x-auto">
                      {JSON.stringify(context, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // If player is null but connected, we're likely redirecting to createPlayer
  if (!player) {
    return null;
  }

  // Calculate cooldowns
  const { onCooldown: trainingOnCooldown, remainingTime: trainingTime } =
    getActionCooldown(
      player?.lastTrainingDate ? new Date(player.lastTrainingDate) : null,
      false // isTraining = false for 6-hour cooldown
    );
  const { onCooldown: matchOnCooldown, remainingTime: matchTime } =
    getActionCooldown(
      player?.lastGameDate ? new Date(player.lastGameDate) : null,
      true // isPlaying = true
    );

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
      <Header pageName="Home" />
      <main className="flex-1 container mx-auto px-3 sm:px-6 py-2 sm:py-4 pb-16 sm:pb-20">
        <div className="flex flex-col items-center max-w-md mx-auto space-y-2 sm:space-y-3">
          <div className="w-full flex justify-end mb-2">
            <Button onClick={() => disconnect()} className="px-3 py-1 text-xs">
              Disconnect
            </Button>
          </div>

          <NotificationBanner
            playerId={player.playerId}
            ethAddress={player.ethAddress}
          />

          <div className="glass-container p-3 sm:p-6 w-full rounded-lg sm:rounded-2xl shadow-lg">
            <h2 className="text-center text-xl sm:text-2xl mb-1">
              {context?.user?.username}
            </h2>
            <div className="text-lg sm:text-2xl mb-3 text-center">
              {getStarRating(calculatePlayerRating(player.stats))}
            </div>

            {/* Stats Radar Chart */}
            <div className="w-full">
              <StatsRadarChart stats={player.stats} />
            </div>
          </div>

          {/* Status */}
          <div className="glass-container p-3 sm:p-6 w-full rounded-lg sm:rounded-2xl shadow-lg">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 flex justify-between items-center">
                <span className="text-sm sm:text-base text-gray-300">
                  Training
                </span>
                <span
                  className={`text-sm sm:text-base ${
                    !trainingOnCooldown ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {!trainingOnCooldown ? "Ready" : trainingTime}
                </span>
              </div>
              <div className="col-span-2 flex justify-between items-center">
                <span className="text-sm sm:text-base text-gray-300">
                  Match
                </span>
                <span
                  className={`text-sm sm:text-base ${
                    !matchOnCooldown ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {!matchOnCooldown ? "Ready" : matchTime}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
