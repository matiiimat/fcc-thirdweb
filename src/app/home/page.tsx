"use client";

import { ConnectButton } from "thirdweb/react";
import { client } from "../client";
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
  return (
    <main className="p-4 min-h-[100vh] flex flex-col items-start justify-between container mx-auto">
      {/* Connect Button in the Top-Right */}
      <div className="absolute top-4 right-4">
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

      {/* Page Content */}
      <div className="flex flex-col items-center justify-center flex-grow">
        <h1 className="text-3xl md:text-5xl font-bold text-zinc-100 mb-4">
          Welcome to Home Page
        </h1>
        <p className="text-zinc-300 text-base text-center">
          This is the landing page after wallet connection. Explore and manage
          your account here.
        </p>
      </div>
    </main>
  );
}
