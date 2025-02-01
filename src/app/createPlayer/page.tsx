"use client";

import { useEffect, useState } from "react";
import { useActiveWallet } from "thirdweb/react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function CreatePlayerPage() {
  const activeWallet = useActiveWallet();
  const wallet = activeWallet?.getAccount();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkWalletAndPlayer() {
      try {
        // If no wallet is connected, redirect to home
        if (!wallet) {
          router.push("/");
          return;
        }

        const walletAddress = wallet.toString();
        console.log("Checking wallet address:", walletAddress); // Debug log

        // Check if player already exists
        const response = await fetch(`/api/players/address/${walletAddress}`);
        if (response.ok) {
          // Player exists, redirect to home
          router.push("/");
          return;
        }
      } catch (err) {
        console.error("Error checking player:", err);
      } finally {
        setIsChecking(false);
      }
    }

    checkWalletAndPlayer();
  }, [wallet, router]);

  const handleCreatePlayer = async () => {
    if (!wallet) {
      router.push("/");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const walletAddress = wallet.toString();
      console.log("Creating player for wallet:", walletAddress); // Debug log

      const response = await fetch("/api/players", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ethAddress: walletAddress,
          team: "Unassigned", // Default team
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create player");
      }

      // Redirect to home page after successful creation
      router.push("/");
    } catch (err) {
      console.error("Create player error:", err);
      setError(err instanceof Error ? err.message : "Failed to create player");
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking wallet and player status
  if (isChecking) {
    return (
      <>
        <Header pageName="Create Player" />
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2">Loading...</p>
        </div>
        <Footer />
      </>
    );
  }

  // If no wallet is connected, this will redirect in useEffect
  if (!wallet) {
    return null;
  }

  return (
    <>
      <Header pageName="Create Player" />

      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="text-center max-w-2xl">
          <h1 className="text-4xl font-bold mb-6">Welcome to ffcFC</h1>

          <p className="text-lg mb-8">
            Ready to start your soccer journey? Create your player and begin
            your path to becoming a legend on the field!
          </p>

          {error && (
            <div className="text-red-500 mb-4 p-3 bg-red-100 rounded">
              {error}
            </div>
          )}

          <button
            onClick={handleCreatePlayer}
            disabled={loading}
            className={`
              bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg
              text-lg transition-colors duration-200
              ${loading ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            {loading ? "Creating Player..." : "CREATE PLAYER"}
          </button>

          <div className="mt-4 text-sm text-gray-600">
            Connected Wallet: {wallet.toString()}
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
