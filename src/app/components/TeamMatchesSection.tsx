"use client";

import { useState } from "react";
import { ITactic } from "../models/Team";
import Image from "next/image";

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  isCompleted: boolean;
  homeTactic?: ITactic;
  awayTactic?: ITactic;
  result?: {
    homeScore: number;
    awayScore: number;
  };
}

interface TeamMatchesSectionProps {
  teamName: string;
  matches: Match[];
  tactics: ITactic[];
  isTeamCaptain: boolean;
}

export default function TeamMatchesSection({
  teamName,
  matches,
  tactics,
  isTeamCaptain,
}: TeamMatchesSectionProps) {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [selectedTactic, setSelectedTactic] = useState<ITactic | null>(null);
  const [updating, setUpdating] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  // Group matches by status (upcoming vs completed)
  const upcomingMatches = matches
    .filter((match) => !match.isCompleted)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const completedMatches = matches
    .filter((match) => match.isCompleted)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Get next match
  const nextMatch = upcomingMatches[0];

  // Get limited matches for calendar view
  const limitedUpcomingMatches = upcomingMatches.slice(0, 5);
  const limitedCompletedMatches = completedMatches.slice(0, 5);

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

  const handleUpdateTactic = async (match: Match, tactic: ITactic) => {
    if (!isTeamCaptain) return;

    setUpdating(true);
    try {
      const response = await fetch("/api/teams/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: match.id,
          teamName,
          tactic,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update tactic");
      }

      // Update local state
      const updatedMatch = await response.json();
      setSelectedMatch(updatedMatch);
      setSelectedTactic(null);
    } catch (error) {
      console.error("Error updating tactic:", error);
    } finally {
      setUpdating(false);
    }
  };

  const getTeamTactic = (match: Match) => {
    return match.homeTeam === teamName ? match.homeTactic : match.awayTactic;
  };

  const renderMatch = (match: Match) => (
    <div key={match.id} className="glass-container bg-black/20 p-3 rounded-lg">
      <div className="flex flex-col">
        <div className="flex justify-center items-center mb-1">
          <span
            className={
              match.homeTeam === teamName ? "text-green-400" : "text-white"
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
              match.awayTeam === teamName ? "text-green-400" : "text-white"
            }
          >
            {match.awayTeam}
          </span>
        </div>
        <div className="text-xs text-gray-400 text-center mb-2">
          {formatMatchDate(match.date)}
        </div>
      </div>

      {!match.isCompleted && isTeamCaptain && (
        <div className="mt-2">
          <div className="text-xs text-gray-400 mb-1">
            Current Tactic: {getTeamTactic(match)?.name || "None"}
          </div>
          <div className="flex gap-2">
            <select
              className="flex-1 bg-black/30 text-white text-sm rounded px-2 py-1"
              value={selectedTactic?.name || ""}
              onChange={(e) => {
                const tactic = tactics.find((t) => t.name === e.target.value);
                setSelectedTactic(tactic || null);
              }}
            >
              <option value="">Select Tactic</option>
              {tactics.map((tactic) => (
                <option key={tactic.name} value={tactic.name}>
                  {tactic.name} ({tactic.formation} • {tactic.tacticalStyle})
                </option>
              ))}
            </select>
            <button
              onClick={() =>
                selectedTactic && handleUpdateTactic(match, selectedTactic)
              }
              disabled={!selectedTactic || updating}
              className={`px-3 py-1 rounded text-sm transition-all duration-200
                ${
                  updating
                    ? "bg-gray-600"
                    : selectedTactic
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-gray-600 opacity-50 cursor-not-allowed"
                }`}
            >
              {updating ? "Updating..." : "Set"}
            </button>
          </div>
        </div>
      )}

      {match.isCompleted && (
        <div className="mt-1 text-xs text-gray-400 text-center">
          Tactic Used: {getTeamTactic(match)?.name || "None"}
        </div>
      )}
    </div>
  );

  return (
    <div className="glass-container p-4 rounded-xl shadow-lg mt-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-white">Team Matches</h2>
        <button
          onClick={() => setShowCalendar(!showCalendar)}
          className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors flex items-center gap-2"
          title={showCalendar ? "Show next match only" : "Show calendar"}
        >
          <Image
            src={
              showCalendar ? "/icons/ball-icon.png" : "/icons/calendar-icon.png"
            }
            alt={showCalendar ? "Next match" : "Calendar"}
            width={24}
            height={24}
            className="opacity-80"
          />
        </button>
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
                limitedUpcomingMatches.map((match) => renderMatch(match))
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
                limitedCompletedMatches.map((match) => renderMatch(match))
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
              renderMatch(nextMatch)
            ) : (
              <div className="text-gray-400 text-sm text-center">
                No upcoming matches scheduled
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
