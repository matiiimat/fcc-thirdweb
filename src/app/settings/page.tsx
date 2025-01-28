"use client";

import { ConnectButton } from "thirdweb/react";
import { client } from "../client";
import { useRouter } from "next/navigation";
import { inAppWallet, createWallet } from "thirdweb/wallets";
import Header from "../components/Header"; // Import the Header

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
    <>
      {/* Pass the pageName prop to the Header */}
      <Header pageName="Settings" />

      <main className="p-4 min-h-[100vh] flex flex-col items-center justify-center relative">
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
      </main>
    </>
  );
}
