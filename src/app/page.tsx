"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import sdk, { Context } from "@farcaster/frame-sdk";
import Image from "next/image";

export type FrameContext = Context.FrameContext;
export type SafeAreaInsets = Context.SafeAreaInsets;

export type FrameNotificationDetails = {
  url: string;
  token: string;
};

export type AddFrameRejectedReason =
  | "invalid_domain_manifest"
  | "rejected_by_user";

export type AddFrameResult =
  | {
      added: true;
      notificationDetails?: FrameNotificationDetails;
    }
  | {
      added: false;
      reason: AddFrameRejectedReason;
    };

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
import NotificationModal from "./components/NotificationModal";
import {
  calculatePlayerRating,
  getStarCount,
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
  const [addFrameResult, setAddFrameResult] = useState<AddFrameResult | null>(
    null
  );
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(false);

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

        // Automatically prompt user to add frame to their Farcaster client
        try {
          // Use type assertion to ensure TypeScript understands the structure
          const result = (await sdk.actions.addFrame()) as AddFrameResult;
          setAddFrameResult(result);

          // Use type guards to safely check properties
          if ("added" in result && result.added === true) {
            console.log("Frame added successfully", result.notificationDetails);
          } else if (
            "added" in result &&
            result.added === false &&
            "reason" in result
          ) {
            console.log("Frame not added", result.reason);
          }
        } catch (addFrameError) {
          console.error("Error adding frame:", addFrameError);
        }
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
          `/api/players/address/${encodeURIComponent(address)}`,
          { cache: "no-store" } // Prevent caching
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

  // Check for notifications
  useEffect(() => {
    async function checkNotifications() {
      if (!address) {
        setHasNotifications(false);
        return;
      }

      try {
        const response = await fetch("/api/notifications", {
          headers: {
            ethAddress: address,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setHasNotifications(data.notifications?.length > 0);
        }
      } catch (err) {
        console.error("Error checking notifications:", err);
      }
    }

    if (isConnected && address) {
      checkNotifications();
      // Check for notifications every minute
      const intervalId = setInterval(checkNotifications, 60000);
      return () => clearInterval(intervalId);
    }
  }, [address, isConnected]);

  const toggleContext = useCallback(() => {
    setIsContextOpen((prev) => !prev);
  }, []);

  const handleMailboxClick = useCallback(() => {
    setIsNotificationModalOpen(true);
  }, []);

  const handleNotificationUpdate = useCallback(() => {
    // Refresh notification status
    if (address) {
      fetch("/api/notifications", {
        headers: {
          ethAddress: address,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          setHasNotifications(data.notifications?.length > 0);
        })
        .catch((err) => console.error("Error updating notifications:", err));
    }
  }, [address]);

  if (!isSDKLoaded) {
    return <div>Loading...</div>;
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
        <Header
          pageName="Home"
          onMailboxClick={handleMailboxClick}
          hasNotifications={hasNotifications}
        />
        <main className="flex-1 container mx-auto px-3 sm:px-6 py-2 sm:py-4 pb-16 sm:pb-20">
          <div className="flex flex-col items-center max-w-md mx-auto space-y-2 sm:space-y-3">
            {/* Player Info Skeleton */}
            <div className="glass-container p-3 sm:p-6 w-full rounded-lg sm:rounded-2xl shadow-lg">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-full bg-gray-700/30 animate-pulse"></div>
                <div className="h-6 w-32 bg-gray-700/30 rounded animate-pulse"></div>
              </div>
              <div className="h-6 w-24 mx-auto mb-3 bg-gray-700/30 rounded animate-pulse"></div>

              {/* Stats Chart Skeleton */}
              <div className="w-full aspect-square bg-gray-700/30 rounded animate-pulse"></div>
            </div>

            {/* Status Skeleton */}
            <div className="glass-container p-3 sm:p-6 w-full rounded-lg sm:rounded-2xl shadow-lg">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 flex justify-between items-center">
                  <div className="h-4 w-16 bg-gray-700/30 rounded animate-pulse"></div>
                  <div className="h-4 w-12 bg-gray-700/30 rounded animate-pulse"></div>
                </div>
                <div className="col-span-2 flex justify-between items-center">
                  <div className="h-4 w-16 bg-gray-700/30 rounded animate-pulse"></div>
                  <div className="h-4 w-12 bg-gray-700/30 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
        <Header
          pageName="Home"
          onMailboxClick={handleMailboxClick}
          hasNotifications={hasNotifications}
        />
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
      <Header
        pageName="Home"
        onMailboxClick={handleMailboxClick}
        hasNotifications={hasNotifications}
      />
      <main className="flex-1 container mx-auto px-3 sm:px-6 py-2 sm:py-4 pb-16 sm:pb-20">
        <div className="flex flex-col items-center max-w-md mx-auto space-y-2 sm:space-y-3">

          <div className="glass-container p-3 sm:p-6 w-full rounded-lg sm:rounded-2xl shadow-lg">
            <div className="flex items-center justify-center gap-2 mb-1">
              {context?.user?.pfpUrl ? (
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <img
                    src={context.user.pfpUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    width={32}
                    height={32}
                  />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-600"></div>
              )}
              <h2 className="text-xl sm:text-2xl">{context?.user?.username}</h2>
            </div>
            <div className="text-lg sm:text-2xl mb-3 text-center">
              {Array.from({ length: getStarCount(calculatePlayerRating(player.stats)) }, (_, index) => (
                <span key={index} className="text-yellow-400">⭐</span>
              ))}
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
      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        ethAddress={address || ""}
        onNotificationUpdate={handleNotificationUpdate}
      />
    </div>
  );
}
