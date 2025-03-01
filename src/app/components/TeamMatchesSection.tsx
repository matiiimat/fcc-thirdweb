"use client";

import { useState, useEffect } from "react";
import { ITactic } from "../models/Team";
import Image from "next/image";
import TeamMatchPopup from "./TeamMatchPopup";
import MatchScheduler from "./MatchScheduler";
import { Types } from "mongoose";
import MatchCard from "./MatchCard";

interface MatchStats {
  possession: number;
  shots: number;
  shotsOnTarget: number;
  corners: number;
  fouls: number;
}

interface PlayerRating {
  ethAddress: string;
  rating: number;
  goals: number;
  assists: number;
  saves?: number;
}

interface MatchEvent {
  type: string;
  minute: number;
  description: string;
  playerAddress?: string;
  teamName: string;
}

interface Match {
  _id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  scheduledDate: string;
  seasonId?: string;
  matchday?: number;
  isCompleted: boolean;
  homeTactic?: ITactic;
  awayTactic?: ITactic;
  result?: {
    homeScore: number;
    awayScore: number;
  };
  homeStats?: MatchStats;
  awayStats?: MatchStats;
  homePlayerRatings?: PlayerRating[];
  awayPlayerRatings?: PlayerRating[];
  events?: MatchEvent[];
}

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
  const [showScheduler, setShowScheduler] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch matches on component mount
  useEffect(() => {
    fetchMatches();
  }, [teamId]);

  const fetchMatches = async () => {
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
  };

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

  const handleScheduleMatch = async (matchData: {
    homeTeamId: string;
    awayTeamId: string;
    date: string;
  }) => {
    setError(null);
    setSuccess(null);

    try {
      // First check if there's an active season
      const seasonsResponse = await fetch("/api/seasons?status=ongoing");
      if (!seasonsResponse.ok) {
        throw new Error("Failed to check active season");
      }

      const seasonsData = await seasonsResponse.json();
      if (!seasonsData.seasons?.length) {
        throw new Error(
          "No active season found. Please wait for the next season to start."
        );
      }

      // Schedule the match
      const scheduleResponse = await fetch("/api/seasons/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(matchData),
      });

      if (!scheduleResponse.ok) {
        const data = await scheduleResponse.json();
        throw new Error(data.error || "Failed to schedule match");
      }

      const scheduleResult = await scheduleResponse.json();
      setSuccess("Match scheduled successfully for the current season!");
      setShowScheduler(false);
      await fetchMatches(); // Refresh matches
    } catch (error) {
      console.error("Error scheduling match:", error);
      setError(
        error instanceof Error ? error.message : "Failed to schedule match"
      );
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
          {isTeamCaptain && (
            <button
              onClick={() => setShowScheduler(!showScheduler)}
              className="p-2 rounded-lg bg-green-700 hover:bg-green-600 transition-colors"
              title="Schedule a match"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </button>
          )}
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

      {/* Match Scheduler */}
      {showScheduler && (
        <div className="mb-6">
          <MatchScheduler
            teams={[currentTeam]}
            onSchedule={handleScheduleMatch}
            defaultHomeTeam={currentTeam}
            hideHomeTeamSelect={true}
          />
        </div>
      )}

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
