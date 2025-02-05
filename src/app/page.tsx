"use client";

import Image from "next/image";
import { ConnectButton } from "thirdweb/react";
import { client } from "./client";
import { inAppWallet, createWallet } from "thirdweb/wallets";
import { useRouter } from "next/navigation";

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
    <main className="min-h-[100vh] bg-gradient-to-b from-black via-black to-green-900 flex items-center justify-center">
      <div className="w-full max-w-md mx-auto p-6">
        <div className="backdrop-blur-sm bg-black/20 border border-green-500/30 rounded-3xl p-8 space-y-8">
          {/* Logo (centered) */}
          <div className="flex justify-center">
            <Image
              src="/logo.png"
              alt="Logo"
              width={80}
              height={80}
              className="mx-auto"
              priority
            />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold tracking-tight text-white text-center">
            Farcaster FC
          </h1>

          {/* Instructions */}
          <div className="text-gray-300 text-center text-sm">
            Connect to your web3 wallet and click on the play button to get
            started.
          </div>

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

          {/* PLAY Button */}
          <button
            onClick={goToHome}
            className="w-full px-6 py-3 text-white bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 rounded-xl font-semibold transition-all duration-200 border border-green-400/30 shadow-lg shadow-green-900/20"
          >
            PLAY
          </button>
        </div>
      </div>
    </main>
  );
}
