"use client";

import { useState, useEffect } from "react";
import { ITactic } from "../models/Team";
import { Types } from "mongoose";

interface MongoTactic extends ITactic {
  _id: Types.ObjectId;
}

interface Team {
  _id: string;
  teamName: string;
  tactics: MongoTactic[];
}

interface MatchSchedulerProps {
  teams: Team[];
  onSchedule: (match: {
    homeTeamId: string;
    awayTeamId: string;
    date: string;
  }) => Promise<void>;
  defaultHomeTeam?: Team | null;
  hideHomeTeamSelect?: boolean;
  className?: string;
}

export default function MatchScheduler({
  teams,
  onSchedule,
  defaultHomeTeam = null,
  hideHomeTeamSelect = false,
  className = "",
}: MatchSchedulerProps) {
  const [selectedHomeTeam, setSelectedHomeTeam] = useState<Team | null>(
    defaultHomeTeam
  );
  const [selectedAwayTeam, setSelectedAwayTeam] = useState<Team | null>(null);
  const [matchDate, setMatchDate] = useState<string>("");
  const [scheduling, setScheduling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasActiveSeason, setHasActiveSeason] = useState<boolean>(false);
  const [isLoadingSeason, setIsLoadingSeason] = useState<boolean>(true);

  // Check for active season on mount
  useEffect(() => {
    const checkActiveSeason = async () => {
      try {
        const response = await fetch("/api/seasons?status=ongoing");
        const data = await response.json();
        setHasActiveSeason(data.seasons?.length > 0);
      } catch (error) {
        console.error("Error checking active season:", error);
        setHasActiveSeason(false);
      } finally {
        setIsLoadingSeason(false);
      }
    };
    checkActiveSeason();
  }, []);

  const handleSchedule = async () => {
    if (!hasActiveSeason) {
      setError("Cannot schedule matches - no active season");
      return;
    }

    if (!selectedHomeTeam || !selectedAwayTeam || !matchDate) {
      setError("Please select both teams and a match date");
      return;
    }

    if (selectedHomeTeam._id === selectedAwayTeam._id) {
      setError("A team cannot play against itself");
      return;
    }

    setScheduling(true);
    setError(null);

    try {
      await onSchedule({
        homeTeamId: selectedHomeTeam._id,
        awayTeamId: selectedAwayTeam._id,
        date: matchDate,
      });

      // Reset form
      if (!hideHomeTeamSelect) {
        setSelectedHomeTeam(null);
      }
      setSelectedAwayTeam(null);
      setMatchDate("");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to schedule match"
      );
    } finally {
      setScheduling(false);
    }
  };

  // Get minimum date-time string for the datetime-local input (current time)
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); // Adjust for timezone
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className={`glass-container p-6 rounded-xl ${className}`}>
      <h2 className="text-xl font-bold mb-6">Schedule Match</h2>

      {isLoadingSeason ? (
        <div className="text-gray-400 text-center">
          Checking season status...
        </div>
      ) : !hasActiveSeason ? (
        <div className="text-yellow-400 text-center">
          No active season. Please wait for the next season to start before
          scheduling matches.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Home Team Selection */}
          {!hideHomeTeamSelect && (
            <div>
              <h3 className="text-sm font-semibold mb-2 text-green-400">
                Home Team
              </h3>
              <select
                className="w-full bg-black/30 text-white rounded px-3 py-2"
                value={selectedHomeTeam?._id || ""}
                onChange={(e) => {
                  const team = teams.find((t) => t._id === e.target.value);
                  setSelectedHomeTeam(team || null);
                }}
              >
                <option value="">Select Home Team</option>
                {teams.map((team) => (
                  <option key={team._id} value={team._id}>
                    {team.teamName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Away Team Selection */}
          <div>
            <h3 className="text-sm font-semibold mb-2 text-blue-400">
              Away Team
            </h3>
            <select
              className="w-full bg-black/30 text-white rounded px-3 py-2"
              value={selectedAwayTeam?._id || ""}
              onChange={(e) => {
                const team = teams.find((t) => t._id === e.target.value);
                setSelectedAwayTeam(team || null);
              }}
            >
              <option value="">Select Away Team</option>
              {teams
                .filter((team) => team._id !== selectedHomeTeam?._id)
                .map((team) => (
                  <option key={team._id} value={team._id}>
                    {team.teamName}
                  </option>
                ))}
            </select>
          </div>

          {/* Match Date Selection */}
          <div>
            <h3 className="text-sm font-semibold mb-2 text-purple-400">
              Match Date
            </h3>
            <input
              type="datetime-local"
              className="w-full bg-black/30 text-white rounded px-3 py-2"
              value={matchDate}
              onChange={(e) => setMatchDate(e.target.value)}
              min={getMinDateTime()}
            />
          </div>

          {/* Schedule Button */}
          <button
            onClick={handleSchedule}
            disabled={
              scheduling || !selectedHomeTeam || !selectedAwayTeam || !matchDate
            }
            className={`w-full gradient-button py-2 px-4 rounded-lg text-sm transition-all duration-300
                ${
                  scheduling ||
                  !selectedHomeTeam ||
                  !selectedAwayTeam ||
                  !matchDate
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:scale-105 active:scale-95"
                }`}
          >
            {scheduling ? "Scheduling..." : "Schedule Match"}
          </button>

          {error && (
            <div className="text-red-400 text-sm text-center">{error}</div>
          )}
        </div>
      )}
    </div>
  );
}
