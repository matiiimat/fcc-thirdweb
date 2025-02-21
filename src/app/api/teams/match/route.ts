import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import mongoose, { Types } from "mongoose";
import TeamModel, { ITactic } from "@/app/models/Team";
import PlayerModel, { IPlayer, Position } from "@/app/models/Player";
import { simulateMatch } from "@/app/lib/matchEngine";
import { updateTeamStats } from "@/app/lib/teamStats";
import connectDB from "../../../lib/mongodb";

interface MongoTactic extends ITactic {
  _id: Types.ObjectId;
}

// Validation schema for the request body
const matchRequestSchema = z.object({
  homeTeamId: z.string(),
  awayTeamId: z.string(),
  homeTacticId: z.string(),
  awayTacticId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Validate request body
    const body = await request.json();
    const validatedData = matchRequestSchema.parse(body);

    // Fetch teams
    const [homeTeam, awayTeam] = await Promise.all([
      TeamModel.findById(validatedData.homeTeamId),
      TeamModel.findById(validatedData.awayTeamId),
    ]);

    if (!homeTeam || !awayTeam) {
      return NextResponse.json(
        { error: "One or both teams not found" },
        { status: 404 }
      );
    }

    // Validate teams have tactics arrays
    if (!homeTeam.tactics?.length || !awayTeam.tactics?.length) {
      return NextResponse.json(
        { error: "One or both teams don't have any tactics set up" },
        { status: 400 }
      );
    }

    // Find tactics
    const homeTactic = (homeTeam.tactics as MongoTactic[]).find(
      (t) => t._id.toString() === validatedData.homeTacticId
    );
    const awayTactic = (awayTeam.tactics as MongoTactic[]).find(
      (t) => t._id.toString() === validatedData.awayTacticId
    );

    if (!homeTactic || !awayTactic) {
      return NextResponse.json(
        { error: "One or both tactics not found" },
        { status: 404 }
      );
    }

    // Validate teams have enough players
    if (!homeTeam.players?.length || !awayTeam.players?.length) {
      return NextResponse.json(
        { error: "One or both teams don't have any players" },
        { status: 400 }
      );
    }

    // Fetch all players for both teams
    const [homePlayers, awayPlayers] = await Promise.all([
      PlayerModel.find({ ethAddress: { $in: homeTeam.players } }),
      PlayerModel.find({ ethAddress: { $in: awayTeam.players } }),
    ]);

    // Map players to their positions from tactics
    const mapPlayersWithPositions = (
      players: IPlayer[],
      tactic: ITactic,
      teamName: string
    ) => {
      if (!tactic.playerPositions?.length) {
        throw new Error(`${teamName} has no player positions set in the tactic`);
      }

      if (!players?.length) {
        throw new Error(`No players found for ${teamName}`);
      }

      const mappedPlayers = tactic.playerPositions
        .map((pos) => {
          if (!pos?.ethAddress) {
            console.warn(`Position without ethAddress found in ${teamName}'s tactic`);
            return null;
          }
          
          const player = players.find(p => p?.ethAddress === pos.ethAddress);
          
          if (!player) {
            console.warn(`Player ${pos.ethAddress} not found for ${teamName}`);
            return null;
          }

          if (!player.stats) {
            console.warn(`Player ${pos.ethAddress} has no stats for ${teamName}`);
            return null;
          }

          return {
            ethAddress: player.ethAddress,
            position: pos.position as Position,
            stats: player.stats,
          };
        })
        .filter((p) => p !== null);

      if (mappedPlayers.length === 0) {
        throw new Error(`${teamName} has no valid players with positions and stats`);
      }

      return mappedPlayers;
    };

    const homeMappedPlayers = mapPlayersWithPositions(homePlayers, homeTactic, homeTeam.teamName);
    const awayMappedPlayers = mapPlayersWithPositions(awayPlayers, awayTactic, awayTeam.teamName);

    // Validate that we have enough mapped players
    if (homeMappedPlayers.length < 7) {
      return NextResponse.json(
        { error: `${homeTeam.teamName} doesn't have enough players with positions assigned (minimum 7 required)` },
        { status: 400 }
      );
    }

    if (awayMappedPlayers.length < 7) {
      return NextResponse.json(
        { error: `${awayTeam.teamName} doesn't have enough players with positions assigned (minimum 7 required)` },
        { status: 400 }
      );
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

    // Simulate the match
    let matchResult;
    try {
      matchResult = await simulateMatch(homeTeamData, awayTeamData);
      if (!matchResult) {
        throw new Error("Match simulation produced no result");
      }
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
    };

    // Update team statistics
    let updatedHomeStats, updatedAwayStats;
    try {
      // Pass undefined if stats don't exist, let updateTeamStats handle initialization
      updatedHomeStats = updateTeamStats(
        homeTeam.stats,
        true, // isHomeTeam
        matchResult,
        homeTactic
      );

      updatedAwayStats = updateTeamStats(
        awayTeam.stats,
        false, // isHomeTeam
        matchResult,
        awayTactic
      );

      if (!updatedHomeStats || !updatedAwayStats) {
        throw new Error("Failed to generate updated statistics");
      }

      // Validate the updated stats have the required properties
      const validateStats = (stats: any, teamName: string) => {
        if (!stats.gamesPlayed || !Array.isArray(stats.tacticsUsed)) {
          throw new Error(`Invalid statistics structure for ${teamName}`);
        }
      };

      validateStats(updatedHomeStats, homeTeam.teamName);
      validateStats(updatedAwayStats, awayTeam.teamName);

    } catch (error) {
      console.error("Stats update error:", error);
      return NextResponse.json(
        {
          error: error instanceof Error
            ? `Failed to handle team statistics: ${error.message}`
            : "Failed to handle team statistics"
        },
        { status: 500 }
      );
    }

    // Update both teams with the match result and new statistics
    try {
      const [updatedHome, updatedAway] = await Promise.all([
        TeamModel.findByIdAndUpdate(homeTeam._id, {
          $push: { matches: matchData },
          $set: { stats: updatedHomeStats },
        }, { new: true }),
        TeamModel.findByIdAndUpdate(awayTeam._id, {
          $push: { matches: matchData },
          $set: { stats: updatedAwayStats },
        }, { new: true })
      ]);

      if (!updatedHome || !updatedAway) {
        throw new Error("Failed to update one or both teams");
      }
    } catch (error) {
      console.error("Database update error:", error);
      return NextResponse.json(
        { error: "Failed to save match results to database" },
        { status: 500 }
      );
    }

    // Return match result with events and updated stats
    return NextResponse.json({
      success: true,
      match: {
        ...matchData,
        events: matchResult.matchEvents,
      },
      stats: {
        home: updatedHomeStats,
        away: updatedAwayStats,
      },
    });
  } catch (error) {
    console.error("Match simulation error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to simulate match",
      },
      { status: 500 }
    );
  }
}