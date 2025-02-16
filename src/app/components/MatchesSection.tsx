"use client";

import { useState } from "react";
import MatchPopup from "./MatchPopup";

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  isCompleted: boolean;
  result?: {
    homeScore: number;
    awayScore: number;
  };
}

interface MatchesSectionProps {
  teamName: string;
  matches: Match[];
}

export default function MatchesSection({
  teamName,
  matches,
}: MatchesSectionProps) {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  // Group matches by status (upcoming vs completed)
  const upcomingMatches = matches.filter((match) => !match.isCompleted);
  const completedMatches = matches.filter((match) => match.isCompleted);

  const formatMatchDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  return (
    <div className="glass-container p-4 rounded-xl shadow-lg mt-4">
      <h2 className="text-lg font-semibold text-white mb-4">Team Matches</h2>

      {/* Upcoming Matches */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-green-400 mb-2">
          Upcoming Matches
        </h3>
        <div className="space-y-2">
          {upcomingMatches.length > 0 ? (
            upcomingMatches.map((match) => (
              <div
                key={match.id}
                className="glass-container bg-black/20 p-3 rounded-lg flex justify-between items-center"
              >
                <div className="flex-1 text-sm">
                  <span
                    className={
                      match.homeTeam === teamName
                        ? "text-green-400"
                        : "text-white"
                    }
                  >
                    {match.homeTeam}
                  </span>
                  <span className="text-gray-400 mx-2">vs</span>
                  <span
                    className={
                      match.awayTeam === teamName
                        ? "text-green-400"
                        : "text-white"
                    }
                  >
                    {match.awayTeam}
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  {formatMatchDate(match.date)}
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-400 text-sm text-center">
              No upcoming matches scheduled
            </div>
          )}
        </div>
      </div>

      {/* Completed Matches */}
      <div>
        <h3 className="text-sm font-medium text-blue-400 mb-2">
          Match History
        </h3>
        <div className="space-y-2">
          {completedMatches.length > 0 ? (
            completedMatches.map((match) => (
              <div
                key={match.id}
                className="glass-container bg-black/20 p-3 rounded-lg flex justify-between items-center cursor-pointer hover:bg-black/30 transition-colors"
                onClick={() => setSelectedMatch(match)}
              >
                <div className="flex-1 text-sm">
                  <span
                    className={
                      match.homeTeam === teamName
                        ? "text-green-400"
                        : "text-white"
                    }
                  >
                    {match.homeTeam}
                  </span>
                  <span className="text-gray-400 mx-2">
                    {match.result
                      ? `${match.result.homeScore} - ${match.result.awayScore}`
                      : "vs"}
                  </span>
                  <span
                    className={
                      match.awayTeam === teamName
                        ? "text-green-400"
                        : "text-white"
                    }
                  >
                    {match.awayTeam}
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  {formatMatchDate(match.date)}
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-400 text-sm text-center">
              No match history available
            </div>
          )}
        </div>
      </div>

      {/* Match Details Popup */}
      {selectedMatch && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="glass-container p-4 rounded-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Match Details
            </h3>
            <div className="text-center mb-4">
              <div className="text-xl mb-2">
                <span
                  className={
                    selectedMatch.homeTeam === teamName
                      ? "text-green-400"
                      : "text-white"
                  }
                >
                  {selectedMatch.homeTeam}
                </span>
                <span className="text-gray-400 mx-3">
                  {selectedMatch.result?.homeScore} -{" "}
                  {selectedMatch.result?.awayScore}
                </span>
                <span
                  className={
                    selectedMatch.awayTeam === teamName
                      ? "text-green-400"
                      : "text-white"
                  }
                >
                  {selectedMatch.awayTeam}
                </span>
              </div>
              <div className="text-sm text-gray-400">
                {formatMatchDate(selectedMatch.date)}
              </div>
            </div>
            <button
              onClick={() => setSelectedMatch(null)}
              className="gradient-button w-full py-2 rounded-lg text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
