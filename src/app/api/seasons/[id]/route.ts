import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import connectDB from "../../../lib/mongodb";
import SeasonModel from "../../../models/Season";
import TeamModel from "../../../models/Team";

// Validation schema for team registration
const registerTeamSchema = z.object({
  teamId: z.string(),
});

// Validation schema for updating season status
const updateStatusSchema = z.object({
  action: z.enum(['start', 'end']),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const season = await SeasonModel.findById(params.id);
    if (!season) {
      return NextResponse.json(
        { error: "Season not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = registerTeamSchema.parse(body);

    // Check if team exists
    const team = await TeamModel.findById(validatedData.teamId);
    if (!team) {
      return NextResponse.json(
        { error: "Team not found" },
        { status: 404 }
      );
    }

    // Validate season status
    if (season.status !== 'registration') {
      return NextResponse.json(
        { error: "Season is not open for registration" },
        { status: 400 }
      );
    }

    // Check if team is already registered
    if (season.registeredTeams.some((t: { teamId: { equals: (id: any) => boolean } }) => t.teamId.equals(team._id))) {
      return NextResponse.json(
        { error: "Team is already registered for this season" },
        { status: 400 }
      );
    }

    // Check if season is full
    if (season.registeredTeams.length >= season.maxTeams) {
      return NextResponse.json(
        { error: "Season has reached maximum number of teams" },
        { status: 400 }
      );
    }

    // Add team to season
    season.registeredTeams.push({
      teamId: team._id,
      teamName: team.teamName,
      points: 0,
      gamesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
    });

    await season.save();

    // If we've reached minimum teams, we could optionally auto-start
    const shouldAutoStart = season.registeredTeams.length >= season.minTeams;

    return NextResponse.json({
      success: true,
      season,
      canStart: shouldAutoStart,
    });
  } catch (error) {
    console.error("Error registering team for season:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to register team",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const season = await SeasonModel.findById(params.id);
    if (!season) {
      return NextResponse.json(
        { error: "Season not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateStatusSchema.parse(body);

    if (validatedData.action === 'start') {
      // Validate we can start the season
      if (season.status !== 'registration') {
        return NextResponse.json(
          { error: "Season is not in registration phase" },
          { status: 400 }
        );
      }

      if (season.registeredTeams.length < season.minTeams) {
        return NextResponse.json(
          { error: `Need at least ${season.minTeams} teams to start season` },
          { status: 400 }
        );
      }

      // Generate match schedule
      await season.generateSchedule();

      return NextResponse.json({
        success: true,
        message: "Season started and schedule generated",
        season,
      });
    } else if (validatedData.action === 'end') {
      // Validate we can end the season
      if (season.status !== 'ongoing') {
        return NextResponse.json(
          { error: "Season is not ongoing" },
          { status: 400 }
        );
      }

      season.status = 'completed';
      await season.save();

      return NextResponse.json({
        success: true,
        message: "Season completed",
        season,
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error updating season:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update season",
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const season = await SeasonModel.findById(params.id);
    if (!season) {
      return NextResponse.json(
        { error: "Season not found" },
        { status: 404 }
      );
    }

    // Get standings using the virtual
    const standings = season.standings;

    return NextResponse.json({
      success: true,
      season,
      standings,
    });
  } catch (error) {
    console.error("Error fetching season:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch season",
      },
      { status: 500 }
    );
  }
}