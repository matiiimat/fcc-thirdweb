"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import sdk from "@farcaster/frame-sdk";
import { useAccount, useConnect, useDisconnect } from "wagmi";
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
import JerseyCustomizationModal from "../components/JerseyCustomizationModal";
import ScoutingModal from "../components/ScoutingModal";
import ManageTeamModal from "../components/ManageTeamModal";
import TacticsModal from "../components/TacticsModal";

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
  managementCertificate: boolean;
}
export default function TeamPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<any>();
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeam, setCurrentTeam] = useState<MongoTeam | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isJerseyModalOpen, setIsJerseyModalOpen] = useState(false);
  const [isScoutingModalOpen, setIsScoutingModalOpen] = useState(false);
  const [isManageTeamModalOpen, setIsManageTeamModalOpen] = useState(false);
  const [isTacticsModalOpen, setIsTacticsModalOpen] = useState(false);

  // Farcaster Frame Integration
  useEffect(() => {
    const load = async () => {
      try {
        await sdk.actions.ready();
        setContext(await sdk.context);
      } catch (error) {
        console.error("Error initializing Farcaster Frame SDK:", error);
      }
    };

    if (!isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
    }
  }, [isSDKLoaded]);

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

  // fetchCurrentTeam is now integrated into fetchPlayerData for more efficient loading

  const fetchPlayerData = useCallback(async () => {
    try {
      if (!address) {
        setLoading(false);
        return;
      }

      // Fetch player data
      const response = await fetch(
        `/api/players/address/${encodeURIComponent(address)}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch player data");
      }
      const data = await response.json();
      setPlayer(data);

      // Initialize default stats if needed for team
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

      // If player has a team, fetch team data in the same function
      if (data.team && data.team !== "Unassigned") {
        try {
          // Fetch teams data
          const teamResponse = await fetch("/api/teams");
          const teams = await teamResponse.json();
          if (!teamResponse.ok) throw new Error("Failed to fetch teams");

          const team = teams.find((t: Team) => t.teamName === data.team);
          if (team) {
            // Fetch team tactics
            const tacticsResponse = await fetch(
              `/api/teams/tactics?teamName=${team.teamName}`
            );
            if (!tacticsResponse.ok) throw new Error("Failed to fetch tactics");
            const tactics = await tacticsResponse.json();

            setCurrentTeam({
              ...team,
              tactics: tactics,
              stats: team.stats || defaultStats,
            } as MongoTeam);
          } else {
            // Team not found, set player to "Unassigned"
            setPlayer((prev) =>
              prev ? { ...prev, team: "Unassigned" } : null
            );
            await fetchTeams();
          }
        } catch (teamError) {
          console.error("Error fetching team data:", teamError);
          setError("Failed to fetch team data");
          await fetchTeams();
        }
      } else {
        // Player has no team, fetch available teams
        await fetchTeams();
      }
    } catch (error) {
      console.error("Error fetching player:", error);
      setError("Failed to fetch player data");
    } finally {
      // Only set loading to false after ALL data is fetched
      setLoading(false);
    }
  }, [address, setPlayer, setError, setLoading, fetchTeams]);

  useEffect(() => {
    if (isConnected && address) {
      // Reset states when component mounts
      setCurrentTeam(null);
      setPlayer(null);
      setTeams([]);
      // Fetch fresh data
      fetchPlayerData();
    } else {
      setLoading(false);
    }
  }, [isConnected, address, fetchPlayerData, setLoading]);

  const handleCreateTeam = async () => {
    if (!isConnected || !address) {
      setError("Please connect your wallet");
      return;
    }

    if (!player?.managementCertificate) {
      setError(
        "You need a Management Certificate to create a team. Purchase it from the Store."
      );
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Generate team name from captain's address
      const { name: teamName } = generateTeamName(address);

      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamName,
          captainAddress: address,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setSuccess("Team created successfully!");
      setLoading(true);
      await fetchPlayerData();
    } catch (error: any) {
      setError(error.message || "Failed to create team");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = async (teamName: string) => {
    if (!isConnected || !address) {
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
          ethAddress: address,
        },
        body: JSON.stringify({
          teamName: teamName,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setSuccess("Successfully joined team!");
      setLoading(true);
      await fetchPlayerData();
    } catch (error: any) {
      setError(error.message || "Failed to join team");
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveTeam = async () => {
    setLoading(true);
    setCurrentTeam(null); // Important to update the database with null value
    await fetchPlayerData();
  };

  const handleCloseJerseyModal = () => {
    setIsJerseyModalOpen(false);
  };

  const handleSaveJersey = (jersey: any) => {
    // Implementation of handleSaveJersey
  };

  const handleOpenScoutingModal = () => {
    if (!currentTeam || !address) return;

    // Check if user is captain
    if (currentTeam.captainAddress.toLowerCase() !== address.toLowerCase()) {
      setError("Only team captains can access scouting");
      return;
    }

    setIsScoutingModalOpen(true);
  };

  const handleCloseScoutingModal = () => {
    setIsScoutingModalOpen(false);
  };

  const handleOpenManageTeamModal = () => {
    if (!currentTeam || !address) return;

    // Check if user is captain
    if (currentTeam.captainAddress.toLowerCase() !== address.toLowerCase()) {
      setError("Only team captains can manage the team");
      return;
    }

    setIsManageTeamModalOpen(true);
  };

  const handleCloseManageTeamModal = () => {
    setIsManageTeamModalOpen(false);
  };

  const handleOpenTacticsModal = () => {
    if (!currentTeam || !address) return;

    // Check if user is captain
    if (currentTeam.captainAddress.toLowerCase() !== address.toLowerCase()) {
      setError("Only team captains can manage tactics");
      return;
    }

    setIsTacticsModalOpen(true);
  };

  const handleCloseTacticsModal = () => {
    setIsTacticsModalOpen(false);
  };

  if (!isConnected || !address) {
    return <NoWalletState />;
  }

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center max-w-md mx-auto space-y-4">
          {/* Team Info Skeleton */}
          <div className="glass-container p-6 w-full rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="h-8 w-48 bg-gray-700/30 rounded animate-pulse"></div>
              <div className="h-8 w-24 bg-gray-700/30 rounded animate-pulse"></div>
            </div>

            {/* Team Stats Grid Skeleton */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex flex-col space-y-2">
                  <div className="h-4 w-16 bg-gray-700/30 rounded animate-pulse"></div>
                  <div className="h-6 w-12 bg-gray-700/30 rounded animate-pulse"></div>
                </div>
              ))}
            </div>

            {/* Players List Skeleton */}
            <div className="space-y-3">
              <div className="h-6 w-32 bg-gray-700/30 rounded animate-pulse mb-4"></div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="h-4 w-32 bg-gray-700/30 rounded animate-pulse"></div>
                  <div className="h-4 w-24 bg-gray-700/30 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Available Teams Section Skeleton */}
          <div className="glass-container p-6 w-full rounded-lg shadow-lg">
            <div className="h-6 w-48 bg-gray-700/30 rounded animate-pulse mb-4"></div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between mb-3">
                <div className="h-4 w-40 bg-gray-700/30 rounded animate-pulse"></div>
                <div className="h-8 w-24 bg-gray-700/30 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      {currentTeam ? (
        <TeamOverview
          team={currentTeam}
          playerAddress={address}
          onLeaveTeam={handleLeaveTeam}
          onOpenScouting={handleOpenScoutingModal}
          onOpenManageTeam={handleOpenManageTeamModal}
          onOpenTactics={handleOpenTacticsModal}
        />
      ) : (
        <>
          <CreateTeamSection
            loading={loading}
            onCreateTeam={handleCreateTeam}
            hasCertificate={player?.managementCertificate}
          />
          <AvailableTeamsSection
            teams={teams}
            loading={loading}
            playerAddress={address}
            onJoinTeam={handleJoinTeam}
          />
        </>
      )}

      <StatusMessages error={error} success={success} />

      <JerseyCustomizationModal
        isOpen={isJerseyModalOpen}
        onClose={handleCloseJerseyModal}
        onSave={handleSaveJersey}
        currentJersey={currentTeam?.jersey}
        isBottomSheet={true}
      />

      <ScoutingModal
        isOpen={isScoutingModalOpen}
        onClose={handleCloseScoutingModal}
        captainAddress={address}
        teamId={currentTeam?._id || ""}
        isBottomSheet={true}
      />

      <ManageTeamModal
        isOpen={isManageTeamModalOpen}
        onClose={handleCloseManageTeamModal}
        captainAddress={address}
        teamId={currentTeam?._id || ""}
        isBottomSheet={true}
      />

      <TacticsModal
        isOpen={isTacticsModalOpen}
        onClose={handleCloseTacticsModal}
        captainAddress={address}
        teamId={currentTeam?._id || ""}
        isBottomSheet={true}
      />
    </PageWrapper>
  );
}
