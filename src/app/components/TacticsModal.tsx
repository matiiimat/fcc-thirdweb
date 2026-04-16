"use client";

import { useState, useEffect } from "react";
import { ITactic } from "../models/Team";
import FormationDisplay from "./FormationDisplay";
import PlayerSelectionModal from "./PlayerSelectionModal";
import TacticNameModal from "./TacticNameModal";

interface Player {
  ethAddress: string;
  playerName: string;
  username?: string;
  stats: {
    strength: number;
    stamina: number;
    passing: number;
    shooting: number;
    defending: number;
    speed: number;
    positioning: number;
    workEthic: number;
  };
}

type Formation = "4-4-2" | "4-3-3" | "3-5-2" | "5-3-2" | "4-2-3-1";
type TacticalStyle =
  | "None"
  | "Tiki-Taka"
  | "Gegenpressing"
  | "Kick & Rush"
  | "Counter Attacking"
  | "Catennacio";
type Position = "GK" | "D" | "M" | "F";

const FORMATIONS: Formation[] = ["4-4-2", "4-3-3", "3-5-2", "5-3-2", "4-2-3-1"];
const TACTICAL_STYLES: TacticalStyle[] = [
  "None",
  "Tiki-Taka",
  "Gegenpressing",
  "Kick & Rush",
  "Counter Attacking",
  "Catennacio",
];

interface TacticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  captainAddress: string;
  teamId: string;
  isBottomSheet?: boolean;
  readOnly?: boolean;
}

