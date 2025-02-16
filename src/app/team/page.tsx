"use client";

import { useEffect, useState } from "react";
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

import { ITactic } from "../models/Team";

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

interface Team {
  teamName: string;
  captainAddress: string;
  players: string[];
  matches?: Match[];
  tactics?: ITactic[];
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
      // Fetch team data
      const teamResponse = await fetch("/api/teams");
      const teams = await teamResponse.json();
      if (!teamResponse.ok) throw new Error("Failed to fetch teams");

      const team = teams.find((t: Team) => t.teamName === player.team);
      if (team) {
        // Fetch matches data
        const matchesResponse = await fetch("/api/teams/matches");
        if (!matchesResponse.ok) throw new Error("Failed to fetch matches");
        const matches = await matchesResponse.json();

        // Filter matches for current team
        const teamMatches = matches.filter(
          (match: Match) =>
            match.homeTeam === team.teamName || match.awayTeam === team.teamName
        );

        // Fetch team tactics
        const tacticsResponse = await fetch(
          `/api/teams/tactics?teamName=${team.teamName}`
        );
        if (!tacticsResponse.ok) throw new Error("Failed to fetch tactics");
        const tactics = await tacticsResponse.json();

        setCurrentTeam({
          ...team,
          matches: teamMatches,
          tactics: tactics,
        });
        setLoading(false);
      } else {
        setPlayer((prev) => (prev ? { ...prev, team: "No Team" } : null));
        fetchTeams();
      }
    } catch (error) {
      console.error("Error fetching current team:", error);
      setError("Failed to fetch team data");
    }
  };

  const fetchTeams = async () => {
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
            newTeamName={newTeamName}
            loading={loading}
            onNameChange={setNewTeamName}
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
