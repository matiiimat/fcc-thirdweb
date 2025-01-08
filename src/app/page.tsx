"use client";

import { ConnectButton } from "thirdweb/react";
import { client } from "./client";

import { inAppWallet, createWallet } from "thirdweb/wallets";
const wallets = [
  inAppWallet({
    auth: {
      options: ["farcaster"],
    },
  }),
  createWallet("com.coinbase.wallet"),
];

export default function Home() {
  return (
    <main className="p-4 pb-10 min-h-[100vh] flex items-center justify-center container max-w-screen-lg mx-auto">
      <div className="py-20 text-center">
        <h1 className="text-2xl md:text-6xl font-semibold md:font-bold tracking-tighter mb-6 text-zinc-100">
          Farcaster FC
        </h1>

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
