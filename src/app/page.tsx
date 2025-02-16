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
    <main className="min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21] flex items-center justify-center">
      <div className="w-full max-w-md mx-auto p-4 sm:p-6">
        <div className="glass-container p-6 sm:p-8 rounded-xl sm:rounded-2xl space-y-6 sm:space-y-8">
          {/* Logo (centered) */}
          <div className="flex justify-center">
            <Image
              src="/logo.png"
              alt="Logo"
              width={240}
              height={240}
              className="mx-auto"
              priority
            />
          </div>

          {/* Title */}
          {/* <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white text-center">
            fcc/FC
          </h1> */}

          {/* Instructions */}
          <div className="text-gray-300 text-center text-sm sm:text-base">
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
                name: "fcc/FC",
                url: "https://example.com",
              }}
            />
          </div>

          {/* PLAY Button */}
          <button
            onClick={goToHome}
            className="w-full gradient-button py-2.5 px-6 rounded-lg text-base transition-all duration-300 active:scale-95 sm:hover:scale-[1.02]"
          >
            PLAY
          </button>
        </div>
      </div>
    </main>
  );
}
