"use client";

import { useEffect, useState } from "react";
import { IPlayerStats } from "../models/Player";
import HireBotModal from "./HireBotModal";
import HirePlayerModal from "./HirePlayerModal";

interface Player {
  _id: string;
  playerId: string;
  playerName: string;
  username?: string;
  ethAddress: string;
  stats: IPlayerStats;
  team: string;
}

interface Bot extends Omit<Player, "_id"> {
  isBot: true;
}

interface ScoutingModalProps {
  isOpen: boolean;
  onClose: () => void;
  captainAddress: string;
  teamId: string;
  isBottomSheet?: boolean;
}

export default function ScoutingModal({
  isOpen,
  onClose,
  captainAddress,
  teamId,
  isBottomSheet = false,
}: ScoutingModalProps) {
  const [activeTab, setActiveTab] = useState("players");
  const [players, setPlayers] = useState<Player[]>([]);
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calculate total pages
  const totalPages = Math.ceil(
    (activeTab === "players" ? players.length : bots.length) / itemsPerPage
  );

  // Get current items
  const getCurrentItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    if (activeTab === "players") {
      return players.slice(startIndex, endIndex);
    } else {
      return bots.slice(startIndex, endIndex);
    }
  };

  useEffect(() => {
    // Reset to first page when changing tabs
    setCurrentPage(1);
  }, [activeTab]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen) return;

      try {
        if (activeTab === "players") {
          const response = await fetch("/api/players");
          if (!response.ok) {
            throw new Error("Failed to fetch unassigned players");
          }
          const players = await response.json();
          const unassignedPlayers = players.filter(
            (player: Player & { isBot?: boolean }) =>
              player.team === "Unassigned" && !player.isBot
          );
          setPlayers(unassignedPlayers);
        } else {
          const response = await fetch("/api/bots");
          if (!response.ok) {
            throw new Error("Failed to fetch bots");
          }
          const data = await response.json();
          setBots(data.bots);
        }
      } catch (err) {
        setError(`Failed to load ${activeTab}`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    fetchData();
  }, [activeTab, isOpen]);

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
          rounded-t-xl w-full max-w-4xl h-[90vh] flex flex-col
          transform transition-all duration-300 ease-out
          ${isBottomSheet ? "animate-slide-up" : "animate-fade-in"}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Scouting</h2>
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

          <div className="flex border-b border-gray-700 mb-4">
            <button
              className={`flex-1 py-2 text-center text-sm ${
                activeTab === "players"
                  ? "text-white border-b-2 border-green-500"
                  : "text-gray-400"
              }`}
              onClick={() => setActiveTab("players")}
            >
              Players
            </button>
            <button
              className={`flex-1 py-2 text-center text-sm ${
                activeTab === "bots"
                  ? "text-white border-b-2 border-green-500"
                  : "text-gray-400"
              }`}
              onClick={() => setActiveTab("bots")}
            >
              Bots
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
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto -mx-2 sm:mx-0 h-[65vh]">
                <table className="w-full">
                  <thead className="sticky top-0 bg-[#1a1d21] z-10">
                    <tr className="text-gray-400 border-b border-gray-700">
                      <th className="py-2 px-2 text-left text-xs">Name</th>
                      <th className="py-2 px-2 text-center text-xs">STR</th>
                      <th className="py-2 px-2 text-center text-xs">STA</th>
                      <th className="py-2 px-2 text-center text-xs">PAS</th>
                      <th className="py-2 px-2 text-center text-xs">SHO</th>
                      <th className="py-2 px-2 text-center text-xs">DEF</th>
                      <th className="py-2 px-2 text-center text-xs">SPD</th>
                      <th className="py-2 px-2 text-center text-xs">POS</th>
                      <th className="py-2 px-2 text-center text-xs">WRK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getCurrentItems().length > 0 ? (
                      getCurrentItems().map((item) => (
                        <tr
                          key={
                            activeTab === "players"
                              ? (item as Player)._id
                              : item.ethAddress
                          }
                          className="text-gray-300 border-b border-gray-700 active:bg-[#2a2d31]/50 hover:bg-[#2a2d31]/50 transition-colors duration-200 cursor-pointer"
                          onClick={() => {
                            if (activeTab === "players") {
                              setSelectedPlayer(item as Player);
                            } else {
                              setSelectedBot(item as Bot);
                            }
                          }}
                        >
                          <td className="py-2 px-2 text-xs">
                            {activeTab === "players" &&
                            (item as Player).username
                              ? (item as Player).username
                              : item.playerName}
                          </td>
                          <td className="py-2 px-2 text-center text-xs">
                            {Math.round(item.stats.strength)}
                          </td>
                          <td className="py-2 px-2 text-center text-xs">
                            {Math.round(item.stats.stamina)}
                          </td>
                          <td className="py-2 px-2 text-center text-xs">
                            {Math.round(item.stats.passing)}
                          </td>
                          <td className="py-2 px-2 text-center text-xs">
                            {Math.round(item.stats.shooting)}
                          </td>
                          <td className="py-2 px-2 text-center text-xs">
                            {Math.round(item.stats.defending)}
                          </td>
                          <td className="py-2 px-2 text-center text-xs">
                            {Math.round(item.stats.speed)}
                          </td>
                          <td className="py-2 px-2 text-center text-xs">
                            {Math.round(item.stats.positioning)}
                          </td>
                          <td className="py-2 px-2 text-center text-xs">
                            {Math.round(item.stats.workEthic)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={9}
                          className="py-4 text-center text-gray-400"
                        >
                          No {activeTab} available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center mt-4 space-x-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className={`px-2 py-1 rounded ${
                      currentPage === 1
                        ? "text-gray-500 cursor-not-allowed"
                        : "text-white hover:bg-gray-700"
                    }`}
                  >
                    &lt;
                  </button>

                  <span className="text-sm text-gray-300">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className={`px-2 py-1 rounded ${
                      currentPage === totalPages
                        ? "text-gray-500 cursor-not-allowed"
                        : "text-white hover:bg-gray-700"
                    }`}
                  >
                    &gt;
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Hire Bot Modal */}
      <HireBotModal
        isOpen={!!selectedBot}
        onClose={() => setSelectedBot(null)}
        onConfirm={async () => {
          if (!selectedBot) return;

          try {
            const response = await fetch("/api/teams/hire-bot", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                botAddress: selectedBot.ethAddress,
                captainAddress: captainAddress,
              }),
            });

            if (!response.ok) {
              const data = await response.json();
              throw new Error(data.error || "Failed to hire bot");
            }

            setSuccess(`Successfully hired ${selectedBot.playerName}!`);

            // Remove the hired bot from the available bots list
            setBots((prevBots) =>
              prevBots.filter((b) => b.ethAddress !== selectedBot.ethAddress)
            );
          } catch (err: any) {
            setError(err.message || "Failed to hire bot");
          }
          setSelectedBot(null);
        }}
        botName={selectedBot?.playerName || ""}
      />

      {/* Hire Player Modal */}
      <HirePlayerModal
        isOpen={!!selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
        onConfirm={async () => {
          if (!selectedPlayer || !teamId) return;

          try {
            const response = await fetch("/api/notifications", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ethAddress: captainAddress,
              },
              body: JSON.stringify({
                fromTeamId: teamId,
                toPlayerId: selectedPlayer.playerId,
                type: "TEAM_INVITATION",
              }),
            });

            if (!response.ok) {
              const data = await response.json();
              throw new Error(data.error || "Failed to send invitation");
            }

            const displayName =
              selectedPlayer.username && selectedPlayer.username.trim() !== ""
                ? selectedPlayer.username
                : selectedPlayer.playerName;

            setSuccess(`Successfully sent invitation to ${displayName}!`);

            // Remove the invited player from the available players list
            setPlayers((prevPlayers) =>
              prevPlayers.filter((p) => p._id !== selectedPlayer._id)
            );
          } catch (err: any) {
            setError(err.message || "Failed to send invitation");
          }
          setSelectedPlayer(null);
        }}
        playerName={selectedPlayer?.playerName || ""}
        username={selectedPlayer?.username}
      />
    </div>
  );
}
