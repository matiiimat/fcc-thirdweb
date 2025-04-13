import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import mongoose, { Types } from "mongoose";
import TeamModel, { ITactic } from "@/app/models/Team";
import PlayerModel, { IPlayer, Position, IPlayerStats } from "@/app/models/Player";
import { simulateTeamMatch } from "@/app/lib/teamMatchEngine";
import { updateTeamStats } from "@/app/lib/teamStats";
import connectDB from "../../../lib/mongodb";

interface MongoTactic extends ITactic {
  _id: Types.ObjectId;
}

interface PlayerWithStats {
  ethAddress: string;
  username: string;
  position: Position;
  stats: IPlayerStats;
}

const requestSchema = z.object({
  homeTeamId: z.string(),
  awayTeamId: z.string(),
  homeTacticId: z.string().optional(),
  awayTacticId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Parse and validate request body
    const body = await request.json();
    console.log("Received match request:", body);
    
    const validationResult = requestSchema.safeParse(body);
    if (!validationResult.success) {
      console.error("Invalid request body:", validationResult.error);
      return NextResponse.json(
        { error: "Invalid request body", details: validationResult.error },
        { status: 400 }
      );
    }

    const { homeTeamId, awayTeamId, homeTacticId, awayTacticId } = validationResult.data;

    // Fetch teams
    const [homeTeam, awayTeam] = await Promise.all([
      TeamModel.findById(homeTeamId),
      TeamModel.findById(awayTeamId),
    ]);

    if (!homeTeam) {
      console.error("Home team not found:", homeTeamId);
      return NextResponse.json(
        { error: "Home team not found" },
        { status: 404 }
      );
    }

    if (!awayTeam) {
      console.error("Away team not found:", awayTeamId);
      return NextResponse.json(
        { error: "Away team not found" },
        { status: 404 }
      );
    }

    console.log("Found teams:", {
      homeTeam: homeTeam.teamName,
      awayTeam: awayTeam.teamName
    });

    // Get tactics
    const homeTactic = homeTacticId
      ? homeTeam.tactics.find((t: MongoTactic) => t._id.toString() === homeTacticId)
      : homeTeam.tactics[0];

    const awayTactic = awayTacticId
      ? awayTeam.tactics.find((t: MongoTactic) => t._id.toString() === awayTacticId)
      : awayTeam.tactics[0];

    // Fetch players
    const [homePlayers, awayPlayers] = await Promise.all([
      PlayerModel.find({ ethAddress: { $in: homeTeam.players } }),
      PlayerModel.find({ ethAddress: { $in: awayTeam.players } }),
    ]);

    console.log("Found players:", {
      homePlayers: homePlayers.length,
      awayPlayers: awayPlayers.length
    });

    // Map players to their positions from tactics
    const mapPlayersWithPositions = (
      players: IPlayer[],
      tactic: ITactic
    ): PlayerWithStats[] => {
      return tactic.playerPositions
        .map((pos) => {
          const player = players.find(
            (p) => p.ethAddress === pos.ethAddress
          );
          if (!player) {
            console.warn(`Player not found for position: ${pos.ethAddress}`);
            return null;
          }

          return {
            ethAddress: player.ethAddress,
            username: player.username,
            position: pos.position,
            stats: player.stats,
          };
        })
        .filter((p): p is PlayerWithStats => p !== null);
    };

    const homeMappedPlayers = mapPlayersWithPositions(homePlayers, homeTactic);
    const awayMappedPlayers = mapPlayersWithPositions(awayPlayers, awayTactic);

    console.log("Mapped players to positions:", {
      homeMappedPlayers: homeMappedPlayers.length,
      awayMappedPlayers: awayMappedPlayers.length
    });

    // Check for special cases
    const homeHasEnoughPlayers = homeMappedPlayers.length >= 7;
    const awayHasEnoughPlayers = awayMappedPlayers.length >= 7;

    if (!homeHasEnoughPlayers && !awayHasEnoughPlayers) {
      console.log("Both teams don't have enough players, returning 0-0");
      const matchData = {
        id: new Types.ObjectId().toString(),
        homeTeam: homeTeam.teamName,
        awayTeam: awayTeam.teamName,
        date: new Date().toISOString(),
        isCompleted: true,
        homeTactic,
        awayTactic,
        result: {
          homeScore: 0,
          awayScore: 0,
        },
        homeStats: {
          possession: 50,
          shots: 0,
          shotsOnTarget: 0,
          passes: 0,
          tackles: 0,
          fouls: 0,
        },
        awayStats: {
          possession: 50,
          shots: 0,
          shotsOnTarget: 0,
          passes: 0,
          tackles: 0,
          fouls: 0,
        },
        homePlayerRatings: [],
        awayPlayerRatings: [],
        events: [],
      };

      // Update both teams with the match result
      await Promise.all([
        TeamModel.findByIdAndUpdate(homeTeam._id, {
          $push: { matches: matchData },
        }),
        TeamModel.findByIdAndUpdate(awayTeam._id, {
          $push: { matches: matchData },
        }),
      ]);

      return NextResponse.json({ match: matchData });
    }

    if (!homeHasEnoughPlayers || !awayHasEnoughPlayers) {
      console.log("One team doesn't have enough players, awarding 3-0 win");
      const winner = homeHasEnoughPlayers ? homeTeam : awayTeam;
      const loser = homeHasEnoughPlayers ? awayTeam : homeTeam;
      const winnerTactic = homeHasEnoughPlayers ? homeTactic : awayTactic;
      const loserTactic = homeHasEnoughPlayers ? awayTactic : homeTactic;
      const winnerMappedPlayers = homeHasEnoughPlayers ? homeMappedPlayers : awayMappedPlayers;
      const loserMappedPlayers = homeHasEnoughPlayers ? awayMappedPlayers : homeMappedPlayers;

      const matchData = {
        id: new Types.ObjectId().toString(),
        homeTeam: homeTeam.teamName,
        awayTeam: awayTeam.teamName,
        date: new Date().toISOString(),
        isCompleted: true,
        homeTactic,
        awayTactic,
        result: {
          homeScore: homeHasEnoughPlayers ? 3 : 0,
          awayScore: homeHasEnoughPlayers ? 0 : 3,
        },
        homeStats: {
          possession: homeHasEnoughPlayers ? 70 : 30,
          shots: homeHasEnoughPlayers ? 15 : 5,
          shotsOnTarget: homeHasEnoughPlayers ? 8 : 2,
          passes: homeHasEnoughPlayers ? 400 : 200,
          tackles: homeHasEnoughPlayers ? 20 : 10,
          fouls: homeHasEnoughPlayers ? 8 : 12,
        },
        awayStats: {
          possession: homeHasEnoughPlayers ? 30 : 70,
          shots: homeHasEnoughPlayers ? 5 : 15,
          shotsOnTarget: homeHasEnoughPlayers ? 2 : 8,
          passes: homeHasEnoughPlayers ? 200 : 400,
          tackles: homeHasEnoughPlayers ? 10 : 20,
          fouls: homeHasEnoughPlayers ? 12 : 8,
        },
        homePlayerRatings: homeMappedPlayers.map(p => ({
          ethAddress: p.ethAddress,
          rating: homeHasEnoughPlayers ? 7.5 : 4.5,
        })),
        awayPlayerRatings: awayMappedPlayers.map(p => ({
          ethAddress: p.ethAddress,
          rating: homeHasEnoughPlayers ? 4.5 : 7.5,
        })),
        events: [
          {
            type: "goal",
            minute: 15,
            team: winner.teamName,
            player: winnerMappedPlayers[0].username,
          },
          {
            type: "goal",
            minute: 35,
            team: winner.teamName,
            player: winnerMappedPlayers[1].username,
          },
          {
            type: "goal",
            minute: 65,
            team: winner.teamName,
            player: winnerMappedPlayers[2].username,
          },
        ],
      };

      // Update both teams with the match result
      await Promise.all([
        TeamModel.findByIdAndUpdate(homeTeam._id, {
          $push: { matches: matchData },
        }),
        TeamModel.findByIdAndUpdate(awayTeam._id, {
          $push: { matches: matchData },
        }),
      ]);

      return NextResponse.json({ match: matchData });
    }

    const homeTeamData = {
      team: homeTeam,
      tactic: homeTactic,
      players: homeMappedPlayers,
    };

    const awayTeamData = {
      team: awayTeam,
      tactic: awayTactic,
      players: awayMappedPlayers,
    };

    // Simulate the match using the enhanced team match engine
    let matchResult;
    try {
      console.log("Starting match simulation...");
      matchResult = await simulateTeamMatch(homeTeamData, awayTeamData);
      if (!matchResult) {
        throw new Error("Match simulation produced no result");
      }
      console.log("Match simulation completed successfully");
    } catch (error) {
      console.error("Match simulation error:", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Match simulation failed" },
        { status: 500 }
      );
    }

    // Create match record
    const matchId = new Types.ObjectId().toString();
    const matchData = {
      id: matchId,
      homeTeam: homeTeam.teamName,
      awayTeam: awayTeam.teamName,
      date: new Date().toISOString(),
      isCompleted: true,
      homeTactic,
      awayTactic,
      result: {
        homeScore: matchResult.homeScore,
        awayScore: matchResult.awayScore,
      },
      homeStats: matchResult.homeStats,
      awayStats: matchResult.awayStats,
      homePlayerRatings: matchResult.homePlayerRatings,
      awayPlayerRatings: matchResult.awayPlayerRatings,
      events: matchResult.matchEvents,
    };

    console.log("Created match data:", {
      matchId,
      homeScore: matchResult.homeScore,
      awayScore: matchResult.awayScore
    });

    // Update team statistics
    let updatedHomeStats, updatedAwayStats;
    try {
      updatedHomeStats = updateTeamStats(
        homeTeam.stats,
        true,
        matchResult,
        homeTactic
      );
      updatedAwayStats = updateTeamStats(
        awayTeam.stats,
        false,
        matchResult,
        awayTactic
      );
      console.log("Team stats updated successfully");
    } catch (error) {
      console.error("Error updating team stats:", error);
      return NextResponse.json(
        { error: "Failed to update team statistics" },
        { status: 500 }
      );
    }

    // Update both teams with the match result and new statistics
    try {
      await Promise.all([
        TeamModel.findByIdAndUpdate(homeTeam._id, {
          $push: { matches: matchData },
          $set: { stats: updatedHomeStats },
        }),
        TeamModel.findByIdAndUpdate(awayTeam._id, {
          $push: { matches: matchData },
          $set: { stats: updatedAwayStats },
        }),
      ]);
      console.log("Teams updated successfully");
    } catch (error) {
      console.error("Error updating teams:", error);
      return NextResponse.json(
        { error: "Failed to update teams with match result" },
        { status: 500 }
      );
    }

    return NextResponse.json({ match: matchData });
  } catch (error) {
    console.error("Unexpected error in team match endpoint:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}