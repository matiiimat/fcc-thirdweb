"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { PayEmbed } from "thirdweb/react";
import { base } from "thirdweb/chains";
import { client } from "../client";

interface HeaderProps {
  pageName: string;
  xp?: number;
}

export default function Header({ pageName, xp = 0 }: HeaderProps) {
  const router = useRouter();
  const [showPayEmbed, setShowPayEmbed] = useState(false);

  const goToSettings = () => {
    router.push("/settings");
  };

  const goToLeaderboard = () => {
    router.push("/leaderboard");
  };

  return (
    <>
      <header className="relative h-16 bg-[#FFFFF] text-white py-4">
        <h1 className="absolute top-2 left-2 font-bold text-[32px]">
          {pageName}
        </h1>
        {xp !== undefined && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2">
            <Image
              src="/icons/xp-icon.png"
              alt="XP"
              width={16}
              height={16}
              priority
            />
            <span className="text-lg font-semibold">{xp.toLocaleString()}</span>
            <button
              onClick={() => setShowPayEmbed(true)}
              className="ml-2 px-2 py-1 text-sm bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              Get more XP
            </button>
          </div>
        )}
        <div className="absolute top-[10px] right-[10px] flex gap-4">
          <button
            onClick={goToLeaderboard}
            className="bg-[#0d0f12]/90 shadow-[inset_-2px_-2px_5px_rgba(255,255,255,0.07),inset_2px_2px_5px_rgba(0,0,0,0.5)] hover:shadow-[inset_-1px_-1px_3px_rgba(255,255,255,0.1),inset_1px_1px_3px_rgba(0,0,0,0.4)] flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 hover:scale-105"
            aria-label="Leaderboard"
          >
            <Image
              src="/icons/leaderboard-icon.png"
              alt="Leaderboard"
              width={24}
              height={24}
              priority
            />
          </button>
          <button
            onClick={goToSettings}
            className="bg-[#0d0f12]/90 shadow-[inset_-2px_-2px_5px_rgba(255,255,255,0.07),inset_2px_2px_5px_rgba(0,0,0,0.5)] hover:shadow-[inset_-1px_-1px_3px_rgba(255,255,255,0.1),inset_1px_1px_3px_rgba(0,0,0,0.4)] flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 hover:scale-105"
            aria-label="Settings"
          >
            <Image
              src="/icons/settings-icon.png"
              alt="Settings"
              width={24}
              height={24}
              priority
            />
          </button>
        </div>
      </header>

      {showPayEmbed && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-container p-4 w-full max-w-md rounded-xl shadow-lg">
            <div className="mb-4">
              <h2 className="text-lg font-bold text-white">Get More XP</h2>
              <p className="text-sm text-gray-400">
                Purchase XP with USDC (10 USDC = 1000 XP)
              </p>
            </div>
            <PayEmbed
              client={client}
              payOptions={{
                prefillBuy: {
                  chain: base,
                  token: {
                    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
                    name: "USD Coin",
                    symbol: "USDC",
                  },
                  allowEdits: {
                    amount: true,
                    token: false,
                    chain: false,
                  },
                },
                buyWithFiat: false,
              }}
            />
            <button
              onClick={() => setShowPayEmbed(false)}
              className="mt-4 w-full px-4 py-2 rounded-lg bg-gray-800 text-gray-300 active:bg-gray-700 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
