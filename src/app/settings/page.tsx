"use client";

import { ConnectButton } from "thirdweb/react";
import { client } from "../client";
import { useRouter } from "next/navigation";
import { inAppWallet, createWallet } from "thirdweb/wallets";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { base } from "thirdweb/chains";

const wallets = [
  inAppWallet({
    auth: {
      options: ["farcaster"],
    },
  }),
  createWallet("com.coinbase.wallet"),
];

export default function SettingsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen">
      <Header pageName="Settings" />
      <main className="container max-w-md mx-auto px-4 py-6">
        <div className="glass-container p-6">
          <h2 className="text-2xl font-bold text-center mb-8">Settings</h2>

          {/* Connect Button */}
          <div className="flex flex-col items-center space-y-6">
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
              className="gradient-button px-6 py-2 rounded-xl w-full"
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
