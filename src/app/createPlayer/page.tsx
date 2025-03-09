"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import sdk from "@farcaster/frame-sdk";
import { Button } from "@/components/ui/Button";

export default function CreatePlayerPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<any>();

  // Farcaster Frame Integration
  useEffect(() => {
    const load = async () => {
      try {
        // Call ready() to hide the loading screen
        await sdk.actions.ready();
        setContext(await sdk.context);
      } catch (error) {
        console.error("Error initializing Farcaster Frame SDK:", error);
      }
    };

    if (!isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
    }
  }, [isSDKLoaded]);
  // end Farcaster Frame Integration

  useEffect(() => {
    async function checkWalletAndPlayer() {
      try {
        if (!isConnected || !address) {
          router.push("/");
          return;
        }

        console.log("Checking wallet address:", address);

        const response = await fetch(
          `/api/players/address/${encodeURIComponent(address)}`
        );
        console.log("Check player response status:", response.status);

        if (response.ok) {
          console.log("Player already exists, redirecting to home");
          router.push("/");
          return;
        } else if (response.status !== 404) {
          const errorData = await response.json();
          console.error("Unexpected error checking player:", errorData);
        }
      } catch (err) {
        console.error("Error checking player:", err);
      } finally {
        setIsChecking(false);
      }
    }

    checkWalletAndPlayer();
  }, [address, isConnected, router]);

  const handleCreatePlayer = async () => {
    if (!isConnected || !address) {
      router.push("/");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Creating player for wallet:", address);

      const response = await fetch("/api/players", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-wallet-address": address,
        },
        body: JSON.stringify({
          ethAddress: address,
          team: "Unassigned",
          managementCertificate: false,
        }),
      });

      console.log("Create player response status:", response.status);

      if (!response.ok) {
        const data = await response.json();
        console.error("Create player error response:", data);
        throw new Error(data.error || "Failed to create player");
      }

      const data = await response.json();
      console.log("Player created successfully:", {
        playerId: data.playerId,
        name: data.playerName,
        address: data.ethAddress,
      });

      router.push("/");
    } catch (err) {
      console.error("Create player error:", err);
      setError(err instanceof Error ? err.message : "Failed to create player");
    } finally {
      setLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
        <Header pageName="Create Player" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-2 text-green-400 text-sm">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isConnected || !address) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
      <Header pageName="Create Player" />
      <main className="flex-1 container max-w-xl mx-auto px-3 sm:px-6 py-2 sm:py-4">
        <div className="glass-container p-3 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg">
          <div className="text-center space-y-4 sm:space-y-6">
            <h1 className="text-2xl sm:text-4xl font-bold text-white">
              Welcome to fcc/FC!
            </h1>

            <p className="text-base sm:text-lg text-gray-300">
              Ready to start your football journey? Create your player and begin
              your path to becoming a legend on the field!
            </p>

            {error && (
              <div className="text-red-500 p-3 glass-container bg-red-900/20 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button
              onClick={handleCreatePlayer}
              isLoading={loading}
              disabled={loading}
              className="w-full py-2.5 px-6"
            >
              {loading ? "Creating Player..." : "CREATE PLAYER"}
            </Button>

            <div className="space-y-2">
              <div className="text-sm text-gray-400">
                Your player will be associated with this wallet address. Losing
                access to this wallet means losing access to your player.
              </div>
              <div className="text-xs text-gray-500 break-all">
                Connected Wallet: {address}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
