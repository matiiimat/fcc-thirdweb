"use client";

import { useState, useEffect, useCallback } from "react";
import { ITactic } from "../models/Team";
import Image from "next/image";
import TeamMatchPopup from "./TeamMatchPopup";
import { Types } from "mongoose";
import MatchCard from "./MatchCard";
import { Match } from "../types/match";
import OpponentLastMatchInfo from "./OpponentLastMatchInfo";

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
  onLastMatchClick: () => void;
}

export default function TeamMatchesSection({
  teamName,
  teamId,
  tactics,
  isTeamCaptain,
  currentTeam,
  onLastMatchClick,
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
      </div>

      {/* Next Match Section */}
      <div className="mb-6">
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

      {/* Past/Upcoming Matches Section */}
      <div>
        <h3 className="text-sm font-medium text-blue-400 mb-2">
          Past & Upcoming Matches
        </h3>
        <div className="space-y-2">
          {matches.length > 0 ? (
            <>
              {/* Upcoming Matches */}
              {upcomingMatches.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-medium text-green-400 mb-2">
                    Upcoming
                  </h4>
                  {upcomingMatches.map((match) => (
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
                  ))}
                </div>
              )}

              {/* Past Matches (limited to last 5) */}
              {completedMatches.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-400 mb-2">
                    Past Matches
                  </h4>
                  {completedMatches
                    .slice(0, 5)
                    .map((match) => (
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
                    ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-gray-400 text-sm text-center">
              No matches available
            </div>
          )}
        </div>
      </div>

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
