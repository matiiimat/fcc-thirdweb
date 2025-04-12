"use client";

import { useState } from "react";
import { ITactic } from "../models/Team";
import { formatMatchDate } from "../lib/matchUtils";
import OpponentLastMatchInfo from "./OpponentLastMatchInfo";

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

interface MatchCardProps {
  match: Match;
  teamName: string;
  isTeamCaptain: boolean;
  tactics: ITactic[];
  onMatchClick: () => void;
  onUpdateTactic?: (tactic: ITactic) => void;
  updating?: boolean;
}

const getTeamTactic = (match: Match, teamName: string): ITactic | undefined => {
  return match.homeTeamName === teamName ? match.homeTactic : match.awayTactic;
};

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
  const [showOpponentInfo, setShowOpponentInfo] = useState(false);

  return (
    <div className="space-y-2">
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
                match.homeTeamName === teamName ? "text-green-400" : "text-white"
              }
            >
              {match.homeTeamName}
            </span>
            <span className="text-gray-400 mx-2">
              {match.result
                ? `${match.result.homeScore} - ${match.result.awayScore}`
                : "vs"}
            </span>
            <span
              className={
                match.awayTeamName === teamName ? "text-green-400" : "text-white"
              }
            >
              {match.awayTeamName}
            </span>
          </div>
          <div className="text-xs text-gray-400 text-center mb-2">
            {formatMatchDate(match.scheduledDate)}
            {match.seasonId && match.matchday && (
              <span className="ml-2">• Matchday {match.matchday}</span>
            )}
          </div>
        </div>
      </div>

      {/* Show opponent info button for upcoming matches */}
      {!match.isCompleted && (
        <button
          onClick={() => setShowOpponentInfo(!showOpponentInfo)}
          className="text-sm text-gray-400 hover:text-gray-300"
        >
          {showOpponentInfo ? "Hide" : "Show"} Opponent's Last Match
        </button>
      )}

      {/* Opponent's last match info */}
      {!match.isCompleted && showOpponentInfo && (
        <OpponentLastMatchInfo
          opponentTeamId={
            match.homeTeamName === teamName
              ? match.awayTeamId
              : match.homeTeamId
          }
          opponentTeamName={
            match.homeTeamName === teamName
              ? match.awayTeamName
              : match.homeTeamName
          }
        />
      )}

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
