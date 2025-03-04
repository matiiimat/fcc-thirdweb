"use client";

import Image from "next/image";
import { ConnectButton } from "thirdweb/react";
import { client } from "./client";
import { darkTheme } from "thirdweb/react";
import { inAppWallet, createWallet } from "thirdweb/wallets";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import sdk from "@farcaster/frame-sdk";

const wallets = [
  inAppWallet({
    auth: {
      options: [
        "google",
        "discord",
        "telegram",
        "farcaster",
        "x",
        "passkey",
        "apple",
      ],
    },
  }),
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("me.rainbow"),
];

export default function Home() {
  const router = useRouter();
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<any>();

  // Farcaster Frame Integration
  useEffect(() => {
    const load = async () => {
      try {
        // Call ready() to hide the loading screen
        await sdk.actions.ready();
        setContext(await sdk.context);
      } catch (error) {
        console.error("Error initializing Farcaster Frame SDK:", error);
      }
    };

    if (!isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
    }
  }, [isSDKLoaded]);
  // end Farcaster Frame Integration

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
              theme={darkTheme({
                colors: { accentText: "hsl(140, 100%, 26%)" },
              })}
              connectModal={{
                size: "compact",
                showThirdwebBranding: false,
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
