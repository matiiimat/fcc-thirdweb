import { NextRequest, NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import SeasonModel from "../../../models/Season";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Find the season in registration status
    const season = await SeasonModel.findOne({ status: 'registration' });
    if (!season) {
      return NextResponse.json(
        { error: "No season in registration phase found" },
        { status: 404 }
      );
    }

    // Check if we have enough teams
    if (season.registeredTeams.length < season.minTeams) {
      return NextResponse.json(
        { error: `Need at least ${season.minTeams} teams to start season` },
        { status: 400 }
      );
    }

    // Check if we have an even number of teams
    if (season.registeredTeams.length % 2 !== 0) {
      return NextResponse.json(
        { error: "Cannot start season with odd number of teams" },
        { status: 400 }
      );
    }

    // Generate match schedule (dates and teams only)
    await season.generateSchedule();

    return NextResponse.json({
      success: true,
      message: "Season started and schedule generated",
      season
    });
  } catch (error) {
    console.error("Error starting season:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to start season",
      },
      { status: 500 }
    );
  }
} 