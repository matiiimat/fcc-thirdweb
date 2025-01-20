"use client";

import { ConnectButton } from "thirdweb/react";
import { client } from "./client";
import { inAppWallet, createWallet } from "thirdweb/wallets";
import { useRouter } from "next/navigation"; // for navigation

const wallets = [
  inAppWallet({
    auth: {
      options: ["farcaster"],
    },
  }),
  createWallet("com.coinbase.wallet"),
];

export default function Home() {
  const router = useRouter();

  const goToHome = () => {
    router.push("/home");
  };

  return (
    <main className="p-4 pb-10 min-h-[100vh] flex items-center justify-center container max-w-screen-lg mx-auto">
      <div className="py-20 text-center space-y-6">
        <h1 className="text-2xl md:text-6xl font-semibold md:font-bold tracking-tighter text-zinc-100">
          Farcaster FC
        </h1>

        {/* PLAY Button */}
        <button
          onClick={goToHome}
          className="px-6 py-3 text-white bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold transition-colors"
        >
          PLAY
        </button>

        {/* Connect Button */}
        <div className="flex justify-center">
          <ConnectButton
            client={client}
            wallets={wallets}
            connectModal={{ size: "compact" }}
            appMetadata={{
              name: "Farcaster FC",
              url: "https://example.com",
            }}
          />
        </div>
      </div>
    </main>
  );
}
