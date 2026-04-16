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
import { ShareBar } from "./components/ui";
import { useAppInitialization } from "./hooks/useAppInitialization";
import {
  calculatePlayerRating,
  getStarCount,
  getActionCooldown,
} from "./lib/game";
import { resolveIdentity } from "./lib/playerIdentity";
import { playerCardOgUrl, appOrigin } from "./lib/ogUrl";

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
      <AppLoader message="Connecting to Farcaster..." showProgress={true} />
    );
  }

  // Show loading skeleton while data is being fetched
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
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
      <div className="min-h-screen">
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
      <div className="flex flex-col min-h-screen">
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
      <div className="flex flex-col min-h-screen">
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

  // Resolve identity (legacy players get safe defaults).
  const identity = resolveIdentity(player as any);

  // Pre-build the share payload so the button stays inert-cheap on render.
  const playerRating = calculatePlayerRating(player.stats);
  const displayName = context?.user?.username || player.playerName;
  const shareImageUrl = playerCardOgUrl({
    name: displayName,
    username: context?.user?.username,
    rating: Math.round(playerRating * 10), // 0-10 → 0-100
    team: player.team,
    traits: identity.traits,
    pfp: context?.user?.pfpUrl,
    stats: player.stats,
  });
  const shareText = `I'm rated ${playerRating.toFixed(
    1
  )} on fcc/FC. Come beat me.`;

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        pageName="Home"
        onMailboxClick={handleMailboxClick}
        hasNotifications={hasNotifications}
      />
      <main className="flex-1 container mx-auto px-3 sm:px-6 py-2 sm:py-4 pb-24">
        <div className="flex flex-col items-center max-w-md mx-auto space-y-2 sm:space-y-3">

          {/* Identity — broadcast register */}
          <div className="data-card p-4 sm:p-6 w-full shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              {context?.user?.pfpUrl ? (
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-pitch-line/60 shadow-lg shadow-pitch-deep/40">
                  <Image
                    src={context.user.pfpUrl}
                    alt="Profile"
                    width={56}
                    height={56}
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-full bg-pitch-dark border-2 border-pitch-line/60" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-broadcast text-floodlight/50 font-display">
                  Player
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <h2 className="font-display uppercase tracking-broadcast text-2xl text-chalk truncate leading-none">
                    {displayName}
                  </h2>
                  <ShareBar
                    variant="icon"
                    ariaLabel="Share my player card"
                    text={shareText}
                    imageUrl={shareImageUrl}
                    linkUrl={appOrigin()}
                  />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-touchline font-display text-sm leading-none">
                    {"★".repeat(getStarCount(playerRating))}
                    <span className="text-floodlight/20">
                      {"★".repeat(Math.max(0, 5 - getStarCount(playerRating)))}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Stats Radar Chart */}
            <div className="w-full">
              <StatsRadarChart stats={player.stats} />
            </div>
          </div>

          {/* Matchday status — broadcast strip */}
          <div className="broadcast-card w-full p-3 sm:p-4">
            <div className="mb-2 text-[10px] uppercase tracking-broadcast text-floodlight/50 font-display">
              Matchday Status
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div
                className={`rounded-sm px-3 py-2 border ${
                  trainingOnCooldown
                    ? "border-blood/30 bg-blood/10"
                    : "border-pitch-line/40 bg-pitch/10"
                }`}
              >
                <div className="text-[10px] uppercase tracking-broadcast text-floodlight/50 font-display">
                  Training
                </div>
                <div
                  className={`font-display text-lg leading-none tabular-nums ${
                    trainingOnCooldown ? "text-blood" : "text-pitch-line"
                  }`}
                >
                  {!trainingOnCooldown ? "READY" : trainingTime}
                </div>
              </div>
              <div
                className={`rounded-sm px-3 py-2 border ${
                  matchOnCooldown
                    ? "border-blood/30 bg-blood/10"
                    : "border-pitch-line/40 bg-pitch/10"
                }`}
              >
                <div className="text-[10px] uppercase tracking-broadcast text-floodlight/50 font-display">
                  Match
                </div>
                <div
                  className={`font-display text-lg leading-none tabular-nums ${
                    matchOnCooldown ? "text-blood" : "text-pitch-line"
                  }`}
                >
                  {!matchOnCooldown ? "READY" : matchTime}
                </div>
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
