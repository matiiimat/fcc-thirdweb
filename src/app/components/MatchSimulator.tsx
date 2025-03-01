import { useState } from "react";
import { Types } from "mongoose";
import { ITactic } from "../models/Team";
import { Match } from "../types/match";
import TeamMatchPopup from "./TeamMatchPopup";

interface MongoTactic extends ITactic {
  _id: Types.ObjectId;
}

interface Team {
  _id: string;
  teamName: string;
  tactics: MongoTactic[];
  players: string[];
}

interface MatchSimulatorProps {
  teams: Team[];
  onError: (error: string | null) => void;
}

export default function MatchSimulator({
  teams,
  onError,
}: MatchSimulatorProps) {
  const [simulating, setSimulating] = useState(false);
  const [selectedHomeTeam, setSelectedHomeTeam] = useState<Team | null>(null);
  const [selectedAwayTeam, setSelectedAwayTeam] = useState<Team | null>(null);
  const [selectedHomeTactic, setSelectedHomeTactic] =
    useState<MongoTactic | null>(null);
  const [selectedAwayTactic, setSelectedAwayTactic] =
    useState<MongoTactic | null>(null);
  const [matchResult, setMatchResult] = useState<Match | null>(null);

  const handleSimulateMatch = async () => {
    if (
      !selectedHomeTeam ||
      !selectedAwayTeam ||
      !selectedHomeTactic ||
      !selectedAwayTactic
    ) {
      onError("Please select both teams and their tactics");
      return;
    }

    if (
      !selectedHomeTeam.players?.length ||
      !selectedAwayTeam.players?.length
    ) {
      onError("Both teams must have players");
      return;
    }

    if (
      !selectedHomeTactic.playerPositions?.length ||
      !selectedAwayTactic.playerPositions?.length
    ) {
      onError("Both teams must have player positions set in their tactics");
      return;
    }

    setSimulating(true);
    onError(null);

    try {
      const response = await fetch("/api/teams/match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          homeTeamId: selectedHomeTeam._id,
          awayTeamId: selectedAwayTeam._id,
          homeTacticId: selectedHomeTactic._id.toString(),
          awayTacticId: selectedAwayTactic._id.toString(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to simulate match");
      }

      const result = await response.json();
      const match = result.match;
      // Add required properties to match the Match interface
      match._id = match.id;
      match.homeTeamId = selectedHomeTeam._id;
      match.awayTeamId = selectedAwayTeam._id;
      match.homeTeamName = selectedHomeTeam.teamName;
      match.awayTeamName = selectedAwayTeam.teamName;
      match.scheduledDate = new Date().toISOString();
      setMatchResult(match);
    } catch (error) {
      onError(
        error instanceof Error ? error.message : "Failed to simulate match"
      );
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="glass-container p-6 rounded-xl">
      <h2 className="text-xl font-bold mb-6">Match Simulator</h2>

      <div className="grid grid-cols-2 gap-6">
        {/* Home Team Selection */}
        <div>
          <h3 className="text-sm font-semibold mb-2 text-green-400">
            Home Team
          </h3>
          <div>
            <select
              className="w-full bg-black/30 text-white rounded px-3 py-2 mb-2"
              value={selectedHomeTeam?._id || ""}
              onChange={(e) => {
                const team = teams.find((t) => t._id === e.target.value);
                setSelectedHomeTeam(team || null);
                setSelectedHomeTactic(null);
              }}
            >
              <option value="">Select Home Team</option>
              {teams.map((team) => (
                <option key={team._id} value={team._id}>
                  {team.teamName}
                </option>
              ))}
            </select>
            {selectedHomeTeam && !selectedHomeTeam.tactics?.length && (
              <p className="text-red-400 text-sm mb-2">
                This team has no tactics set up
              </p>
            )}
            {selectedHomeTeam && !selectedHomeTeam.players?.length && (
              <p className="text-red-400 text-sm mb-2">
                This team has no players
              </p>
            )}
          </div>

          {selectedHomeTeam && selectedHomeTeam.tactics?.length > 0 && (
            <select
              className="w-full bg-black/30 text-white rounded px-3 py-2"
              value={selectedHomeTactic?._id.toString() || ""}
              onChange={(e) => {
                const tactic = selectedHomeTeam.tactics.find(
                  (t) => t._id.toString() === e.target.value
                );
                setSelectedHomeTactic(tactic || null);
              }}
            >
              <option value="">Select Tactic</option>
              {selectedHomeTeam?.tactics?.map((tactic) => (
                <option
                  key={tactic._id.toString()}
                  value={tactic._id.toString()}
                >
                  {tactic.name} ({tactic.formation} • {tactic.tacticalStyle})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Away Team Selection */}
        <div>
          <h3 className="text-sm font-semibold mb-2 text-blue-400">
            Away Team
          </h3>
          <div>
            <select
              className="w-full bg-black/30 text-white rounded px-3 py-2 mb-2"
              value={selectedAwayTeam?._id || ""}
              onChange={(e) => {
                const team = teams.find((t) => t._id === e.target.value);
                setSelectedAwayTeam(team || null);
                setSelectedAwayTactic(null);
              }}
            >
              <option value="">Select Away Team</option>
              {teams.map((team) => (
                <option key={team._id} value={team._id}>
                  {team.teamName}
                </option>
              ))}
            </select>
            {selectedAwayTeam && !selectedAwayTeam.tactics?.length && (
              <p className="text-red-400 text-sm mb-2">
                This team has no tactics set up
              </p>
            )}
            {selectedAwayTeam && !selectedAwayTeam.players?.length && (
              <p className="text-red-400 text-sm mb-2">
                This team has no players
              </p>
            )}
          </div>

          {selectedAwayTeam && selectedAwayTeam.tactics?.length > 0 && (
            <select
              className="w-full bg-black/30 text-white rounded px-3 py-2"
              value={selectedAwayTactic?._id.toString() || ""}
              onChange={(e) => {
                const tactic = selectedAwayTeam.tactics.find(
                  (t) => t._id.toString() === e.target.value
                );
                setSelectedAwayTactic(tactic || null);
              }}
            >
              <option value="">Select Tactic</option>
              {selectedAwayTeam?.tactics?.map((tactic) => (
                <option
                  key={tactic._id.toString()}
                  value={tactic._id.toString()}
                >
                  {tactic.name} ({tactic.formation} • {tactic.tacticalStyle})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Simulate Button */}
      <div className="mt-8 text-center">
        <button
          onClick={handleSimulateMatch}
          disabled={
            simulating ||
            !selectedHomeTeam ||
            !selectedAwayTeam ||
            !selectedHomeTactic ||
            !selectedAwayTactic ||
            !selectedHomeTeam?.tactics?.length ||
            !selectedAwayTeam?.tactics?.length ||
            !selectedHomeTeam?.players?.length ||
            !selectedAwayTeam?.players?.length
          }
          className={`gradient-button py-3 px-8 rounded-lg text-lg transition-all duration-300
            ${
              simulating ||
              !selectedHomeTeam ||
              !selectedAwayTeam ||
              !selectedHomeTactic ||
              !selectedAwayTactic ||
              !selectedHomeTeam?.tactics?.length ||
              !selectedAwayTeam?.tactics?.length ||
              !selectedHomeTeam?.players?.length ||
              !selectedAwayTeam?.players?.length
                ? "opacity-50 cursor-not-allowed"
                : "hover:scale-105 active:scale-95"
            }`}
        >
          {simulating ? "Simulating..." : "Simulate Match"}
        </button>
      </div>

      {/* Match Result Popup */}
      {matchResult && (
        <TeamMatchPopup
          match={matchResult}
          onClose={() => setMatchResult(null)}
        />
      )}
    </div>
  );
}
