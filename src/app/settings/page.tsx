"use client";

import { client } from "../client";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useEffect, useState } from "react";
import sdk from "@farcaster/frame-sdk";
import { useAccount, useConnect, useDisconnect } from "wagmi";

interface PlayerData {}
export default function SettingsPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<any>();
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);

  // Farcaster Frame Integration
  useEffect(() => {
    const load = async () => {
      try {
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

  useEffect(() => {
    async function fetchPlayer() {
      if (!isConnected || !address) {
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
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchPlayer();
  }, [isConnected, address, router]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
        <Header pageName="Settings" />
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

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
      <Header pageName="Settings" />
      <main className="flex-1 container max-w-xl mx-auto px-3 sm:px-6 py-2 sm:py-4">
        <div className="glass-container p-3 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg">
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-6 sm:mb-8">
            Settings
          </h2>

          {/* Connect Button */}
          <div className="flex flex-col items-center space-y-4 sm:space-y-6">
            <button
              onClick={() => router.back()}
              className="gradient-button py-2.5 px-6 rounded-lg text-base w-full transition-all duration-300 active:scale-95 sm:hover:scale-[1.02]"
            >
              Back
            </button>
            <button
              onClick={() => disconnect()}
              className="gradient-button py-2.5 px-6 rounded-lg text-base w-full transition-all duration-300 active:scale-95 sm:hover:scale-[1.02]"
            >
              Disconnect
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
