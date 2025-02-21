"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useActiveWallet } from "thirdweb/react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import TeamMatchPopup from "../../components/TeamMatchPopup";
import MatchScheduler from "../../components/MatchScheduler";
import { ITactic } from "../../models/Team";
import { Types } from "mongoose";

interface MongoTactic extends ITactic {
  _id: Types.ObjectId;
}

interface Team {
  _id: string;
  teamName: string;
  tactics: MongoTactic[];
  players: string[];
}

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
  events?: string[];
}

export default function MatchTestPage() {
  const router = useRouter();
  const activeWallet = useActiveWallet();
  const wallet = activeWallet?.getAccount();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedHomeTeam, setSelectedHomeTeam] = useState<Team | null>(null);
  const [selectedAwayTeam, setSelectedAwayTeam] = useState<Team | null>(null);
  const [selectedHomeTactic, setSelectedHomeTactic] =
    useState<MongoTactic | null>(null);
  const [selectedAwayTactic, setSelectedAwayTactic] =
    useState<MongoTactic | null>(null);
  const [matchResult, setMatchResult] = useState<Match | null>(null);
  const [showScheduler, setShowScheduler] = useState(false);

  useEffect(() => {
    async function fetchTeams() {
      try {
        const response = await fetch("/api/teams");
        if (!response.ok) {
          throw new Error("Failed to fetch teams");
        }
        const data = await response.json();
        setTeams(data);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to fetch teams"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchTeams();
  }, []);

  const handleSimulateMatch = async () => {
    if (
      !selectedHomeTeam ||
      !selectedAwayTeam ||
      !selectedHomeTactic ||
      !selectedAwayTactic
    ) {
      setError("Please select both teams and their tactics");
      return;
    }

    if (
      !selectedHomeTeam.players?.length ||
      !selectedAwayTeam.players?.length
    ) {
      setError("Both teams must have players");
      return;
    }

    if (
      !selectedHomeTactic.playerPositions?.length ||
      !selectedAwayTactic.playerPositions?.length
    ) {
      setError("Both teams must have player positions set in their tactics");
      return;
    }

    setSimulating(true);
    setError(null);

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
      setMatchResult(result.match);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to simulate match"
      );
    } finally {
      setSimulating(false);
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
      const response = await fetch("/api/teams/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(matchData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to schedule match");
      }

      setSuccess("Match scheduled successfully!");
    } catch (error) {
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
        <Header pageName="Match Test" xp={0} />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
            <p className="mt-2 text-gray-400">Loading teams...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d0f12] to-[#1a1d21]">
      <Header pageName="Match Test" xp={0} />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Mode Toggle */}
          <div className="flex justify-end">
            <button
              onClick={() => {
                setShowScheduler(!showScheduler);
                setError(null);
                setSuccess(null);
              }}
              className="text-sm px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              {showScheduler ? "Show Simulator" : "Show Scheduler"}
            </button>
          </div>

          {showScheduler ? (
            /* Match Scheduler */
            <MatchScheduler teams={teams} onSchedule={handleScheduleMatch} />
          ) : (
            /* Match Simulator */
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
                        const team = teams.find(
                          (t) => t._id === e.target.value
                        );
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
                          {tactic.name} ({tactic.formation} •{" "}
                          {tactic.tacticalStyle})
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
                        const team = teams.find(
                          (t) => t._id === e.target.value
                        );
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
                          {tactic.name} ({tactic.formation} •{" "}
                          {tactic.tacticalStyle})
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
            </div>
          )}

          {/* Status Messages */}
          {error && <div className="text-red-400 text-center">{error}</div>}
          {success && (
            <div className="text-green-400 text-center">{success}</div>
          )}
        </div>
      </main>
      <Footer />

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
