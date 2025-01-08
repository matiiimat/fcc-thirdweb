"use client";

import { ConnectButton } from "thirdweb/react";
import { client } from "../client";
import { useRouter } from "next/navigation"; // Import useRouter for navigation
import { inAppWallet, createWallet } from "thirdweb/wallets";

const wallets = [
  inAppWallet({
    auth: {
      options: ["farcaster"],
    },
  }),
  createWallet("com.coinbase.wallet"),
];

export default function HomePage() {
  const router = useRouter(); // Initialize the useRouter hook

  const goToShootingTraining = () => {
    router.push("/shooting"); // Navigate to ShootingTraining page
  };

  return (
    <main className="p-4 min-h-[100vh] flex flex-col items-start justify-between container mx-auto">
      {/* Connect Button in the Top-Right */}
      <div className="absolute top-4 right-4">
        <ConnectButton
          client={client}
          wallets={wallets}
          connectModal={{ size: "compact" }}
          appMetadata={{
            name: "Home",
            url: "https://example.com",
          }}
        />
      </div>

      {/* Page Content */}
      <div className="flex flex-col items-center justify-center flex-grow">
        <h1 className="text-3xl md:text-5xl font-bold text-zinc-100 mb-6">
          Home
        </h1>
        <button
          onClick={goToShootingTraining}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
        >
          Go to Shooting Training
        </button>
      </div>
    </main>
  );
}
