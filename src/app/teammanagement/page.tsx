"use client";

import { useEffect, useState } from "react";
import { useActiveWallet } from "thirdweb/react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FormationDisplay from "../components/FormationDisplay";
import PlayerSelectionModal from "../components/PlayerSelectionModal";
import { Position } from "../models/Player";
import { ITactic, IPlayerPosition } from "../models/Team";
import TacticNameModal from "../components/TacticNameModal";

type Formation = "5-4-1" | "5-3-2" | "4-4-2" | "4-3-3" | "4-5-1" | "3-4-3";
type TacticalStyle =
  | "None"
  | "Tiki-Taka"
  | "Gegenpressing"
  | "Kick & Rush"
  | "Counter Attacking"
  | "Catennacio";

const FORMATIONS: Formation[] = [
  "5-4-1",
  "5-3-2",
  "4-4-2",
  "4-3-3",
  "4-5-1",
  "3-4-3",
];

const TACTICAL_STYLES: TacticalStyle[] = [
  "None",
  "Tiki-Taka",
  "Gegenpressing",
  "Kick & Rush",
  "Counter Attacking",
  "Catennacio",
];

interface Player {
  ethAddress: string;
  playerName: string;
  isBot?: boolean;
  stats?: {
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

export default function TeamManagementPage() {
  const activeWallet = useActiveWallet();
  const wallet = activeWallet?.getAccount();
  const router = useRouter();
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
    const init = async () => {
      if (wallet) {
        try {
          // Fetch team data
          const teamsResponse = await fetch("/api/teams");
          const teams = await teamsResponse.json();
          const team = teams.find(
            (t: any) =>
              t.captainAddress.toLowerCase() === wallet.address.toLowerCase()
          );

          if (team) {
            setTeamData(team);

            // Fetch players
            const playersPromises = team.players.map(
              async (address: string) => {
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
                    isBot: true,
                  };
                } else {
                  // Regular player
                  const response = await fetch(
                    `/api/players/address/${address}`
                  );
                  if (!response.ok) {
                    throw new Error(
                      `Failed to fetch player data for ${address}`
                    );
                  }
                  const data = await response.json();
                  return {
                    ethAddress: data.ethAddress,
                    playerName: data.playerName,
                    stats: data.stats,
                    isBot: false,
                  };
                }
              }
            );
            const playerData = await Promise.all(playersPromises);
            setPlayers(playerData);

            // Fetch tactics
            const tacticsResponse = await fetch(
              `/api/teams/tactics?teamName=${team.teamName}`
            );
            const tacticsData = await tacticsResponse.json();
            setTactics(tacticsData);

            if (tacticsData.length > 0) {
              setCurrentTactic(tacticsData[0]);
              setSelectedFormation(tacticsData[0].formation as Formation);
            }
          }
        } catch (error) {
          console.error("Error initializing:", error);
        }
        setLoading(false);
      } else {
        setLoading(false);
        router.push("/");
      }
    };

    init();
  }, [wallet, router]);

  const handleFormationChange = (formation: Formation) => {
    setSelectedFormation(formation);
    setCurrentTactic((prev) => ({
      ...prev,
      formation,
      playerPositions: [], // Reset positions when formation changes
    }));
  };

  const handleTacticalStyleChange = (style: TacticalStyle) => {
    setSelectedTacticalStyle(style);
    setCurrentTactic((prev) => ({
      ...prev,
      tacticalStyle: style,
    }));
  };

  const handlePositionClick = (x: number, y: number, position: Position) => {
    setSelectedPosition({ x, y, position });
    setPlayerModalOpen(true);
  };

  const handlePlayerSelect = (player: Player) => {
    if (!selectedPosition) return;

    // Check if we're clicking on a player that's already in this position
    const existingPlayer = currentTactic.playerPositions.find(
      (p) => p.x === selectedPosition.x && p.y === selectedPosition.y
    );

    if (existingPlayer?.ethAddress === player.ethAddress) {
      // Unassign the player if clicking on them again
      setCurrentTactic((prev) => ({
        ...prev,
        playerPositions: prev.playerPositions.filter(
          (p) => p.x !== selectedPosition.x || p.y !== selectedPosition.y
        ),
      }));
    } else {
      // Assign the player to the position, removing them from any other position first
      setCurrentTactic((prev) => ({
        ...prev,
        playerPositions: [
          ...prev.playerPositions.filter(
            (p) =>
              p.ethAddress !== player.ethAddress && // Remove player from other positions
              (p.x !== selectedPosition.x || p.y !== selectedPosition.y) // Remove any player from target position
          ),
          {
            ethAddress: player.ethAddress,
            position: selectedPosition.position,
            x: selectedPosition.x,
            y: selectedPosition.y,
          },
        ],
      }));
    }
    setPlayerModalOpen(false);
  };

  const handleDeleteTactic = async () => {
    if (!teamData || !wallet || !currentTactic.name) return;

    setSavingTactic(true);
    try {
      const response = await fetch(
        `/api/teams/tactics?teamName=${teamData.teamName}&tacticName=${currentTactic.name}&captainAddress=${wallet.address}`,
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
    } catch (error) {
      console.error("Error deleting tactic:", error);
    }
    setSavingTactic(false);
  };

  const handleSaveTactic = () => {
    setTacticNameModalOpen(true);
  };

  const handleSaveTacticWithName = async (name: string) => {
    if (!teamData || !wallet) return;

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
          captainAddress: wallet.address,
          tactic: tacticToSave,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save tactic");
      }

      const updatedTactics = await response.json();
      setTactics(updatedTactics);
      setTacticNameModalOpen(false);
    } catch (error) {
      console.error("Error saving tactic:", error);
    }
    setSavingTactic(false);
  };

  const handleLoadTactic = (tactic: ITactic) => {
    setCurrentTactic(tactic);
    setSelectedFormation(tactic.formation as Formation);
    setSelectedTacticalStyle(tactic.tacticalStyle);
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
        <Header pageName="Tactics" xp={0} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-2 text-green-400 text-sm">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!wallet || !teamData) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
      <Header pageName="Tactics" xp={0} />
      <main className="flex-1 container max-w-4xl mx-auto px-3 sm:px-6 py-2 sm:py-4 pb-32">
        <div className="glass-container p-4 sm:p-6 rounded-xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Team Tactics
            </h2>
            <div className="flex gap-2">
              <div className="flex gap-2">
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
                      tactics.length >= 3 ? "opacity-50 cursor-not-allowed" : ""
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
              </div>
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
        </div>

        {/* Back Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => router.push("/team")}
            className="px-6 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
          >
            Back to Team
          </button>
        </div>
      </main>
      <Footer />

      {/* Status Messages */}
      {(error || success) && (
        <div
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg ${
            error
              ? "bg-red-500/20 text-red-300"
              : "bg-green-500/20 text-green-300"
          }`}
        >
          {error || success}
        </div>
      )}

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
