"use client";

import { ConnectButton } from "thirdweb/react";
import { client } from "../client";
import { useRouter } from "next/navigation";
import { inAppWallet, createWallet } from "thirdweb/wallets";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { base } from "thirdweb/chains";
import { useEffect, useState } from "react";
import { useActiveWallet } from "thirdweb/react";

const wallets = [
  inAppWallet({
    auth: {
      options: ["farcaster"],
    },
  }),
  createWallet("com.coinbase.wallet"),
];

interface PlayerData {
  xp: number;
}

export default function SettingsPage() {
  const router = useRouter();
  const activeWallet = useActiveWallet();
  const wallet = activeWallet?.getAccount();
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlayer() {
      if (!wallet) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/players/address/${encodeURIComponent(wallet.address)}`
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
  }, [wallet, router]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
        <Header pageName="Settings" xp={0} />
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
      <Header pageName="Settings" xp={player?.xp || 0} />
      <main className="flex-1 container max-w-xl mx-auto px-3 sm:px-6 py-2 sm:py-4">
        <div className="glass-container p-3 sm:p-6 rounded-xl sm:rounded-2xl shadow-lg">
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-6 sm:mb-8">
            Settings
          </h2>

          {/* Connect Button */}
          <div className="flex flex-col items-center space-y-4 sm:space-y-6">
            <ConnectButton
              client={client}
              chain={base}
              wallets={wallets}
              connectModal={{ size: "compact" }}
              appMetadata={{
                name: "Home",
                url: "https://example.com",
              }}
            />
            <button
              onClick={() => router.back()}
              className="gradient-button py-2.5 px-6 rounded-lg text-base w-full transition-all duration-300 active:scale-95 sm:hover:scale-[1.02]"
            >
              Back
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
