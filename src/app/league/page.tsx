"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import sdk from "@farcaster/frame-sdk";
import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import { config } from "../components/providers/WagmiProvider";
import Header from "../components/Header";
import Footer from "../components/Footer";
import EnhancedTeamMatchPopup from "../components/EnhancedTeamMatchPopup";
import TeamLeaderboard from "../components/TeamLeaderboard";
import MatchModel from "../models/Match";
import SeasonModel from "../models/Season";

export default function LeaguePage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  // State for tooltip visibility
  const [showTooltip, setShowTooltip] = useState(false);

  // Fetch the balance of the rewards address
  const {
    data: balanceData,
    isLoading: isBalanceLoading,
    isError: isBalanceError,
  } = useBalance({
    address: "0xe9F99F23D2714faD419233C599a51e86A56c9E17",
  });

  // Calculate rewards (total ETH - 20%)
  const rewardsAmount = balanceData
    ? parseFloat(balanceData.formatted) * 0.8 // 80% of the total (subtracting 20%)
    : 0;

  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<any>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchData, setMatchData] = useState<any>(null);
  const [showMatchPopup, setShowMatchPopup] = useState(false);
  const [simulatingMatch, setSimulatingMatch] = useState(false);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [matchInProgress, setMatchInProgress] = useState(false);

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

  // Check for active matches when the page loads
  useEffect(() => {
    const checkForActiveMatches = async () => {
      try {
        // Fetch in-progress matches from the database
        const response = await fetch("/api/matches?status=inProgress");

        if (response.ok) {
          const data = await response.json();

          if (data.success && data.matches && data.matches.length > 0) {
            // Get the most recent in-progress match
            const activeMatch = data.matches[0];

            // Set the match data
            setMatchData({ match: activeMatch });
            setMatchInProgress(true);
            setActiveMatchId(activeMatch._id);

            // Show the match popup if it's in progress
            setShowMatchPopup(true);
          }
        }
      } catch (error) {
        console.error("Error checking for active matches:", error);
      }
    };

    if (!loading) {
      checkForActiveMatches();
    }
  }, [loading]);

  // Function to simulate a match between two teams
  const simulateMatch = async () => {
    setSimulatingMatch(true);
    setError(null);

    try {
      // Team and tactic IDs provided by the user
      const homeTeamId = "67d6ed37b7ed6f94251693a9";
      const awayTeamId = "67d6ed37b7ed6f94251693aa";
      const homeTacticId = "67d6ed37b7ed6f94251693a7";
      const awayTacticId = "67d6ed37b7ed6f94251693a8";

      // Step 1: Simulate the match - this generates the result immediately
      const response = await fetch("/api/teams/teammatch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          homeTeamId,
          awayTeamId,
          homeTacticId,
          awayTacticId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to simulate match");
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to simulate match");
      }

      // Step 2: Save the match to the database as "in progress"
      // This allows other players to see the match in progress
      const saveMatchResponse = await fetch("/api/matches/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          homeTeamId: homeTeamId,
          awayTeamId: awayTeamId,
          homeTeamName: data.match.homeTeam,
          awayTeamName: data.match.awayTeam,
          homeTactic: data.match.homeTactic,
          awayTactic: data.match.awayTactic,
          result: data.match.result,
          homeStats: data.match.homeStats,
          awayStats: data.match.awayStats,
          homePlayerRatings: data.match.homePlayerRatings,
          awayPlayerRatings: data.match.awayPlayerRatings,
          events: data.match.events,
          isInProgress: true, // Mark as in progress, not completed
        }),
      });

      if (!saveMatchResponse.ok) {
        throw new Error("Failed to save match to database");
      }

      const saveMatchData = await saveMatchResponse.json();
      const matchId = saveMatchData.matchId;

      // Store the match ID for tracking
      setActiveMatchId(matchId);
      setMatchInProgress(true);

      // We'll update team stats only when the match is completed

      // Show the match popup immediately
      setMatchData(data);
      setShowMatchPopup(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to simulate match");
    } finally {
      setSimulatingMatch(false);
    }
  };

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
                    <li>🥈 2nd place team: 25%</li>
                    <li>🥉 3rd place team: 20%</li>
                    <li>🔹 4th place team: 15%</li>
                    <li>🔹 5th place team: 10%</li>
                  </ul>
                  <p>
                    The reward for each team is then evenly divided among all
                    registered players in that team at the end of the
                    season&apos;s final match.
                  </p>
                  <p className="mt-2">
                    Payouts are automatic and sent directly to the Farcaster
                    wallet linked to each player.
                  </p>
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
            <div className="mb-6">
              <TeamLeaderboard />
            </div>

            {/* Test Match Button */}
            <div className="text-center mb-3">
              <button
                onClick={simulateMatch}
                className={`gradient-button py-2 px-4 rounded-lg text-sm transition-all duration-300 ${
                  simulatingMatch
                    ? "opacity-50 cursor-not-allowed"
                    : "active:scale-95"
                }`}
                disabled={simulatingMatch}
              >
                {simulatingMatch ? "Simulating..." : "Simulate Test Match"}
              </button>
              <p className="text-xs text-gray-400 mt-1">
                This button is for testing purposes and will be removed later.
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

      {/* Live Match Indicator - only shown when there's an active match but popup is closed */}
      {matchInProgress && !showMatchPopup && (
        <div
          className="fixed bottom-20 right-4 bg-green-600 text-white p-3 rounded-full shadow-lg cursor-pointer flex items-center justify-center animate-pulse"
          onClick={() => setShowMatchPopup(true)}
          aria-label="View live match"
        >
          <div className="mr-2 w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-sm font-medium">LIVE MATCH</span>
        </div>
      )}

      {/* Match Popup */}
      {showMatchPopup && matchData && (
        <EnhancedTeamMatchPopup
          match={matchData.match}
          teamStats={matchData.stats}
          onClose={() => setShowMatchPopup(false)}
          onMatchComplete={async () => {
            // When match is completed, update the database
            if (activeMatchId) {
              try {
                // 1. Mark the match as completed
                await fetch(`/api/matches/${activeMatchId}/complete`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    result: matchData.match.result,
                    homeStats: matchData.match.homeStats,
                    awayStats: matchData.match.awayStats,
                  }),
                });

                // 2. Update team stats
                const homeTeamId = matchData.match.homeTeamId;
                const awayTeamId = matchData.match.awayTeamId;

                await Promise.all([
                  fetch(`/api/teams/${homeTeamId}`, {
                    method: "PATCH",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      stats: matchData.stats.home,
                    }),
                  }),
                  fetch(`/api/teams/${awayTeamId}`, {
                    method: "PATCH",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      stats: matchData.stats.away,
                    }),
                  }),
                ]);

                // 3. Clear the active match state
                setMatchInProgress(false);
                setActiveMatchId(null);

                // 4. Force refresh the leaderboard
                // This will be handled by reloading the page or component
                window.location.reload();
              } catch (error) {
                console.error("Error completing match:", error);
              }
            }
          }}
        />
      )}
    </div>
  );
}
