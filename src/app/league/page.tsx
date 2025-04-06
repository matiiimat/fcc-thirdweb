"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import sdk from "@farcaster/frame-sdk";
import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import { config } from "../components/providers/WagmiProvider";
import Header from "../components/Header";
import Footer from "../components/Footer";
import TeamLeaderboard from "../components/TeamLeaderboard";

export default function LeaguePage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  // State for tooltip visibility
  const [showTooltip, setShowTooltip] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const teamsPerPage = 10;
  const [totalTeams, setTotalTeams] = useState(0);

  // Fetch the balance of the rewards address
  const {
    data: balanceData,
    isLoading: isBalanceLoading,
    isError: isBalanceError,
  } = useBalance({
    address: "0xdd5Af00D3172d25C8762193478275b858148a454",
  });

  // Calculate rewards (total ETH - 20%)
  const rewardsAmount = balanceData
    ? parseFloat(balanceData.formatted) * 0.8 // 80% of the total (subtracting 20%)
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

  // Fetch total number of teams for pagination
  useEffect(() => {
    const fetchTotalTeams = async () => {
      try {
        const response = await fetch("/api/teams/count");
        if (response.ok) {
          const data = await response.json();
          // Ensure we have at least 1 team for pagination calculations
          setTotalTeams(Math.max(data.count, 1));
        } else {
          // Handle API error
          console.warn("Could not fetch team count, using fallback value");
          setTotalTeams(1); // Fallback to minimum value
          setError("Unable to load team count data. Using default pagination.");
        }
      } catch (error) {
        console.error("Error fetching team count:", error);
        setTotalTeams(1); // Fallback to minimum value
        setError("Unable to load team count data. Using default pagination.");
      }
    };

    if (!loading) {
      fetchTotalTeams();
    }
  }, [loading]); // Only run when loading state changes, not on every render

  // Calculate total pages - ensure at least 1 page even with 0 teams
  const totalPages = Math.max(Math.ceil(totalTeams / teamsPerPage), 1);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Show loading state if either the page is loading or balance is loading
  if (loading || isBalanceLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
        <Header pageName="League" />
        <main className="flex-1 container max-w-xl mx-auto px-3 sm:px-6 py-2 sm:py-4 pb-24">
          <div className="grid grid-cols-1 gap-4">
            {/* League Content Section Skeleton */}
            <div className="glass-container p-3 sm:p-4 rounded-xl shadow-lg">
              <div className="h-6 w-36 bg-gray-700/30 rounded animate-pulse mb-4"></div>

              {/* Prize Pool Skeleton */}
              <div className="bg-gradient-to-r from-green-900/30 to-green-700/30 p-3 rounded-lg mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-5 w-32 bg-gray-700/30 rounded animate-pulse"></div>
                  <div className="h-5 w-5 rounded-full bg-gray-700/30 animate-pulse"></div>
                </div>
                <div className="h-8 w-24 mx-auto bg-gray-700/30 rounded animate-pulse"></div>
              </div>

              {/* Leaderboard Skeleton */}
              <div className="mb-6">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 mb-2 glass-container rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 bg-gray-700/30 rounded animate-pulse"></div>
                      <div className="h-6 w-32 bg-gray-700/30 rounded animate-pulse"></div>
                    </div>
                    <div className="h-6 w-16 bg-gray-700/30 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
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
            <div className="bg-gradient-to-r from-green-900/30 to-green-700/30 p-3 rounded-lg mb-4 relative">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-green-400 font-medium text-sm">
                  Current Prize Pool
                </h3>
                <button
                  className="w-5 h-5 rounded-full bg-gray-700 text-gray-300 flex items-center justify-center text-xs"
                  onClick={() => setShowTooltip(!showTooltip)}
                  aria-label="Prize pool information"
                >
                  i
                </button>
              </div>

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
                <div className="flex items-center justify-center">
                  <span className="text-green-400 font-semibold text-xl">
                    {rewardsAmount.toFixed(3)} ETH
                  </span>
                </div>
              )}

              {/* Tooltip */}
              {showTooltip && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-gray-800 rounded-lg p-3 z-10 shadow-lg text-xs text-gray-300 leading-relaxed">
                  <p className="mb-2">
                    The total prize pool is funded by all in-game store
                    purchases, with 20% deducted for development costs. The
                    remaining amount is distributed as rewards after the final
                    game of the season, following these rules:
                  </p>
                  <ul className="space-y-1 mb-2">
                    <li>🥇 1st place team: 30% of the prize pool</li>
                    <li>🥈 2nd place team: 20%</li>
                    <li>🥉 3rd place team: 15%</li>
                    <li>🔹 4th place team: 10%</li>
                    <li>🔹 5th place team: 5%</li>
                  </ul>
                  <p>The reward is sent to the captain of each team.</p>
                  <button
                    className="mt-2 text-green-400 font-medium"
                    onClick={() => setShowTooltip(false)}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>

            {/* Team Leaderboard */}
            <div className="mb-4">
              <TeamLeaderboard page={currentPage} limit={teamsPerPage} />
            </div>

            {/* Pagination Controls - Only show if we have teams */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-4 mb-2">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md text-xs ${
                    currentPage === 1
                      ? "bg-gray-700/30 text-gray-500 cursor-not-allowed"
                      : "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
                  }`}
                  aria-label="Previous page"
                >
                  &lt;
                </button>

                <div className="flex space-x-1">
                  {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    // Show current page, first, last, and pages around current
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-7 h-7 rounded-md text-xs flex items-center justify-center ${
                            currentPage === pageNum
                              ? "bg-green-600/70 text-white"
                              : "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (
                      (pageNum === currentPage - 2 && currentPage > 3) ||
                      (pageNum === currentPage + 2 &&
                        currentPage < totalPages - 2)
                    ) {
                      // Show ellipsis for skipped pages
                      return (
                        <span
                          key={pageNum}
                          className="w-7 h-7 flex items-center justify-center text-gray-400"
                        >
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() =>
                    handlePageChange(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-md text-xs ${
                    currentPage === totalPages
                      ? "bg-gray-700/30 text-gray-500 cursor-not-allowed"
                      : "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50"
                  }`}
                  aria-label="Next page"
                >
                  &gt;
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Error display - show both API errors and balance errors */}
        {(error || isBalanceError) && (
          <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-3 mt-4 text-center">
            <p className="text-red-400 text-xs">
              {error ||
                (isBalanceError
                  ? "Failed to load prize pool data. Please try again later."
                  : "")}
            </p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
