import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { calculatePlayerRating, getStarRating } from "../lib/game";
import TeamMatchesSection from "./TeamMatchesSection";
import { ITactic, IJersey } from "../models/Team";
import JerseyCustomizationModal from "./JerseyCustomizationModal";
import Jersey from "./Jersey";

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

interface TeamMember {
  address: string;
  name: string;
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

const calculateOverallRating = (
  stats: TeamMember["stats"] | undefined
): number => {
  if (!stats) return 0;

  const values = Object.values(stats);
  if (values.length === 0) return 0;

  const validValues = values.filter((v) => typeof v === "number" && !isNaN(v));
  if (validValues.length === 0) return 0;

  const average = validValues.reduce((a, b) => a + b, 0) / validValues.length;
  return Math.round(average);
};

interface TeamOverviewProps {
  team: {
    teamName: string;
    captainAddress: string;
    players: string[];
    matches?: Match[];
    tactics?: ITactic[];
    jersey?: IJersey;
  };
  playerAddress: string;
  onLeaveTeam: () => void;
}

export default function TeamOverview({
  team,
  playerAddress,
  onLeaveTeam,
}: TeamOverviewProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [jerseyModalOpen, setJerseyModalOpen] = useState(false);

  const handleJerseyUpdate = async (jersey: IJersey) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/teams/jersey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamName: team.teamName,
          captainAddress: playerAddress,
          jersey,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update jersey");
      }

      // Refresh team data
      await fetchTeamMemberNames();
    } catch (error) {
      console.error("Error updating jersey:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update jersey"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMemberNames = useCallback(async () => {
    try {
      const memberPromises = team.players.map(async (address) => {
        // Check if this is a bot address
        if (address.toLowerCase().startsWith("0xbot")) {
          console.log("Fetching bot data for address:", address);
          // Fetch the specific bot
          const botsResponse = await fetch(
            `/api/bots?address=${encodeURIComponent(address)}`
          );
          if (!botsResponse.ok) {
            console.error(
              "Bot fetch response not ok:",
              await botsResponse.text()
            );
            throw new Error(`Failed to fetch bot data for ${address}`);
          }
          const botsData = await botsResponse.json();
          console.log("Bot data received:", botsData);
          const bot = botsData.bots[0];
          if (!bot) {
            console.error("No bot data found in response");
            throw new Error(`No bot data found for ${address}`);
          }
          return {
            address,
            name: bot.playerName,
            stats: bot.stats,
          };
        } else {
          // Regular player
          const response = await fetch(
            `/api/players/address/${encodeURIComponent(address)}`
          );
          if (!response.ok) {
            throw new Error(`Failed to fetch player data for ${address}`);
          }
          const data = await response.json();
          return {
            address,
            name: data.playerName,
            stats: data.stats,
          };
        }
      });

      const members = await Promise.all(memberPromises);
      setTeamMembers(members);
    } catch (error) {
      console.error("Error fetching team member names:", error);
      setError("Failed to fetch team member names");
    }
  }, [team.players, setTeamMembers, setError]);

  useEffect(() => {
    fetchTeamMemberNames();
  }, [fetchTeamMemberNames]);

  const handleLeaveTeam = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/teams/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamName: team.teamName,
          playerAddress,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to leave team");
      }

      onLeaveTeam();
    } catch (error) {
      console.error("Error leaving team:", error);
      setError(error instanceof Error ? error.message : "Failed to leave team");
    } finally {
      setLoading(false);
    }
  };

  const isTeamCaptain =
    team.captainAddress.toLowerCase() === playerAddress.toLowerCase();

  return (
    <div className="px-2 py-3">
      <div className="bg-gray-800 rounded-lg p-3 mb-3">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Jersey jersey={team.jersey} size="medium" />
          <h3 className="text-xl font-bold text-yellow-400">{team.teamName}</h3>
        </div>

        <div className="divide-y divide-gray-700">
          {teamMembers.map((member) => (
            <div
              key={member.address}
              className="flex items-center justify-between py-2"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center min-w-0">
                  <span className="text-white truncate">
                    {member.name}
                    {member.address.toLowerCase() ===
                      team.captainAddress.toLowerCase() && (
                      <span className="ml-1 text-yellow-400 font-medium">
                        (C)
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center ml-2">
                  <span className="text-[0.7rem] leading-none">
                    {getStarRating(calculatePlayerRating(member.stats))}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {isTeamCaptain && (
          <div className="space-y-2">
            <button
              onClick={() => router.push("/teammanagement")}
              className="w-full px-4 py-2 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              Manage Team
            </button>
            <button
              onClick={() => router.push("/scouting")}
              className="w-full px-4 py-2 rounded bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors"
            >
              Scouting
            </button>
          </div>
        )}

        {!isTeamCaptain && (
          <button
            onClick={handleLeaveTeam}
            disabled={loading}
            className="w-full px-4 py-2 rounded bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Leaving..." : "Leave Team"}
          </button>
        )}
      </div>

      {/* Matches Section */}
      <TeamMatchesSection
        teamName={team.teamName}
        matches={team.matches || []}
        tactics={team.tactics || []}
        isTeamCaptain={isTeamCaptain}
      />

      {/* Sponsoring Section */}
      {isTeamCaptain && (
        <div className="mt-4">
          <button
            onClick={() => setJerseyModalOpen(true)}
            className="w-full px-4 py-2 rounded bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
          >
            Sponsoring
          </button>
        </div>
      )}

      {/* Jersey Customization Modal */}
      <JerseyCustomizationModal
        isOpen={jerseyModalOpen}
        onClose={() => setJerseyModalOpen(false)}
        onSave={handleJerseyUpdate}
        currentJersey={team.jersey}
      />

      {error && (
        <div className="mt-2 text-red-400 text-center text-sm">{error}</div>
      )}
    </div>
  );
}
