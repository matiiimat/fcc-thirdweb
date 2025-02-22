"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useActiveWallet } from "thirdweb/react";
import TeamOverview from "../components/TeamOverview";
import CreateTeamSection from "../components/CreateTeamSection";
import AvailableTeamsSection from "../components/AvailableTeamsSection";
import {
  LoadingState,
  NoWalletState,
  StatusMessages,
  PageWrapper,
} from "../components/TeamPageStates";
import { generateTeamName } from "../lib/names";
import { ITactic, ITeamStats } from "../models/Team";
import { Types } from "mongoose";

interface MongoTactic extends ITactic {
  _id: Types.ObjectId;
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
}

interface MongoTeam {
  _id: string;
  teamName: string;
  captainAddress: string;
  players: string[];
  matches?: Match[];
  tactics: MongoTactic[];
  stats: ITeamStats;
  isPublic: boolean;
  jersey?: {
    primaryColor: string;
    secondaryColor: string;
    pattern: "solid" | "stripes" | "halves" | "quarters";
    sponsorLogoUrl?: string;
  };
}

interface Team {
  _id: string;
  teamName: string;
  captainAddress: string;
  players: string[];
  matches?: Match[];
  tactics?: ITactic[];
  isPublic: boolean;
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
  const [currentTeam, setCurrentTeam] = useState<MongoTeam | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchTeams = useCallback(async () => {
    try {
      const response = await fetch("/api/teams");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setTeams(data);
      setError("");
      setLoading(false);
    } catch (error) {
      console.error("Error fetching teams:", error);
      if (error instanceof Error && error.message !== "No teams found") {
        setError("Failed to fetch teams");
      }
    }
  }, [setTeams, setError, setLoading]);

  const fetchCurrentTeam = useCallback(async () => {
    if (!player?.team || player.team === "No Team") {
      return;
    }

    try {
      // Fetch team data
      const teamResponse = await fetch("/api/teams");
      const teams = await teamResponse.json();
      if (!teamResponse.ok) throw new Error("Failed to fetch teams");

      const team = teams.find((t: Team) => t.teamName === player.team);
      if (team) {
        // Fetch team tactics
        const tacticsResponse = await fetch(
          `/api/teams/tactics?teamName=${team.teamName}`
        );
        if (!tacticsResponse.ok) throw new Error("Failed to fetch tactics");
        const tactics = await tacticsResponse.json();

        // Initialize default stats if not present
        const defaultStats: ITeamStats = {
          gamesPlayed: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          cleanSheets: 0,
          tacticsUsed: [],
        };

        setCurrentTeam({
          ...team,
          tactics: tactics,
          stats: team.stats || defaultStats,
        } as MongoTeam);
        setLoading(false);
      } else {
        setPlayer((prev) => (prev ? { ...prev, team: "No Team" } : null));
        fetchTeams();
      }
    } catch (error) {
      console.error("Error fetching current team:", error);
      setError("Failed to fetch team data");
    }
  }, [player, setCurrentTeam, setLoading, setPlayer, setError, fetchTeams]);

  const fetchPlayerData = useCallback(async () => {
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
  }, [wallet, setPlayer, setError, setLoading]);

  useEffect(() => {
    if (wallet) {
      // Reset states when component mounts
      setCurrentTeam(null);
      setPlayer(null);
      setTeams([]);
      // Fetch fresh data
      fetchPlayerData();
    } else {
      setLoading(false);
    }
  }, [wallet, fetchPlayerData, setLoading]);

  useEffect(() => {
    if (player) {
      if (player.team && player.team !== "No Team") {
        fetchCurrentTeam();
      } else {
        fetchTeams();
      }
    }
  }, [player, fetchCurrentTeam, fetchTeams]);

  const handleCreateTeam = async () => {
    if (!wallet) {
      setError("Please connect your wallet");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Generate team name from captain's address
      const { name: teamName } = generateTeamName(wallet.address);

      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamName,
          captainAddress: wallet.address,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setSuccess("Team created successfully!");
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
        headers: {
          "Content-Type": "application/json",
          ethAddress: wallet.address,
        },
        body: JSON.stringify({
          teamName: teamName,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setSuccess("Successfully joined team!");
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
    return <NoWalletState />;
  }

  if (loading) {
    return <LoadingState />;
  }

  return (
    <PageWrapper>
      {currentTeam ? (
        <TeamOverview
          team={currentTeam}
          playerAddress={wallet.address}
          onLeaveTeam={handleLeaveTeam}
        />
      ) : (
        <>
          <CreateTeamSection
            loading={loading}
            onCreateTeam={handleCreateTeam}
          />
          <AvailableTeamsSection
            teams={teams}
            loading={loading}
            playerAddress={wallet.address}
            onJoinTeam={handleJoinTeam}
          />
        </>
      )}

      <StatusMessages error={error} success={success} />
    </PageWrapper>
  );
}
