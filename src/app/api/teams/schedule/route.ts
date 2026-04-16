import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import mongoose, { Types } from "mongoose";
import TeamModel, { ITactic } from "@/app/models/Team";
import { Match } from "@/app/lib/match";
import PlayerModel from "@/app/models/Player";
import { matchQueue } from "@/app/lib/matchQueue";
import connectDB from "../../../lib/mongodb";

const MIN_PLAYERS_REQUIRED = 7;

// Validation schema for the request body
const scheduleRequestSchema = z.object({
  homeTeamId: z.string(),
  awayTeamId: z.string(),
  homeTacticId: z.string(),
  awayTacticId: z.string(),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
});

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Validate request body
    const body = await request.json();
    const validatedData = scheduleRequestSchema.parse(body);

    // Convert date string to Date object
    const matchDate = new Date(validatedData.date);
    const now = new Date();

    // Ensure match date is in the future
    if (matchDate <= now) {
      return NextResponse.json(
        { error: "Match date must be in the future" },
        { status: 400 }
      );
    }

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

    // Prevent scheduling matches with the MatchSchedule team
    if (homeTeam.teamName === "MatchSchedule" || awayTeam.teamName === "MatchSchedule") {
      return NextResponse.json(
        { error: "Cannot schedule matches with the MatchSchedule team" },
        { status: 400 }
      );
    }

    // Find tactics
    const homeTactic = homeTeam.tactics.find(
      (t: ITactic & { _id: Types.ObjectId }) => t._id.toString() === validatedData.homeTacticId
    );
    const awayTactic = awayTeam.tactics.find(
      (t: ITactic & { _id: Types.ObjectId }) => t._id.toString() === validatedData.awayTacticId
    );

    if (!homeTactic || !awayTactic) {
      return NextResponse.json(
        { error: "Invalid tactic selection" },
        { status: 400 }
      );
    }

    // Check if teams have enough active players
    const [homePlayers, awayPlayers] = await Promise.all([
      PlayerModel.find({ ethAddress: { $in: homeTeam.players } }),
      PlayerModel.find({ ethAddress: { $in: awayTeam.players } }),
    ]);

    const activeHomePlayers = homePlayers.filter(player => {
      const lastGameDate = player.lastGameDate ? new Date(player.lastGameDate) : null;
      return !lastGameDate || (now.getTime() - lastGameDate.getTime() >= 24 * 60 * 60 * 1000);
    });

    const activeAwayPlayers = awayPlayers.filter(player => {
      const lastGameDate = player.lastGameDate ? new Date(player.lastGameDate) : null;
      return !lastGameDate || (now.getTime() - lastGameDate.getTime() >= 24 * 60 * 60 * 1000);
    });

    if (activeHomePlayers.length < MIN_PLAYERS_REQUIRED) {
      return NextResponse.json(
        {
          error: `${homeTeam.teamName} does not have enough active players (minimum ${MIN_PLAYERS_REQUIRED} required)`,
        },
        { status: 400 }
      );
    }

    if (activeAwayPlayers.length < MIN_PLAYERS_REQUIRED) {
      return NextResponse.json(
        {
          error: `${awayTeam.teamName} does not have enough active players (minimum ${MIN_PLAYERS_REQUIRED} required)`,
        },
        { status: 400 }
      );
    }

    // Check if either team already has a match on this date
    const matchDate24hrs = {
      start: new Date(matchDate.getTime() - 24 * 60 * 60 * 1000),
      end: new Date(matchDate.getTime() + 24 * 60 * 60 * 1000),
    };

    const hasConflict = (matches: Match[]) => {
      return matches.some((match) => {
        const existingMatchDate = new Date(match.date);
        return (
          existingMatchDate > matchDate24hrs.start &&
          existingMatchDate < matchDate24hrs.end
        );
      });
    };

    if (hasConflict(homeTeam.matches)) {
      return NextResponse.json(
        {
          error: `${homeTeam.teamName} already has a match scheduled within 24 hours of this time`,
        },
        { status: 400 }
      );
    }

    if (hasConflict(awayTeam.matches)) {
      return NextResponse.json(
        {
          error: `${awayTeam.teamName} already has a match scheduled within 24 hours of this time`,
        },
        { status: 400 }
      );
    }

    // Create match record
    const matchId = new Types.ObjectId().toString();
    const matchData: Match = {
      id: matchId,
      homeTeam: homeTeam.teamName,
      awayTeam: awayTeam.teamName,
      date: matchDate.toISOString(),
      isCompleted: false,
      homeTactic,
      awayTactic,
    };

    // Add match to both teams
    await Promise.all([
      TeamModel.findByIdAndUpdate(homeTeam._id, {
        $push: { matches: matchData },
      }),
      TeamModel.findByIdAndUpdate(awayTeam._id, {
        $push: { matches: matchData },
      }),
    ]);

    // Add match to simulation queue
    await matchQueue.addMatch({
      id: matchId,
      homeTeamId: validatedData.homeTeamId,
      awayTeamId: validatedData.awayTeamId,
      homeTacticId: validatedData.homeTacticId,
      awayTacticId: validatedData.awayTacticId,
      scheduledDate: matchDate,
    });

    // Return success response
    return NextResponse.json({
      success: true,
      match: {
        ...matchData,
        queuePosition: matchQueue.getQueueLength(),
        nextMatch: matchQueue.getNextMatch(),
        activeHomePlayers: activeHomePlayers.length,
        activeAwayPlayers: activeAwayPlayers.length,
      },
    });
  } catch (error) {
    console.error("Match scheduling error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to schedule match",
      },
      { status: 500 }
    );
  }
}

// Get upcoming matches for a team
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const teamId = searchParams.get("teamId");

    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID is required" },
        { status: 400 }
      );
    }

    const team = await TeamModel.findById(teamId);
    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    // Get upcoming matches
    const now = new Date();
    const upcomingMatches = team.matches
      .filter((match: Match) => !match.isCompleted && new Date(match.date) > now)
      .sort((a: Match, b: Match) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({
      success: true,
      matches: upcomingMatches,
      queueLength: matchQueue.getQueueLength(),
      nextMatch: matchQueue.getNextMatch(),
    });
  } catch (error) {
    console.error("Error fetching upcoming matches:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch matches",
      },
      { status: 500 }
    );
  }
}