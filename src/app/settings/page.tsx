"use client";

import { ConnectButton } from "thirdweb/react";
import { client } from "../client";
import { useRouter } from "next/navigation";
import { inAppWallet, createWallet } from "thirdweb/wallets";
import Header from "../components/Header"; // Import the Header
import Footer from "../components/Footer";
import { base } from "thirdweb/chains"; // TEST CHAIN ID

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
      <main className="flex flex-col items-center min-h-[60vh] pb-20">
        {/* Connect Button */}
        <div className="flex flex-col items-center space-y-8 mt-8">
          <ConnectButton
            client={client}
            chain={base} // TEST CHAIN BASE
            wallets={wallets}
            connectModal={{ size: "compact" }}
            appMetadata={{
              name: "Home",
              url: "https://example.com",
            }}
          />
          <button
            onClick={() => router.back()}
            className="bg-gray-200 text-black hover:bg-gray-300 rounded px-4 py-2 font-medium"
          >
            Back
          </button>
        </div>
      </main>
      <Footer />
    </>
  );
}
