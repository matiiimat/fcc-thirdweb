"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import sdk, { Context } from "@farcaster/frame-sdk";
import { useAccount } from "wagmi";
import { isDevMode } from "../lib/devConnector";

export type FrameContext = Context.FrameContext;

interface PlayerData {
  playerId: string;
  playerName: string;
  username?: string;
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
  privateTrainer?: {
    selectedSkill: string | null;
    remainingSessions: number;
  };
  lastGameResult?: {
    score: number;
    opponent: string;
    result: "win" | "loss" | "draw";
  };
}

interface UseAppInitializationReturn {
  isSDKReady: boolean;
  context: FrameContext | undefined;
  player: PlayerData | null;
  loading: boolean;
  error: string | null;
  hasNotifications: boolean;
  refetchPlayer: () => Promise<void>;
  updatePlayer: (newPlayer: PlayerData) => void;
}

// Global state to prevent multiple SDK initializations
let globalSDKState = {
  isInitialized: false,
  isInitializing: false,
  context: null as FrameContext | null,
  error: null as string | null,
};

const sdkListeners = new Set<(state: typeof globalSDKState) => void>();

export function useAppInitialization(): UseAppInitializationReturn {
  const { address, isConnected } = useAccount();
  const [isSDKReady, setIsSDKReady] = useState(globalSDKState.isInitialized);
  const [context, setContext] = useState<FrameContext | undefined>(globalSDKState.context || undefined);
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(globalSDKState.error);
  const [hasNotifications, setHasNotifications] = useState(false);
  const playerFetchRef = useRef<AbortController | null>(null);

  // Initialize SDK once globally
  useEffect(() => {
    const handleSDKStateChange = (state: typeof globalSDKState) => {
      setIsSDKReady(state.isInitialized);
      setContext(state.context || undefined);
      setError(state.error);
    };

    sdkListeners.add(handleSDKStateChange);

    const initializeSDK = async () => {
      if (globalSDKState.isInitialized || globalSDKState.isInitializing) {
        return;
      }

      globalSDKState.isInitializing = true;
      
      try {
        // Call ready as early as possible to minimize loading time
        // This tells Farcaster the app is ready to be displayed
        await sdk.actions.ready();
        
        // Get context after ready (can be done in parallel with other initialization)
        const frameContext = await sdk.context;
        globalSDKState.context = frameContext;
        
        globalSDKState.isInitialized = true;
        globalSDKState.error = null;
        
        // Notify all listeners
        sdkListeners.forEach(listener => listener(globalSDKState));
        
        // Try to add frame (non-blocking, happens after ready)
        try {
          await sdk.actions.addFrame();
        } catch (addFrameError) {
          console.log("Frame add failed (non-critical):", addFrameError);
        }
        
      } catch (initError) {
        console.error("SDK initialization failed:", initError);
        globalSDKState.error = initError instanceof Error ? initError.message : "SDK initialization failed";
        globalSDKState.isInitializing = false;
        
        // Notify all listeners
        sdkListeners.forEach(listener => listener(globalSDKState));
      }
    };

    if (sdk && !globalSDKState.isInitialized && !globalSDKState.isInitializing) {
      initializeSDK();
    }

    return () => {
      sdkListeners.delete(handleSDKStateChange);
    };
  }, []);

  // Optimized player data fetching with abort controller and caching
  const fetchPlayer = useCallback(async (signal?: AbortSignal) => {
    if (!address) {
      setPlayer(null);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/players/address/${encodeURIComponent(address)}`,
        { signal }
      );

      if (signal?.aborted) return;

      if (!response.ok) {
        if (response.status === 404) {
          if (isDevMode) {
            const createRes = await fetch("/api/players", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ethAddress: address,
                team: "Unassigned",
                username: "DevPlayer",
              }),
              signal,
            });
            if (createRes.ok) {
              const created = await createRes.json();
              setPlayer(created);
              setError(null);
              return;
            }
          }
          setPlayer(null);
          return;
        }
        throw new Error("Failed to fetch player data");
      }

      const data = await response.json();
      
      // Clean stats data (optimized with early return)
      const validStats = [
        "strength", "stamina", "passing", "shooting",
        "defending", "speed", "positioning", "workEthic"
      ];
      
      if (!data.stats) {
        throw new Error("Invalid player data: missing stats");
      }
      
      const cleanStats = Object.fromEntries(
        Object.entries(data.stats)
          .filter(([key]) =>
            validStats.includes(key) &&
            !key.startsWith("$") &&
            !key.startsWith("_")
          )
          .map(([key, value]) => [key, Number(value)])
      );
      
      setPlayer({ ...data, stats: cleanStats });
      setError(null);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Ignore aborted requests
      }
      setError(err instanceof Error ? err.message : "An error occurred");
      setPlayer(null);
    }
  }, [address]);

  // Fetch notifications in parallel with caching
  const fetchNotifications = useCallback(async (signal?: AbortSignal) => {
    if (!address) {
      setHasNotifications(false);
      return;
    }

    try {
      const response = await fetch("/api/notifications", {
        headers: { ethAddress: address },
        signal,
      });

      if (signal?.aborted) return;

      if (response.ok) {
        const data = await response.json();
        setHasNotifications(data.notifications?.length > 0);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error("Error checking notifications:", err);
      }
    }
  }, [address]);

  // Combined data fetching effect
  useEffect(() => {
    if (!isConnected) {
      setLoading(false);
      setPlayer(null);
      setHasNotifications(false);
      return;
    }

    // Cancel previous request
    if (playerFetchRef.current) {
      playerFetchRef.current.abort();
    }

    const controller = new AbortController();
    playerFetchRef.current = controller;

    const fetchData = async () => {
      setLoading(true);
      
      // Fetch player data and notifications in parallel
      await Promise.all([
        fetchPlayer(controller.signal),
        fetchNotifications(controller.signal)
      ]);
      
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      controller.abort();
    };
  }, [address, isConnected, fetchPlayer, fetchNotifications]);

  // Refetch player data function
  const refetchPlayer = useCallback(async () => {
    if (!address) return;
    
    const controller = new AbortController();
    await fetchPlayer(controller.signal);
  }, [address, fetchPlayer]);

  // Update player data function
  const updatePlayer = useCallback((newPlayer: PlayerData) => {
    setPlayer(newPlayer);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playerFetchRef.current) {
        playerFetchRef.current.abort();
      }
    };
  }, []);

  return {
    isSDKReady,
    context,
    player,
    loading,
    error,
    hasNotifications,
    refetchPlayer,
    updatePlayer,
  };
}