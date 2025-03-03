import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectDB from "../../../lib/mongodb";
import SeasonModel from "../../../models/Season";
import TeamModel from "../../../models/Team";
import MatchModel from "../../../models/Match";

// Validation schema for scheduling a match
const scheduleMatchSchema = z.object({
  homeTeamId: z.string(),
  awayTeamId: z.string(),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
});

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Validate request body
    const body = await request.json();
    const validatedData = scheduleMatchSchema.parse(body);

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

    // Find active season
    const activeSeason = await SeasonModel.findOne({
      status: "ongoing",
      startDate: { $lte: matchDate },
      endDate: { $gte: matchDate },
    });

    if (!activeSeason) {
      return NextResponse.json(
        { error: "No active season found for this date" },
        { status: 400 }
      );
    }

    // Check if both teams are registered for the season
    const homeTeamInSeason = activeSeason.registeredTeams.find(
      (t: { teamId: { toString: () => string } }) => t.teamId.toString() === validatedData.homeTeamId
    );
    const awayTeamInSeason = activeSeason.registeredTeams.find(
      (t: { teamId: { toString: () => string } }) => t.teamId.toString() === validatedData.awayTeamId
    );

    if (!homeTeamInSeason || !awayTeamInSeason) {
      return NextResponse.json(
        { error: "One or both teams are not registered for the current season" },
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

    // Check if either team already has a match on this date
    const matchDate24hrs = {
      start: new Date(matchDate.getTime() - 24 * 60 * 60 * 1000),
      end: new Date(matchDate.getTime() + 24 * 60 * 60 * 1000),
    };

    const existingMatch = await MatchModel.findOne({
      $or: [
        { homeTeamId: validatedData.homeTeamId },
        { awayTeamId: validatedData.homeTeamId },
        { homeTeamId: validatedData.awayTeamId },
        { awayTeamId: validatedData.awayTeamId },
      ],
      scheduledDate: {
        $gte: matchDate24hrs.start,
        $lte: matchDate24hrs.end,
      },
    });

    if (existingMatch) {
      return NextResponse.json(
        { error: "One or both teams already have a match scheduled within 24 hours of this time" },
        { status: 400 }
      );
    }

    // Create match
    const match = await MatchModel.create({
      homeTeamId: validatedData.homeTeamId,
      awayTeamId: validatedData.awayTeamId,
      homeTeamName: homeTeam.teamName,
      awayTeamName: awayTeam.teamName,
      scheduledDate: matchDate,
      seasonId: activeSeason._id,
      isCompleted: false,
    });

    return NextResponse.json({
      success: true,
      match,
    });
  } catch (error) {
    console.error("Error scheduling match:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to schedule match",
      },
      { status: 500 }
    );
  }
}