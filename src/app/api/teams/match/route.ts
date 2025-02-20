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

    // Fetch all players for both teams
    const [homePlayers, awayPlayers] = await Promise.all([
      PlayerModel.find({ ethAddress: { $in: homeTeam.players } }),
      PlayerModel.find({ ethAddress: { $in: awayTeam.players } }),
    ]);

    // Map players to their positions from tactics
    const mapPlayersWithPositions = (
      players: IPlayer[],
      tactic: ITactic
    ) => {
      return tactic.playerPositions
        .map((pos) => {
          const player = players.find(
            (p) => p.ethAddress === pos.ethAddress
          );
          if (!player) return null;

          return {
            ethAddress: player.ethAddress,
            position: pos.position as Position,
            stats: player.stats,
          };
        })
        .filter((p) => p !== null);
    };

    const homeTeamData = {
      team: homeTeam,
      tactic: homeTactic,
      players: mapPlayersWithPositions(homePlayers, homeTactic),
    };

    const awayTeamData = {
      team: awayTeam,
      tactic: awayTactic,
      players: mapPlayersWithPositions(awayPlayers, awayTactic),
    };

    // Simulate the match
    const matchResult = await simulateMatch(homeTeamData, awayTeamData);

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
    const updatedHomeStats = updateTeamStats(
      homeTeam.stats,
      true, // isHomeTeam
      matchResult,
      homeTactic
    );

    const updatedAwayStats = updateTeamStats(
      awayTeam.stats,
      false, // isHomeTeam
      matchResult,
      awayTactic
    );

    // Update both teams with the match result and new statistics
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