"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import sdk from "@farcaster/frame-sdk";
import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import { config } from "../components/providers/WagmiProvider";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function LeaguePage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  // Fetch the balance of the rewards address
  const {
    data: balanceData,
    isLoading: isBalanceLoading,
    isError: isBalanceError,
  } = useBalance({
    address: "0xe9F99F23D2714faD419233C599a51e86A56c9E17",
  });

  // Calculate rewards (total ETH - 10%)
  const rewardsAmount = balanceData
    ? parseFloat(balanceData.formatted) * 0.9 // 90% of the total (subtracting 10%)
    : 0;

  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<any>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Farcaster Frame Integration
  useEffect(() => {
    const load = async () => {
      try {
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

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Show loading state if either the page is loading or balance is loading
  if (loading || isBalanceLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
        <Header pageName="League" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-2 text-green-400 text-sm">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
      <Header pageName="League" />
      <main className="flex-1 container max-w-xl mx-auto px-3 sm:px-6 py-2 sm:py-4 pb-24">
        <div className="grid grid-cols-1 gap-4">
          {/* League Content Section */}
          <div className="glass-container p-3 sm:p-4 rounded-xl shadow-lg">
            <h2 className="text-base font-semibold text-white mb-2">
              League Standings
            </h2>

            {/* Rewards Section */}
            <div className="bg-gradient-to-r from-green-900/30 to-green-700/30 p-3 rounded-lg mb-4">
              <h3 className="text-green-400 font-medium text-sm mb-1">
                Current Prize Pool
              </h3>

              {isBalanceLoading ? (
                <div className="flex items-center justify-center py-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500 mr-2"></div>
                  <span className="text-gray-300 text-sm">
                    Loading rewards...
                  </span>
                </div>
              ) : isBalanceError ? (
                <p className="text-red-400 text-sm">
                  Error loading prize pool data
                </p>
              ) : (
                <div className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">Total Pool:</span>
                    <span className="text-white font-medium">
                      {balanceData
                        ? `${balanceData.formatted} ${balanceData.symbol}`
                        : "0 ETH"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-gray-300 text-sm">
                      Rewards (90%):
                    </span>
                    <span className="text-green-400 font-semibold">
                      {rewardsAmount.toFixed(6)} ETH
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="text-center mb-3">
              <p className="text-gray-300 text-sm">
                League content will be added soon.
              </p>
            </div>
          </div>
        </div>

        {(error || isBalanceError) && (
          <div className="text-red-500 text-center mt-2 text-xs">
            {error ||
              (isBalanceError
                ? "Failed to load prize pool data. Please try again later."
                : "")}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
