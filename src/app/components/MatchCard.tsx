"use client";

import { useState } from "react";
import { ITactic } from "../models/Team";
import { formatMatchDate, getTeamTactic } from "../lib/matchUtils";

interface MatchCardProps {
  match: {
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
  };
  teamName: string;
  isTeamCaptain: boolean;
  tactics: ITactic[];
  onMatchClick: () => void;
  onUpdateTactic?: (tactic: ITactic) => void;
  updating?: boolean;
}

const MatchCard: React.FC<MatchCardProps> = ({
  match,
  teamName,
  isTeamCaptain,
  tactics,
  onMatchClick,
  onUpdateTactic,
  updating = false,
}) => {
  const [selectedTactic, setSelectedTactic] = useState<ITactic | null>(null);

  return (
    <div
      className={`glass-container bg-black/20 p-3 rounded-lg ${
        match.isCompleted ? "cursor-pointer hover:bg-black/30" : ""
      }`}
      onClick={onMatchClick}
    >
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

      {!match.isCompleted && isTeamCaptain && onUpdateTactic && (
        <div className="mt-2">
          <div className="text-xs text-gray-400 mb-1">
            Current Tactic: {getTeamTactic(match, teamName)?.name || "None"}
          </div>
          <div className="flex gap-2">
            <select
              className="flex-1 bg-black/30 text-white text-sm rounded px-2 py-1"
              value={selectedTactic?.name || ""}
              onChange={(e) => {
                const tactic = tactics.find((t) => t.name === e.target.value);
                setSelectedTactic(tactic || null);
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <option value="">Select Tactic</option>
              {tactics.map((tactic) => (
                <option key={tactic.name} value={tactic.name}>
                  {tactic.name} ({tactic.formation} • {tactic.tacticalStyle})
                </option>
              ))}
            </select>
            <button
              onClick={(e) => {
                e.stopPropagation();
                selectedTactic && onUpdateTactic(selectedTactic);
              }}
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
          Tactic Used: {getTeamTactic(match, teamName)?.name || "None"}
        </div>
      )}
    </div>
  );
};

export default MatchCard;
