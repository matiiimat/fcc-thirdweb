"use client";

import { useState, useEffect, useCallback } from "react";
import { ITactic } from "../models/Team";
import Image from "next/image";
import TeamMatchPopup from "./TeamMatchPopup";
import { Types } from "mongoose";
import MatchCard from "./MatchCard";
import { Match } from "../types/match";

interface MongoTactic extends ITactic {
  _id: Types.ObjectId;
}

interface Team {
  _id: string;
  teamName: string;
  tactics: MongoTactic[];
}

interface TeamMatchesSectionProps {
  teamName: string;
  teamId: string;
  tactics: ITactic[];
  isTeamCaptain: boolean;
  currentTeam: Team;
}

export default function TeamMatchesSection({
  teamName,
  teamId,
  tactics,
  isTeamCaptain,
  currentTeam,
}: TeamMatchesSectionProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [updating, setUpdating] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMatches = useCallback(async () => {
    try {
      const response = await fetch(`/api/matches?teamId=${teamId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch matches");
      }
      const data = await response.json();
      setMatches(data.matches);
    } catch (error) {
      console.error("Error fetching matches:", error);
      // Show a more informative message about seasons
      setError("No matches available - please wait for the season to start");
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  // Fetch matches on component mount
  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  // Group matches by status (upcoming vs completed)
  const upcomingMatches = matches
    .filter((match) => !match.isCompleted)
    .sort(
      (a, b) =>
        new Date(a.scheduledDate).getTime() -
        new Date(b.scheduledDate).getTime()
    );

  const completedMatches = matches
    .filter((match) => match.isCompleted)
    .sort(
      (a, b) =>
        new Date(b.scheduledDate).getTime() -
        new Date(a.scheduledDate).getTime()
    );

  // Get next match
  const nextMatch = upcomingMatches[0];

  // Get limited matches for calendar view
  const limitedUpcomingMatches = upcomingMatches.slice(0, 5);
  const limitedCompletedMatches = completedMatches.slice(0, 5);

  const handleUpdateTactic = async (match: Match, tactic: ITactic) => {
    if (!isTeamCaptain) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/matches/${match._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeTacticId:
            match.homeTeamId === teamId
              ? tactic._id?.toString()
              : match.homeTactic?._id?.toString(),
          awayTacticId:
            match.awayTeamId === teamId
              ? tactic._id?.toString()
              : match.awayTactic?._id?.toString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update tactic");
      }

      // Update local state
      const updatedMatch = await response.json();
      setSelectedMatch(updatedMatch.match);
      await fetchMatches(); // Refresh matches
    } catch (error) {
      console.error("Error updating tactic:", error);
      setError("Failed to update tactic");
    } finally {
      setUpdating(false);
    }
  };

  const handleMatchClick = (match: Match) => {
    if (match.isCompleted) {
      setSelectedMatch(match);
    }
  };

  if (loading) {
    return (
      <div className="glass-container p-4 rounded-xl shadow-lg mt-4">
        <div className="text-center text-gray-400">Loading matches...</div>
      </div>
    );
  }

  return (
    <div className="glass-container p-4 rounded-xl shadow-lg mt-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-white">Team Matches</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
            title={showCalendar ? "Show next match only" : "Show calendar"}
          >
            <Image
              src={
                showCalendar
                  ? "/icons/ball-icon.png"
                  : "/icons/calendar-icon.png"
              }
              alt={showCalendar ? "Next match" : "Calendar"}
              width={24}
              height={24}
              className="opacity-80"
            />
          </button>
        </div>
      </div>

      {showCalendar ? (
        <>
          {/* Upcoming Matches */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-green-400 mb-2">
              Upcoming Matches
            </h3>
            <div className="space-y-2">
              {limitedUpcomingMatches.length > 0 ? (
                limitedUpcomingMatches.map((match) => (
                  <MatchCard
                    key={match._id}
                    match={match}
                    teamName={teamName}
                    isTeamCaptain={isTeamCaptain}
                    tactics={tactics}
                    onMatchClick={() => handleMatchClick(match)}
                    onUpdateTactic={(tactic) =>
                      handleUpdateTactic(match, tactic)
                    }
                    updating={updating}
                  />
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
              {limitedCompletedMatches.length > 0 ? (
                limitedCompletedMatches.map((match) => (
                  <MatchCard
                    key={match._id}
                    match={match}
                    teamName={teamName}
                    isTeamCaptain={isTeamCaptain}
                    tactics={tactics}
                    onMatchClick={() => handleMatchClick(match)}
                  />
                ))
              ) : (
                <div className="text-gray-400 text-sm text-center">
                  No match history available
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        // Show only next match
        <div>
          <h3 className="text-sm font-medium text-green-400 mb-2">
            Next Match
          </h3>
          <div className="space-y-2">
            {nextMatch ? (
              <MatchCard
                match={nextMatch}
                teamName={teamName}
                isTeamCaptain={isTeamCaptain}
                tactics={tactics}
                onMatchClick={() => handleMatchClick(nextMatch)}
                onUpdateTactic={(tactic) =>
                  handleUpdateTactic(nextMatch, tactic)
                }
                updating={updating}
              />
            ) : (
              <div className="text-gray-400 text-sm text-center">
                No upcoming matches scheduled
              </div>
            )}
          </div>
        </div>
      )}

      {/* Match Details Popup */}
      {selectedMatch && (
        <TeamMatchPopup
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
        />
      )}

      {/* Status Messages */}
      {error && (
        <div className="mt-4 text-red-400 text-center text-sm">{error}</div>
      )}
      {success && (
        <div className="mt-4 text-green-400 text-center text-sm">{success}</div>
      )}
    </div>
  );
}
