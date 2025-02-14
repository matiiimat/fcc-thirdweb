"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useActiveWallet } from "thirdweb/react";
import TeamOverview from "../components/TeamOverview";

interface Team {
  teamName: string;
  captainAddress: string;
  players: string[];
}

interface Player {
  playerName: string;
  ethAddress: string;
  team: string;
}

export default function TeamPage() {
  const router = useRouter();
  const activeWallet = useActiveWallet();
  const wallet = activeWallet?.getAccount();
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [newTeamName, setNewTeamName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (wallet) {
      fetchPlayerData();
    } else {
      setLoading(false);
    }
  }, [wallet]);

  useEffect(() => {
    if (player) {
      if (player.team && player.team !== "No Team") {
        fetchCurrentTeam();
      } else {
        fetchTeams();
      }
    }
  }, [player]);

  const fetchPlayerData = async () => {
    try {
      const response = await fetch(
        `/api/players/address/${encodeURIComponent(wallet!.address)}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch player data");
      }
      const data = await response.json();
      setPlayer(data);
    } catch (error) {
      console.error("Error fetching player:", error);
      setError("Failed to fetch player data");
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentTeam = async () => {
    if (!player?.team || player.team === "No Team") {
      return;
    }

    try {
      const response = await fetch("/api/teams");
      const teams = await response.json();
      if (!response.ok) throw new Error("Failed to fetch teams");

      const team = teams.find((t: Team) => t.teamName === player.team);
      if (team) {
        setCurrentTeam(team);
      } else {
        // If team not found, reset player's team to "No Team"
        await fetch(`/api/players/${player.ethAddress}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ team: "No Team" }),
        });
        setPlayer({ ...player, team: "No Team" });
      }
    } catch (error) {
      console.error("Error fetching current team:", error);
      // Don't set error state here as it's handled by resetting team status
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await fetch("/api/teams");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setTeams(data);
      setError(""); // Clear any existing errors
    } catch (error) {
      console.error("Error fetching teams:", error);
      // Only set error if it's not a "no teams" situation
      if (error instanceof Error && error.message !== "No teams found") {
        setError("Failed to fetch teams");
      }
    }
  };

  const handleCreateTeam = async () => {
    if (!wallet) {
      setError("Please connect your wallet");
      return;
    }

    if (!newTeamName.trim()) {
      setError("Please enter a team name");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamName: newTeamName,
          captainAddress: wallet.address,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setSuccess("Team created successfully!");
      setNewTeamName("");
      // Refresh player data to show team overview
      await fetchPlayerData();
    } catch (error: any) {
      setError(error.message || "Failed to create team");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = async (teamName: string) => {
    if (!wallet) {
      setError("Please connect your wallet");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/teams/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamName,
          playerAddress: wallet.address,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setSuccess("Successfully joined team!");
      // Refresh player data to show team overview
      await fetchPlayerData();
    } catch (error: any) {
      setError(error.message || "Failed to join team");
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveTeam = async () => {
    await fetchPlayerData();
    setCurrentTeam(null);
  };

  if (!wallet) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
        <Header pageName="Team" xp={0} />
        <div className="container max-w-md mx-auto px-6 py-6 pb-20">
          <div className="glass-container p-8 text-center rounded-2xl shadow-lg">
            <p className="text-gray-400">Please connect your wallet</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
        <Header pageName="Team" xp={0} />
        <div className="container max-w-md mx-auto px-6 py-6 pb-20">
          <div className="glass-container p-8 text-center rounded-2xl shadow-lg">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
      <Header pageName="Team" xp={0} />
      <div className="container max-w-md mx-auto px-6 py-6 pb-20">
        <div className="glass-container p-8 text-center rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-green-400 text-transparent bg-clip-text">
            Team Management
          </h2>

          {currentTeam ? (
            <TeamOverview
              team={currentTeam}
              playerAddress={wallet.address}
              onLeaveTeam={handleLeaveTeam}
            />
          ) : (
            <>
              {/* Create Team Section */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4 text-gray-200">
                  Create Team
                </h3>
                <div className="flex flex-col gap-4">
                  <input
                    type="text"
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="Enter team name"
                    className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={handleCreateTeam}
                    disabled={loading}
                    className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-green-500 text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {loading ? "Creating..." : "Create Team"}
                  </button>
                </div>
              </div>

              {/* Available Teams Section */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-200">
                  Available Teams
                </h3>
                {teams.length === 0 ? (
                  <p className="text-gray-400">No teams available</p>
                ) : (
                  <div className="space-y-4">
                    {teams.map((team) => (
                      <div
                        key={team.teamName}
                        className="p-4 rounded-lg bg-gray-800 border border-gray-700"
                      >
                        <h4 className="text-lg font-medium text-gray-200 mb-2">
                          {team.teamName}
                        </h4>
                        <p className="text-sm text-gray-400 mb-3">
                          Players: {team.players.length}
                        </p>
                        <button
                          onClick={() => handleJoinTeam(team.teamName)}
                          disabled={
                            loading ||
                            team.players.includes(wallet.address.toLowerCase())
                          }
                          className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {team.players.includes(wallet.address.toLowerCase())
                            ? "Already Joined"
                            : "Join Team"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Error and Success Messages */}
          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-500 bg-opacity-20 text-red-300">
              {error}
            </div>
          )}
          {success && (
            <div className="mt-4 p-3 rounded-lg bg-green-500 bg-opacity-20 text-green-300">
              {success}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