export default function TacticsModal({
  isOpen,
  onClose,
  captainAddress,
  teamId,
  isBottomSheet = false,
  readOnly = false,
}: TacticsModalProps) {
  const [loading, setLoading] = useState(true);
  const [teamData, setTeamData] = useState<{
    teamName: string;
    players: string[];
  } | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [tactics, setTactics] = useState<ITactic[]>([]);
  const [selectedFormation, setSelectedFormation] =
    useState<Formation>("4-4-2");
  const [selectedTacticalStyle, setSelectedTacticalStyle] =
    useState<TacticalStyle>("None");
  const [currentTactic, setCurrentTactic] = useState<ITactic>({
    name: "Default Tactic",
    formation: "4-4-2",
    tacticalStyle: "None",
    playerPositions: [],
  });
  const [playerModalOpen, setPlayerModalOpen] = useState(false);
  const [tacticNameModalOpen, setTacticNameModalOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<{
    x: number;
    y: number;
    position: Position;
  } | null>(null);
  const [savingTactic, setSavingTactic] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen || !captainAddress || !teamId) return;

      try {
        setLoading(true);

        // Fetch team data first
        const teamsResponse = await fetch("/api/teams");
        const teams = await teamsResponse.json();

        // Find the team by ID
        const team = teams.find((t: any) => t._id === teamId);

        if (team) {
          setTeamData(team);

          // Fetch players
          const playersPromises = team.players.map(async (address: string) => {
            if (address.toLowerCase().startsWith("0xbot")) {
              // Fetch the specific bot
              const botsResponse = await fetch(
                `/api/bots?address=${encodeURIComponent(address)}`
              );
              if (!botsResponse.ok) {
                throw new Error(`Failed to fetch bot data for ${address}`);
              }
              const botsData = await botsResponse.json();
              const bot = botsData.bots[0];
              return {
                ethAddress: bot.ethAddress,
                playerName: bot.playerName,
                stats: bot.stats,
              };
            } else {
              // Fetch the specific player
              const playerResponse = await fetch(
                `/api/players/address/${encodeURIComponent(address)}`
              );
              if (!playerResponse.ok) {
                throw new Error(`Failed to fetch player data for ${address}`);
              }
              const playerData = await playerResponse.json();
              return {
                ethAddress: playerData.ethAddress,
                playerName: playerData.playerName,
                username: playerData.username,
                stats: playerData.stats,
              };
            }
          });

          const playersData = await Promise.all(playersPromises);
          setPlayers(playersData);

          // Fetch tactics
          if (team.tactics && team.tactics.length > 0) {
            setTactics(team.tactics);
            setCurrentTactic(team.tactics[0]);
            setSelectedFormation(team.tactics[0].formation as Formation);
            setSelectedTacticalStyle(team.tactics[0].tacticalStyle);
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, captainAddress, teamId]);

  const handleFormationChange = (formation: Formation) => {
    setSelectedFormation(formation);
    setCurrentTactic({
      ...currentTactic,
      formation,
      playerPositions: [], // Reset player positions when formation changes
    });
  };

  const handleTacticalStyleChange = (style: TacticalStyle) => {
    setSelectedTacticalStyle(style);
    setCurrentTactic({
      ...currentTactic,
      tacticalStyle: style,
    });
  };

  const handlePositionClick = (x: number, y: number, position: Position) => {
    setSelectedPosition({ x, y, position });
    setPlayerModalOpen(true);
  };

  const handlePlayerSelect = (player: Player | null) => {
    if (!selectedPosition) return;

    let updatedPositions = [...currentTactic.playerPositions];

    // Remove any existing assignment for this position
    updatedPositions = updatedPositions.filter(
      (p) => !(p.x === selectedPosition.x && p.y === selectedPosition.y)
    );

    // Remove any existing assignment for this player
    updatedPositions = updatedPositions.filter(
      (p) => player && p.ethAddress !== player.ethAddress
    );

    // Add the new assignment if a player was selected
    if (player) {
      updatedPositions.push({
        ethAddress: player.ethAddress,
        x: selectedPosition.x,
        y: selectedPosition.y,
        position: selectedPosition.position,
      });
    }

    setCurrentTactic({
      ...currentTactic,
      playerPositions: updatedPositions,
    });

    setPlayerModalOpen(false);
  };

  const handleDeleteTactic = async () => {
    if (!teamData || !captainAddress || !currentTactic.name) return;

    setSavingTactic(true);
    try {
      const response = await fetch(
        `/api/teams/tactics?teamName=${teamData.teamName}&tacticName=${currentTactic.name}&captainAddress=${captainAddress}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete tactic");
      }

      const updatedTactics = await response.json();
      setTactics(updatedTactics);

      // Reset to default if we have no tactics left, otherwise load the first available tactic
      if (updatedTactics.length === 0) {
        setCurrentTactic({
          name: "Default Tactic",
          formation: "4-4-2",
          tacticalStyle: "None",
          playerPositions: [],
        });
        setSelectedFormation("4-4-2");
      } else {
        setCurrentTactic(updatedTactics[0]);
        setSelectedFormation(updatedTactics[0].formation as Formation);
      }

      setSuccess("Tactic deleted successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error deleting tactic:", error);
      setError("Failed to delete tactic");
      setTimeout(() => setError(""), 3000);
    }
    setSavingTactic(false);
  };

  const handleSaveTactic = () => {
    setTacticNameModalOpen(true);
  };

  const handleSaveTacticWithName = async (name: string) => {
    if (!teamData || !captainAddress) return;

    setSavingTactic(true);
    try {
      const tacticToSave = {
        ...currentTactic,
        name,
      };

      const response = await fetch("/api/teams/tactics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamName: teamData.teamName,
          captainAddress: captainAddress,
          tactic: tacticToSave,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save tactic");
      }

      const updatedTactics = await response.json();
      setTactics(updatedTactics);
      setTacticNameModalOpen(false);

      setSuccess("Tactic saved successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      console.error("Error saving tactic:", error);
      setError("Failed to save tactic");
      setTimeout(() => setError(""), 3000);
    }
    setSavingTactic(false);
  };

  const handleLoadTactic = (tactic: ITactic) => {
    setCurrentTactic(tactic);
    setSelectedFormation(tactic.formation as Formation);
    setSelectedTacticalStyle(tactic.tacticalStyle);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-end justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`
          bg-gradient-to-b from-[#1a1d21] to-[#0d0f12] 
          rounded-t-xl w-full max-w-4xl h-[75vh] flex flex-col
          transform transition-all duration-300 ease-out
          ${isBottomSheet ? "animate-slide-up" : "animate-fade-in"}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Team Tactics</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Status Messages */}
          {(error || success) && (
            <div
              className={`mb-4 p-3 rounded-lg text-center ${
                error
                  ? "bg-red-500/20 text-red-300"
                  : "bg-green-500/20 text-green-300"
              }`}
            >
              {error || success}
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              {/* Tactics Skeleton */}
              <div className="w-full h-12 bg-gray-700/30 rounded animate-pulse mb-4"></div>

              <div className="grid grid-cols-3 gap-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="h-16 bg-gray-700/30 rounded animate-pulse"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  ></div>
                ))}
              </div>

              <div className="w-full h-12 bg-gray-700/30 rounded animate-pulse mt-6 mb-2"></div>

              <div className="grid grid-cols-3 gap-2">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-12 bg-gray-700/30 rounded animate-pulse"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  ></div>
                ))}
              </div>

              <div className="w-full h-12 bg-gray-700/30 rounded animate-pulse mt-6 mb-2"></div>

              <div className="grid grid-cols-3 gap-2">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-12 bg-gray-700/30 rounded animate-pulse"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  ></div>
                ))}
              </div>

              <div className="w-full aspect-[2/3] bg-gray-700/30 rounded animate-pulse mt-6"></div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <div></div>
                <div className="flex gap-2">
                  {!readOnly ? (
                    <>
                      <button
                        onClick={handleSaveTactic}
                        disabled={savingTactic || tactics.length >= 3}
                        className={`
                          px-4 py-2 rounded-lg transition-all duration-200
                          ${
                            savingTactic
                              ? "bg-gray-600"
                              : "bg-green-600 hover:bg-green-700"
                          }
                          ${
                            tactics.length >= 3
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }
                        `}
                      >
                        {savingTactic ? "Saving..." : "Save Tactic"}
                      </button>
                      {currentTactic.name !== "Default Tactic" && (
                        <button
                          onClick={handleDeleteTactic}
                          disabled={savingTactic}
                          className={`
                            px-4 py-2 rounded-lg transition-all duration-200
                            ${
                              savingTactic
                                ? "bg-gray-600"
                                : "bg-red-600 hover:bg-red-700"
                            }
                          `}
                        >
                          Delete Tactic
                        </button>
                      )}
                    </>
                  ) : (
                    // Add invisible placeholder buttons to maintain consistent layout in readOnly mode
                    <div className="invisible flex gap-2">
                      <div className="px-4 py-2 rounded-lg">Save Tactic</div>
                      {currentTactic.name !== "Default Tactic" && (
                        <div className="px-4 py-2 rounded-lg">
                          Delete Tactic
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Saved Tactics */}
              {tactics.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm sm:text-base font-medium text-white mb-2">
                    Saved Tactics
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {tactics.map((tactic) => (
                      <button
                        key={tactic.name}
                        onClick={() => handleLoadTactic(tactic)}
                        className={`
                          p-3 rounded-lg transition-all duration-300
                          ${
                            currentTactic.name === tactic.name
                              ? "bg-green-600 text-white"
                              : "glass-container hover:bg-gray-800"
                          }
                        `}
                      >
                        <div className="font-bold">{tactic.name}</div>
                        <div className="text-sm opacity-75">
                          {tactic.formation} • {tactic.tacticalStyle}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tactical Style Selector */}
              <div className="mb-6">
                <h3 className="text-sm sm:text-base font-medium text-white mb-2">
                  Tactic
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TACTICAL_STYLES.map((style) => (
                    <button
                      key={style}
                      onClick={() => handleTacticalStyleChange(style)}
                      className={`
                        p-3 rounded-lg transition-all duration-300
                        ${
                          selectedTacticalStyle === style
                            ? "bg-green-600 text-white"
                            : "glass-container hover:bg-gray-800"
                        }
                      `}
                    >
                      <span className="text-sm font-bold">{style}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Formation Selector */}
              <div className="mb-6">
                <h3 className="text-sm sm:text-base font-medium text-white mb-2">
                  Formation
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {FORMATIONS.map((formation) => (
                    <button
                      key={formation}
                      onClick={() => handleFormationChange(formation)}
                      className={`
                        p-3 rounded-lg transition-all duration-300
                        ${
                          selectedFormation === formation
                            ? "bg-green-600 text-white"
                            : "glass-container hover:bg-gray-800"
                        }
                      `}
                    >
                      <span className="text-lg font-bold">{formation}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Formation Display */}
              <div className="relative w-full aspect-[2/3] bg-green-900/20 rounded-xl overflow-hidden">
                <FormationDisplay
                  formation={selectedFormation}
                  playerPositions={currentTactic.playerPositions}
                  onPositionClick={handlePositionClick}
                  availablePlayers={players}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Player Selection Modal */}
      <PlayerSelectionModal
        isOpen={playerModalOpen}
        onClose={() => setPlayerModalOpen(false)}
        players={players}
        onSelect={handlePlayerSelect}
        selectedPlayer={
          selectedPosition
            ? players.find((p) =>
                currentTactic.playerPositions.some(
                  (pos) =>
                    pos.ethAddress === p.ethAddress &&
                    pos.x === selectedPosition.x &&
                    pos.y === selectedPosition.y
                )
              )
            : undefined
        }
        position={selectedPosition?.position || "D"}
        assignedPlayers={currentTactic.playerPositions.map((p) => p.ethAddress)}
      />

      {/* Tactic Name Modal */}
      <TacticNameModal
        isOpen={tacticNameModalOpen}
        onClose={() => setTacticNameModalOpen(false)}
        onSave={handleSaveTacticWithName}
        existingNames={tactics.map((t) => t.name)}
      />
    </div>
  );
}
