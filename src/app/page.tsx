"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCallback, useState, useEffect } from "react";
import { useAccount, useConnect } from "wagmi";
import { config } from "./components/providers/WagmiProvider";
import { Button } from "@/components/ui/Button";
import Header from "./components/Header";
import Footer from "./components/Footer";
import StatsRadarChart from "./components/StatsRadarChart";
import NotificationModal from "./components/NotificationModal";
import AppLoader from "./components/AppLoader";
import ResourcePreloader from "./components/ResourcePreloader";
import { useAppInitialization } from "./hooks/useAppInitialization";
import {
  calculatePlayerRating,
  getStarCount,
  getActionCooldown,
} from "./lib/game";

export default function Home() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  
  // Use optimized initialization hook
  const {
    isSDKReady,
    context,
    player,
    loading,
    error,
    hasNotifications,
  } = useAppInitialization();

  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

  // Redirect to create player if needed
  useEffect(() => {
    if (!loading && isConnected && address && player === null && !error) {
      router.push("/createPlayer");
    }
  }, [loading, isConnected, address, player, error, router]);

  const handleMailboxClick = useCallback(() => {
    setIsNotificationModalOpen(true);
  }, []);

  const handleNotificationUpdate = useCallback(() => {
    // The hook will handle notification updates automatically
    // This is kept for compatibility with the NotificationModal component
  }, []);

  // Show AppLoader only during initial SDK initialization
  if (!isSDKReady) {
    return (
      <>
        <AppLoader message="Connecting to Farcaster..." showProgress={true} />
        <ResourcePreloader />
      </>
    );
  }

  // Show loading skeleton while data is being fetched
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
        <Header
          pageName="Home"
          onMailboxClick={handleMailboxClick}
          hasNotifications={hasNotifications}
        />
        <main className="flex-1 container mx-auto px-3 sm:px-6 py-2 sm:py-4 pb-24">
          <div className="flex flex-col items-center max-w-md mx-auto space-y-2 sm:space-y-3">
            {/* Player Info Skeleton */}
            <div className="glass-container p-3 sm:p-6 w-full rounded-lg sm:rounded-2xl shadow-lg">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-full bg-gray-700/30 animate-pulse"></div>
                <div className="h-6 w-32 bg-gray-700/30 rounded animate-pulse"></div>
              </div>
              <div className="h-6 w-24 mx-auto mb-3 bg-gray-700/30 rounded animate-pulse"></div>
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

  // Show error state
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
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
          >
            Retry
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  // Show connect wallet screen
  if (!isConnected) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
        <Header pageName="fcc/FC" />
        <main className="flex-1 container mx-auto px-3 sm:px-6 py-2 sm:py-4 pb-24">
          <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto">
            <div className="glass-container p-6 w-full rounded-lg shadow-lg text-center">
              <h1 className="text-2xl font-bold mb-4">Welcome to fcc/FC!</h1>
              <p className="mb-6">Connect your wallet to start playing</p>
              <Button
                onClick={() => connect({ connector: config.connectors[0] })}
              >
                Connect Wallet
              </Button>
              {context?.user?.username && (
                <div className="mt-4 text-xs text-gray-400">
                  <p>Username: {context.user.username}</p>
                </div>
              )}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Redirect to create player if no player data
  if (!player) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white text-lg">Redirecting...</div>
        </div>
      </div>
    );
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
      <main className="flex-1 container mx-auto px-3 sm:px-6 py-2 sm:py-4 pb-24">
        <div className="flex flex-col items-center max-w-md mx-auto space-y-2 sm:space-y-3">

          <div className="glass-container p-3 sm:p-6 w-full rounded-lg sm:rounded-2xl shadow-lg">
            <div className="flex items-center justify-center gap-2 mb-1">
              {context?.user?.pfpUrl ? (
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <Image
                    src={context.user.pfpUrl}
                    alt="Profile"
                    width={32}
                    height={32}
                    className="object-cover"
                    unoptimized
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
